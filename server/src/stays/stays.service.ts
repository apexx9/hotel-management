import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDatabase } from '../database/database.decorator';
import type { Database } from '../database/database.types';
import {
  guests,
  housekeepingTasks,
  invoices,
  invoiceItems,
  payments,
  rooms,
  roomTypes,
  serviceCharges,
  stays,
} from '../database/schema';
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  not,
  notInArray,
  sql,
} from 'drizzle-orm';
import {
  CheckInDto,
  CheckOutDto,
  CreateBookingDto,
  TransferRoomDto,
  UpdateBookingDto,
} from '../shared/dto';
import {
  computeTotals,
  formatMoney,
  formatReference,
  money,
  resolvePricingValue,
  roundMoney,
} from '../common/pricing.util';
import { HotelContextService } from '../common/hotel-context.service';
import { ActivityService } from '../common/activity.service';
import { EmailDispatchService } from '../common/email-dispatch.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class StaysService {
  constructor(
    @InjectDatabase() private readonly db: Database,
    private readonly hotelContext: HotelContextService,
    private readonly activity: ActivityService,
    private readonly emailDispatch: EmailDispatchService,
    private readonly emailService: EmailService,
  ) {}

  private async findBookableRooms(
    db: { select: Database['select'] },
    opts: {
      hotelId: string;
      roomTypeId?: string;
      roomId?: string;
      checkIn: Date;
      checkOut: Date;
      guestsCount: number;
      checkInNow: boolean;
      excludeStayId?: string;
    },
  ) {
    const { hotelId, checkIn, checkOut, guestsCount, excludeStayId } = opts;

    const statusFilter = opts.checkInNow
      ? inArray(rooms.status, ['available', 'reserved'])
      : notInArray(rooms.status, ['out_of_service', 'maintenance']);

    const candidates = await db
      .select()
      .from(rooms)
      .where(
        and(
          eq(rooms.hotelId, hotelId),
          eq(rooms.isActive, true),
          statusFilter,
          gte(rooms.capacity, guestsCount || 1),
          opts.roomTypeId ? eq(rooms.roomTypeId, opts.roomTypeId) : undefined,
          opts.roomId ? eq(rooms.id, opts.roomId) : undefined,
        ),
      )
      .orderBy(asc(rooms.number));

    if (candidates.length === 0)
      return {
        candidates,
        available: [] as typeof candidates,
        blockedRoomIds: new Set<string>(),
      };

    const overlapRows = await db
      .select({ roomId: stays.roomId })
      .from(stays)
      .where(
        and(
          eq(stays.hotelId, hotelId),
          inArray(
            stays.roomId,
            candidates.map((r) => r.id),
          ),
          inArray(stays.status, ['reserved', 'pending_arrival', 'checked_in']),
          excludeStayId ? not(eq(stays.id, excludeStayId)) : undefined,
          sql`${stays.expectedCheckoutAt}::timestamptz > ${checkIn}::timestamptz AND ${stays.expectedCheckInAt}::timestamptz < ${checkOut}::timestamptz`,
        ),
      );

    const blockedRoomIds = new Set(overlapRows.map((row) => row.roomId));
    const available = candidates.filter((room) => !blockedRoomIds.has(room.id));

    return { candidates, available, blockedRoomIds };
  }

  /** Load the authoritative stay + guest + room context for an email. */
  private async loadStayEmailContext(userId: string, stayId: string) {
    const hotelId = await this.hotelContext.getRequiredHotelId(userId);

    const [stay] = await this.db
      .select()
      .from(stays)
      .where(and(eq(stays.hotelId, hotelId), eq(stays.id, stayId)))
      .limit(1);
    if (!stay) throw new NotFoundException('Booking not found');

    const [guest] = await this.db
      .select()
      .from(guests)
      .where(and(eq(guests.hotelId, hotelId), eq(guests.id, stay.guestId)))
      .limit(1);

    const [room] = await this.db
      .select()
      .from(rooms)
      .where(eq(rooms.id, stay.roomId))
      .limit(1);

    let roomType;
    if (room) {
      [roomType] = await this.db
        .select()
        .from(roomTypes)
        .where(eq(roomTypes.id, room.roomTypeId))
        .limit(1);
    }

    const { branding, currency, sender, replyTo } =
      await this.hotelContext.getHotelBranding(hotelId);

    return {
      stay,
      guest,
      room,
      roomType,
      branding,
      currency,
      sender,
      replyTo,
    };
  }

  private buildReservationEmailData(
    ctx: Awaited<ReturnType<typeof this.loadStayEmailContext>>,
  ) {
    return {
      guestName: ctx.guest?.firstName || null,
      reference: ctx.stay.reference,
      roomNumber: ctx.room?.number ?? null,
      roomType: ctx.roomType?.name ?? null,
      checkIn: ctx.stay.expectedCheckInAt?.toISOString?.() ?? null,
      checkOut: ctx.stay.expectedCheckoutAt?.toISOString?.() ?? null,
      nights: Number(ctx.stay.nights ?? 1),
      guests: Number(ctx.stay.guestsCount ?? 1),
      total: formatMoney(ctx.stay.total, ctx.currency),
      amountPaid: formatMoney(ctx.stay.amountPaid, ctx.currency),
      outstanding: formatMoney(ctx.stay.outstandingBalance, ctx.currency),
      status: ctx.stay.status ?? null,
      currency: ctx.currency,
    };
  }

  /** Best-effort, fire-and-forget confirmation email after a booking is created. */
  private async dispatchBookingConfirmation(userId: string, stayId: string) {
    try {
      const ctx = await this.loadStayEmailContext(userId, stayId);
      if (!ctx.guest?.email) return;
      const result = await this.emailService.sendBookingConfirmation(
        ctx.guest.email,
        this.buildReservationEmailData(ctx),
        ctx.branding,
        ctx.sender,
        ctx.replyTo,
      );
      if (result.ok && !result.skipped) {
        await this.db
          .update(stays)
          .set({ confirmationEmailSentAt: new Date() })
          .where(eq(stays.id, stayId));
      }
    } catch {
      // Email delivery must never break the booking flow.
    }
  }

  /** Best-effort, fire-and-forget cancellation email. */
  private async dispatchBookingCancellation(userId: string, stayId: string) {
    try {
      const ctx = await this.loadStayEmailContext(userId, stayId);
      if (!ctx.guest?.email) return;
      await this.emailService.sendBookingCancellation(
        ctx.guest.email,
        {
          guestName: ctx.guest.firstName || null,
          reference: ctx.stay.reference,
          total: formatMoney(ctx.stay.total, ctx.currency),
          currency: ctx.currency,
        },
        ctx.branding,
        ctx.sender,
        ctx.replyTo,
      );
    } catch {
      // Email delivery must never break the cancellation flow.
    }
  }

  // ==========================================
  // STAYS & BOOKINGS
  // ==========================================
  async listStays(
    userId: string,
    filters?: {
      status?: string | string[];
      guestId?: string;
      roomId?: string;
      q?: string;
    },
  ) {
    const hotelId = await this.hotelContext.getDefaultHotelId(userId);

    // Proper table-specific hotel filters
    const stayHotelFilter = hotelId ? eq(stays.hotelId, hotelId) : sql`true`;
    const roomHotelFilter = hotelId ? eq(rooms.hotelId, hotelId) : sql`true`;
    const guestHotelFilter = hotelId ? eq(guests.hotelId, hotelId) : sql`true`;
    const roomTypeHotelFilter = hotelId
      ? eq(roomTypes.hotelId, hotelId)
      : sql`true`;

    const conditions = [stayHotelFilter];
    if (filters?.status)
      conditions.push(
        Array.isArray(filters.status)
          ? inArray(stays.status, filters.status as any)
          : eq(stays.status, filters.status as any),
      );
    if (filters?.guestId) conditions.push(eq(stays.guestId, filters.guestId));
    if (filters?.roomId) conditions.push(eq(stays.roomId, filters.roomId));

    const [allStays, allRooms, allGuests, allRoomTypes] = await Promise.all([
      this.db
        .select()
        .from(stays)
        .where(and(...conditions))
        .orderBy(desc(stays.createdAt)),
      this.db.select().from(rooms).where(roomHotelFilter),
      this.db.select().from(guests).where(guestHotelFilter),
      this.db.select().from(roomTypes).where(roomTypeHotelFilter),
    ]);

    const roomById = new Map(allRooms.map((r) => [r.id, r]));
    const guestById = new Map(allGuests.map((g) => [g.id, g]));
    const roomTypeById = new Map(allRoomTypes.map((rt) => [rt.id, rt]));

    return allStays
      .map((stay) => {
        const room = roomById.get(stay.roomId);
        const guest = guestById.get(stay.guestId);
        const rt = roomTypeById.get(stay.roomTypeId);

        return {
          ...stay,
          roomNumber: room?.number ?? null,
          roomFloor: room?.floor ?? null,
          guestName: guest ? `${guest.firstName} ${guest.lastName}` : null,
          guestPhone: guest?.phone ?? null,
          guestEmail: guest?.email ?? null,
          roomTypeName: rt?.name ?? null,
        };
      })
      .filter((stay) => {
        const q = filters?.q?.trim().toLowerCase();
        if (!q) return true;
        return (
          stay.reference?.toLowerCase().includes(q) ||
          stay.guestName?.toLowerCase().includes(q) ||
          stay.roomNumber?.toLowerCase().includes(q)
        );
      });
  }

  async getStay(userId: string, id: string) {
    const hotelId = await this.hotelContext.getDefaultHotelId(userId);
    const hotelFilter = hotelId ? eq(stays.hotelId, hotelId) : sql`true`;

    const [stay] = await this.db
      .select()
      .from(stays)
      .where(and(hotelFilter, eq(stays.id, id)))
      .limit(1);

    if (!stay) throw new NotFoundException('Stay not found');

    const [guest] = await this.db
      .select()
      .from(guests)
      .where(and(eq(guests.id, stay.guestId), eq(guests.hotelId, stay.hotelId)))
      .limit(1);

    const [room] = await this.db
      .select()
      .from(rooms)
      .where(and(eq(rooms.id, stay.roomId), eq(rooms.hotelId, stay.hotelId)))
      .limit(1);

    const [roomType] = await this.db
      .select()
      .from(roomTypes)
      .where(
        and(
          eq(roomTypes.id, stay.roomTypeId),
          eq(roomTypes.hotelId, stay.hotelId),
        ),
      )
      .limit(1);

    const [invoice] = await this.db
      .select()
      .from(invoices)
      .where(eq(invoices.stayId, stay.id))
      .limit(1);

    const stayPayments = await this.db
      .select()
      .from(payments)
      .where(eq(payments.stayId, stay.id))
      .orderBy(desc(payments.createdAt));

    const charges = await this.db
      .select()
      .from(serviceCharges)
      .where(eq(serviceCharges.stayId, stay.id))
      .orderBy(desc(serviceCharges.createdAt));

    return {
      ...stay,
      guest,
      room,
      roomType,
      invoice,
      payments: stayPayments,
      serviceCharges: charges,
      roomNumber: room?.number ?? null,
      guestName: guest ? `${guest.firstName} ${guest.lastName}` : null,
      roomTypeName: roomType?.name ?? null,
    };
  }

  async getStaysByGuest(userId: string, guestId: string) {
    return this.listStays(userId, { guestId });
  }

  async getBookingAvailability(
    userId: string,
    dto: {
      roomTypeId?: string;
      roomId?: string;
      checkIn: string;
      nights: string;
      guests?: string;
      checkInNow?: string;
      excludeStayId?: string;
    },
  ) {
    const hotelId = await this.hotelContext.getRequiredHotelId(userId);

    const checkIn = new Date(dto.checkIn);
    if (Number.isNaN(checkIn.getTime())) {
      throw new BadRequestException('Invalid check-in date');
    }

    const nights = Number(dto.nights);
    if (!Number.isInteger(nights) || nights < 1) {
      throw new BadRequestException('Nights must be a positive integer');
    }

    const guests = Math.max(1, Number(dto.guests ?? 1) || 1);
    const checkOut = new Date(checkIn.getTime() + nights * 86400000);

    const { candidates, available, blockedRoomIds } =
      await this.findBookableRooms(this.db, {
        hotelId,
        roomTypeId: dto.roomTypeId,
        roomId: dto.roomId,
        checkIn,
        checkOut,
        guestsCount: guests,
        checkInNow: dto.checkInNow === 'true' || dto.checkInNow === '1',
        excludeStayId: dto.excludeStayId,
      });

    return {
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      nights,
      guests,
      roomTypeId: dto.roomTypeId ?? null,
      totalCandidates: candidates.length,
      availableCount: available.length,
      blockedByDates: blockedRoomIds.size,
      rooms: available.map((room) => ({
        id: room.id,
        number: room.number,
        floor: room.floor,
        status: room.status,
        capacity: room.capacity,
      })),
    };
  }

  async createBooking(userId: string, dto: CreateBookingDto) {
    const createdBooking = await this.db.transaction(async (tx) => {
      const user = await this.hotelContext.getCurrentUser(userId);
      const hotelId = user.hotelId;
      if (!hotelId) throw new BadRequestException('Hotel context not found');
      const hotelFilter = eq(guests.hotelId, hotelId);

      const nameConflicts = (existing: {
        firstName: string;
        lastName: string;
      }): boolean => {
        const first = dto.firstName?.trim();
        const last = dto.lastName?.trim();
        if (!first && !last) return false;
        const matches = () =>
          (!first ||
            first.toLowerCase() ===
              String(existing.firstName ?? '').toLowerCase()) &&
          (!last ||
            last.toLowerCase() ===
              String(existing.lastName ?? '').toLowerCase());
        return !matches();
      };

      let guestRecord: typeof guests.$inferSelect | undefined;
      if (dto.guestId) {
        [guestRecord] = await tx
          .select()
          .from(guests)
          .where(and(hotelFilter, eq(guests.id, dto.guestId)))
          .limit(1);
        if (!guestRecord) {
          throw new BadRequestException('Selected guest was not found');
        }
      } else {
        const lookups: Array<{
          match?: typeof guests.$inferSelect;
          by: string;
        }> = [];
        if (dto.phone) {
          const [byPhone] = await tx
            .select()
            .from(guests)
            .where(and(hotelFilter, eq(guests.phone, dto.phone)))
            .limit(1);
          lookups.push({ match: byPhone, by: 'this phone number' });
        }
        if (dto.email) {
          const [byEmail] = await tx
            .select()
            .from(guests)
            .where(and(hotelFilter, eq(guests.email, dto.email)))
            .limit(1);
          if (byEmail && !lookups.some((l) => l.match?.id === byEmail.id)) {
            lookups.push({ match: byEmail, by: 'this email' });
          }
        }
        if (dto.identificationNumber) {
          const [byId] = await tx
            .select()
            .from(guests)
            .where(
              and(
                hotelFilter,
                eq(guests.identificationNumber, dto.identificationNumber),
              ),
            )
            .limit(1);
          if (byId && !lookups.some((l) => l.match?.id === byId.id)) {
            lookups.push({ match: byId, by: 'this ID number' });
          }
        }

        const matched = lookups.find((l) => l.match)?.match;
        if (matched) {
          if (nameConflicts(matched)) {
            throw new ConflictException(
              `A guest with ${
                lookups.find((l) => l.match?.id === matched.id)?.by ??
                'these details'
              } already exists as "${matched.firstName} ${
                matched.lastName
              }". Search and select that guest instead, or update the guest's details first.`,
            );
          }
          guestRecord = matched;
        } else {
          const [createdGuest] = await tx
            .insert(guests)
            .values({
              hotelId,
              firstName: dto.firstName ?? dto.phone,
              lastName: dto.lastName ?? 'Guest',
              phone: dto.phone,
              email: dto.email,
              nationality: dto.nationality,
              identificationType: dto.identificationType,
              identificationNumber: dto.identificationNumber,
              address: dto.address,
              emergencyContact: dto.emergencyContact,
              notes: dto.notes,
            })
            .returning();
          guestRecord = createdGuest;
        }
      }

      if (!guestRecord) {
        throw new BadRequestException('Unable to resolve guest');
      }

      const checkInDate = dto.checkInNow
        ? new Date()
        : dto.expectedCheckInAt
          ? new Date(dto.expectedCheckInAt)
          : new Date();
      if (Number.isNaN(checkInDate.getTime())) {
        throw new BadRequestException('Invalid check-in date');
      }
      const checkOutDate = new Date(
        checkInDate.getTime() + dto.nights * 86400000,
      );

      const availability = await this.findBookableRooms(tx, {
        hotelId,
        roomTypeId: dto.roomTypeId,
        roomId: dto.roomId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guestsCount: dto.guestsCount,
        checkInNow: !!dto.checkInNow,
      });

      let roomRecord: (typeof availability.candidates)[number];
      if (dto.roomId) {
        const specific = availability.candidates.find(
          (room) => room.id === dto.roomId,
        );
        if (!specific) {
          throw new ConflictException(
            'This room is not bookable for the selected dates (not found, inactive, out of service, too small for the party, or already reserved).',
          );
        }
        if (availability.blockedRoomIds.has(specific.id)) {
          throw new ConflictException(
            `Room ${specific.number} is already reserved for the selected dates (${checkInDate.toLocaleDateString()} – ${checkOutDate.toLocaleDateString()}).`,
          );
        }
        roomRecord = specific;
      } else {
        if (availability.candidates.length === 0) {
          throw new ConflictException(
            dto.roomTypeId
              ? `No room of this type can host ${dto.guestsCount} guest${
                  dto.guestsCount === 1 ? '' : 's'
                } (no active rooms, all out of service, or capacity too small).`
              : `No room in this hotel can host ${dto.guestsCount} guest${
                  dto.guestsCount === 1 ? '' : 's'
                } (all out of service or too small).`,
          );
        }
        if (availability.available.length === 0) {
          throw new ConflictException(
            'All matching rooms are already reserved for the selected dates. Try different dates or another room type.',
          );
        }
        roomRecord = availability.available[0];
      }

      const [roomTypeRecord] = await tx
        .select()
        .from(roomTypes)
        .where(eq(roomTypes.id, roomRecord.roomTypeId))
        .limit(1);

      if (!roomTypeRecord) {
        throw new NotFoundException('Room type not found');
      }

      const defaults = await this.hotelContext.getHotelPricingDefaults(hotelId);
      const rate =
        dto.rate || money(roomRecord.rate) || money(roomTypeRecord.basePrice);
      const subtotal = roundMoney(rate * dto.nights);
      const discountMode = (dto.discountMode ??
        defaults.discountType ??
        'value') as 'value' | 'percentage';
      const discountValue = dto.discount ?? defaults.discountValue;
      const discount = resolvePricingValue(
        subtotal,
        discountMode,
        discountValue,
      );
      const taxMode = (dto.taxMode ?? defaults.taxType ?? 'value') as
        'value' | 'percentage';
      const taxValue = dto.taxes ?? defaults.taxValue;
      const taxes = resolvePricingValue(subtotal - discount, taxMode, taxValue);
      const totals = computeTotals({
        rate,
        nights: dto.nights,
        discount,
        taxes,
        serviceTotal: 0,
      });
      const amountPaid = dto.amountPaid ?? 0;
      const outstanding = roundMoney(Math.max(0, totals.total - amountPaid));
      const stayStatus = dto.checkInNow ? 'checked_in' : 'reserved';
      const reference = formatReference('ST');

      const [overlapStay] = await tx
        .select({ id: stays.id, reference: stays.reference })
        .from(stays)
        .where(
          and(
            eq(stays.hotelId, hotelId),
            eq(stays.roomId, (roomRecord as { id: string }).id),
            inArray(stays.status, [
              'reserved',
              'pending_arrival',
              'checked_in',
            ]),
            sql`${stays.expectedCheckoutAt}::timestamptz > ${checkInDate}::timestamptz AND ${stays.expectedCheckInAt}::timestamptz < ${checkOutDate}::timestamptz`,
          ),
        )
        .limit(1);

      if (overlapStay) {
        throw new ConflictException(
          `Room ${roomRecord.number} is already reserved for the selected dates (stay ${overlapStay.reference}).`,
        );
      }

      const [createdStay] = await tx
        .insert(stays)
        .values({
          hotelId,
          reference,
          guestId: guestRecord.id,
          roomId: roomRecord.id,
          roomTypeId: roomTypeRecord.id,
          status: stayStatus,
          expectedCheckInAt: checkInDate,
          expectedCheckoutAt: checkOutDate,
          guestsCount: dto.guestsCount,
          nights: dto.nights,
          rate: String(rate),
          discount: String(discount),
          taxes: String(taxes),
          serviceTotal: '0',
          total: String(totals.total),
          amountPaid: String(amountPaid),
          outstandingBalance: String(outstanding),
          specialRequests: dto.specialRequests,
          notes: dto.notes,
          createdByUserId: user.id,
        })
        .returning();

      const [createdInvoice] = await tx
        .insert(invoices)
        .values({
          hotelId,
          reference: formatReference('INV'),
          guestId: guestRecord.id,
          stayId: createdStay.id,
          roomId: roomRecord.id,
          status:
            amountPaid > 0
              ? outstanding > 0
                ? 'partially_paid'
                : 'paid'
              : 'issued',
          subtotal: String(totals.subtotal),
          discount: String(totals.discount),
          taxes: String(totals.taxes),
          total: String(totals.total),
          amountPaid: String(amountPaid),
          outstanding: String(outstanding),
          issuedAt: new Date(),
        })
        .returning();

      await tx.insert(invoiceItems).values([
        {
          invoiceId: createdInvoice.id,
          description: `Room ${roomRecord.number} x ${dto.nights} night(s)`,
          quantity: dto.nights,
          unitPrice: String(rate),
          total: String(roundMoney(rate * dto.nights)),
          itemType: 'room',
        },
        ...(discount > 0
          ? [
              {
                invoiceId: createdInvoice.id,
                description: 'Discount',
                quantity: 1,
                unitPrice: String(-Math.abs(discount)),
                total: String(-Math.abs(discount)),
                itemType: 'discount',
              },
            ]
          : []),
        ...(taxes > 0
          ? [
              {
                invoiceId: createdInvoice.id,
                description: 'Tax / fees',
                quantity: 1,
                unitPrice: String(taxes),
                total: String(taxes),
                itemType: 'tax',
              },
            ]
          : []),
      ]);

      if (amountPaid > 0) {
        await tx.insert(payments).values({
          hotelId,
          reference: formatReference('PMT'),
          guestId: guestRecord.id,
          stayId: createdStay.id,
          invoiceId: createdInvoice.id,
          staffId: user.id,
          method: (dto.paymentMethod ?? 'cash') as
            'cash' | 'mobile_money' | 'card' | 'bank_transfer',
          amount: String(amountPaid),
          status: outstanding > 0 ? 'partial' : 'paid',
        });
      }

      if (dto.checkInNow) {
        await tx
          .update(rooms)
          .set({
            status: 'occupied',
            updatedAt: new Date(),
          })
          .where(eq(rooms.id, roomRecord.id));
      }

      const pricingDetails = {
        discountMode,
        discountValue,
        taxMode,
        taxValue,
      };

      await this.activity.writeActivity(
        hotelId,
        user.id,
        user.fullName,
        'booking created',
        `Stay ${reference} created for ${guestRecord.firstName} ${guestRecord.lastName}. Pricing defaults applied: discount ${pricingDetails.discountValue} (${pricingDetails.discountMode}), tax ${pricingDetails.taxValue} (${pricingDetails.taxMode}).`,
        'stay',
        createdStay.id,
      );

      await this.activity.writeNotification(
        hotelId,
        'new_booking',
        'New booking created',
        `Stay ${reference} was created for Room ${roomRecord.number}.`,
        'stay',
        createdStay.id,
      );

      if (dto.checkInNow) {
        await this.activity.writeNotification(
          hotelId,
          'guest_arrival',
          'Guest arrival',
          `${guestRecord.firstName} ${guestRecord.lastName} has checked in.`,
          'stay',
          createdStay.id,
        );
      }

      return {
        guest: guestRecord,
        room: roomRecord,
        stay: createdStay,
        invoice: createdInvoice,
      };
    });

    // Best-effort, non-blocking confirmation email after the commit.
    void this.dispatchBookingConfirmation(userId, createdBooking.stay.id);

    // Guests who pay up front get their receipt immediately — the receipt
    // must not wait until checkout.
    if (money(dto.amountPaid) > 0) {
      void this.emailDispatch.dispatchInvoiceReceipt(
        userId,
        createdBooking.invoice.id,
      );
    }

    return createdBooking;
  }

  async updateBooking(userId: string, id: string, dto: UpdateBookingDto) {
    return this.db.transaction(async (tx) => {
      const user = await this.hotelContext.getCurrentUser(userId);
      const hotelId = user.hotelId;
      if (!hotelId) throw new BadRequestException('Hotel context not found');

      const [stay] = await tx
        .select()
        .from(stays)
        .where(and(eq(stays.id, id), eq(stays.hotelId, hotelId)))
        .limit(1);

      if (!stay) throw new NotFoundException('Booking not found');

      const updateFields: Partial<typeof stays.$inferInsert> = {
        updatedAt: new Date(),
      };
      const changedKeys: string[] = [];

      let nextRate = money(stay.rate);
      let nextDiscount = money(stay.discount);
      let nextTaxes = money(stay.taxes);

      if (dto.rate !== undefined) {
        nextRate = money(dto.rate);
        updateFields.rate = String(nextRate);
        changedKeys.push('rate');
      }

      const nextNights = dto.nights
        ? Number(dto.nights)
        : Number(stay.nights ?? 1);
      const nextCheckInDate = dto.expectedCheckInAt
        ? new Date(dto.expectedCheckInAt)
        : new Date(stay.expectedCheckInAt);
      if (Number.isNaN(nextCheckInDate.getTime())) {
        throw new BadRequestException('Invalid check-in date');
      }
      const nextCheckoutDate = new Date(
        nextCheckInDate.getTime() + nextNights * 86400000,
      );

      const startOfTomorrow = new Date(
        nextCheckInDate.getFullYear(),
        nextCheckInDate.getMonth(),
        nextCheckInDate.getDate() + 1,
      );
      const isDue = nextCheckInDate.getTime() < startOfTomorrow.getTime();

      if (
        ['checked_in', 'checked_out', 'cancelled'].includes(stay.status) &&
        (dto.expectedCheckInAt || dto.nights || dto.roomId)
      ) {
        throw new BadRequestException(
          'Cannot change dates, nights, or room of a stay that is checked in or completed',
        );
      }

      const currentCheckIn = new Date(stay.expectedCheckInAt).getTime();
      const currentNights = money(stay.nights);
      const checkInDateChanged =
        dto.expectedCheckInAt !== undefined &&
        nextCheckInDate.getTime() !== currentCheckIn;
      const nightsChanged =
        dto.nights !== undefined && nextNights !== currentNights;
      const changedDates = checkInDateChanged || nightsChanged;

      if (checkInDateChanged) changedKeys.push('Check-in date');
      if (nightsChanged) changedKeys.push('Nights');

      const subtotalBase = roundMoney(nextRate * nextNights);

      if (dto.discountMode !== undefined) {
        nextDiscount = resolvePricingValue(
          subtotalBase,
          dto.discountMode,
          money(dto.discount ?? nextDiscount),
        );
        updateFields.discount = String(nextDiscount);
        changedKeys.push('discountMode');
      } else if (dto.discount !== undefined) {
        nextDiscount = resolvePricingValue(subtotalBase, 'value', dto.discount);
        updateFields.discount = String(nextDiscount);
        changedKeys.push('discount');
      }

      const taxBase = roundMoney(subtotalBase - nextDiscount);

      if (dto.taxMode !== undefined) {
        nextTaxes = resolvePricingValue(
          taxBase,
          dto.taxMode,
          money(dto.taxes ?? nextTaxes),
        );
        updateFields.taxes = String(nextTaxes);
        changedKeys.push('taxMode');
      } else if (dto.taxes !== undefined) {
        nextTaxes = resolvePricingValue(taxBase, 'value', dto.taxes);
        updateFields.taxes = String(nextTaxes);
        changedKeys.push('taxes');
      }

      if (dto.notes !== undefined) {
        updateFields.notes = dto.notes;
        changedKeys.push('notes');
      }

      let targetRoom: typeof rooms.$inferSelect | null = null;
      let changedRoom = false;

      if (dto.roomId && dto.roomId !== stay.roomId) {
        const [target] = await tx
          .select()
          .from(rooms)
          .where(and(eq(rooms.id, dto.roomId), eq(rooms.hotelId, hotelId)))
          .limit(1);
        if (!target) throw new NotFoundException('Room not found');

        if (stay.status === 'reserved' || stay.status === 'pending_arrival') {
          await tx
            .update(rooms)
            .set({
              status: isDue ? 'reserved' : 'available',
              updatedAt: new Date(),
            })
            .where(eq(rooms.id, target.id));
          await tx
            .update(rooms)
            .set({ status: 'available', updatedAt: new Date() })
            .where(eq(rooms.id, stay.roomId));
        } else if (stay.status === 'checked_in') {
          await tx
            .update(rooms)
            .set({ status: 'occupied', updatedAt: new Date() })
            .where(eq(rooms.id, target.id));
          await tx
            .update(rooms)
            .set({ status: 'cleaning', updatedAt: new Date() })
            .where(eq(rooms.id, stay.roomId));
        }

        targetRoom = target;
        changedRoom = true;
        updateFields.roomId = target.id;
        updateFields.roomTypeId = target.roomTypeId;
        changedKeys.push('Room');
      }

      if (
        (stay.status === 'reserved' || stay.status === 'pending_arrival') &&
        changedDates
      ) {
        const selectedRoomId: string = updateFields.roomId ?? stay.roomId;
        const { available } = await this.findBookableRooms(tx, {
          hotelId,
          roomId: selectedRoomId,
          checkIn: nextCheckInDate,
          checkOut: nextCheckoutDate,
          guestsCount: Number(stay.guestsCount ?? 1),
          checkInNow: false,
          excludeStayId: stay.id,
        });

        if (!available.some((room) => room.id === selectedRoomId)) {
          throw new ConflictException(
            'Selected room is not available for the updated dates',
          );
        }
      }

      const nextSpecialRequests = dto.specialRequests ?? stay.specialRequests;
      updateFields.nights = nextNights;
      updateFields.expectedCheckInAt = nextCheckInDate;
      updateFields.expectedCheckoutAt = nextCheckoutDate;
      updateFields.specialRequests = nextSpecialRequests;
      if (
        dto.specialRequests !== undefined &&
        dto.specialRequests !== stay.specialRequests
      ) {
        changedKeys.push('Special requests');
      }

      if (changedKeys.length === 0) {
        throw new BadRequestException(
          'No booking fields were provided to update',
        );
      }

      if (!dto.editReason || !dto.editReason.trim()) {
        throw new BadRequestException(
          'An edit reason is required to update a booking.',
        );
      }

      const [updatedStay] = await tx
        .update(stays)
        .set(updateFields)
        .where(eq(stays.id, id))
        .returning();

      const subtotal = roundMoney(money(updatedStay.rate) * nextNights);
      const total = roundMoney(
        subtotal - money(updatedStay.discount) + money(updatedStay.taxes),
      );

      await tx
        .update(stays)
        .set({
          total: String(total),
          outstandingBalance: String(
            Math.max(0, total - money(updatedStay.amountPaid)),
          ),
          updatedAt: new Date(),
        })
        .where(eq(stays.id, id));

      const [invoice] = await tx
        .select()
        .from(invoices)
        .where(and(eq(invoices.stayId, stay.id), eq(invoices.hotelId, hotelId)))
        .limit(1);

      if (invoice) {
        await tx
          .update(invoices)
          .set({
            subtotal: String(subtotal),
            discount: String(updatedStay.discount),
            taxes: String(updatedStay.taxes),
            total: String(total),
            outstanding: String(Math.max(0, total - money(invoice.amountPaid))),
            ...(changedRoom && targetRoom ? { roomId: targetRoom.id } : {}),
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, invoice.id));

        // Keep line-items in sync with the new pricing so the checkout folio,
        // the receipt, and the finance screens never show stale room/discount/
        // tax rows after a booking edit.
        const [roomRecord] = await tx
          .select({ number: rooms.number })
          .from(rooms)
          .where(eq(rooms.id, updatedStay.roomId))
          .limit(1);

        const resolvedDiscount = money(updatedStay.discount);
        const resolvedTaxes = money(updatedStay.taxes);

        const syncItem = async (
          itemType: 'room' | 'discount' | 'tax',
          values: {
            description: string;
            quantity: number;
            unitPrice: string;
            total: string;
          } | null,
        ) => {
          const existing = await tx
            .select({ id: invoiceItems.id })
            .from(invoiceItems)
            .where(
              and(
                eq(invoiceItems.invoiceId, invoice.id),
                eq(invoiceItems.itemType, itemType),
              ),
            )
            .limit(1);

          if (existing[0]) {
            if (!values) {
              await tx
                .delete(invoiceItems)
                .where(eq(invoiceItems.id, existing[0].id));
            } else {
              await tx
                .update(invoiceItems)
                .set(values)
                .where(eq(invoiceItems.id, existing[0].id));
            }
          } else if (values) {
            await tx.insert(invoiceItems).values({
              invoiceId: invoice.id,
              itemType,
              ...values,
            });
          }
        };

        const roomTotal = roundMoney(money(updatedStay.rate) * nextNights);
        await syncItem('room', {
          description: `Room ${roomRecord?.number ?? 'room'} x ${updatedStay.nights} night(s)`,
          quantity: updatedStay.nights,
          unitPrice: String(updatedStay.rate),
          total: String(roomTotal),
        });
        await syncItem(
          'discount',
          resolvedDiscount > 0
            ? {
                description: 'Discount',
                quantity: 1,
                unitPrice: String(-Math.abs(resolvedDiscount)),
                total: String(-Math.abs(resolvedDiscount)),
              }
            : null,
        );
        await syncItem(
          'tax',
          resolvedTaxes > 0
            ? {
                description: 'Tax / fees',
                quantity: 1,
                unitPrice: String(resolvedTaxes),
                total: String(resolvedTaxes),
              }
            : null,
        );
      }

      await this.activity.writeActivity(
        hotelId,
        user.id,
        user.fullName,
        'booking updated',
        `Booking ${stay.reference} was updated (${changedKeys.join(', ')}). Reason: ${dto.editReason.trim()}.`,
        'stay',
        stay.id,
      );

      return {
        ok: true,
        stayId: updatedStay.id,
        reason: dto.editReason.trim(),
      };
    });
  }

  async cancelBooking(userId: string, id: string) {
    const result = await this.db.transaction(async (tx) => {
      const user = await this.hotelContext.getCurrentUser(userId);
      const [stay] = await tx
        .select()
        .from(stays)
        .where(and(eq(stays.id, id), eq(stays.hotelId, user.hotelId ?? '')))
        .limit(1);
      if (!stay) throw new NotFoundException('Booking not found');
      if (stay.status === 'checked_in' || stay.status === 'checked_out') {
        throw new ConflictException(
          'Only upcoming reservations can be cancelled. Check this guest out instead.',
        );
      }
      if (stay.status === 'cancelled') {
        throw new ConflictException('This booking has already been cancelled');
      }

      await tx
        .update(stays)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(stays.id, stay.id));

      // Release the room only if it is still reserved for this stay AND no
      // other active stay occupies it for overlapping or future dates.
      const [room] = await tx
        .select()
        .from(rooms)
        .where(eq(rooms.id, stay.roomId))
        .limit(1);
      if (room && room.status === 'reserved') {
        const [otherActiveStay] = await tx
          .select({ id: stays.id })
          .from(stays)
          .where(
            and(
              eq(stays.roomId, room.id),
              eq(stays.hotelId, stay.hotelId),
              not(eq(stays.id, stay.id)),
              inArray(stays.status, [
                'reserved',
                'pending_arrival',
                'checked_in',
              ]),
            ),
          )
          .limit(1);
        if (!otherActiveStay) {
          await tx
            .update(rooms)
            .set({ status: 'available', updatedAt: new Date() })
            .where(eq(rooms.id, room.id));
        }
      }

      const [invoice] = await tx
        .select()
        .from(invoices)
        .where(eq(invoices.stayId, stay.id))
        .limit(1);
      if (invoice && invoice.status !== 'cancelled') {
        await tx
          .update(invoices)
          .set({ status: 'cancelled', updatedAt: new Date() })
          .where(eq(invoices.id, invoice.id));
      }

      await this.activity.writeActivity(
        stay.hotelId,
        user.id,
        user.fullName,
        'booking cancelled',
        `Stay ${stay.reference} was cancelled.`,
        'stay',
        stay.id,
      );

      await this.activity.writeNotification(
        stay.hotelId,
        'payment_outstanding',
        'Booking cancelled',
        `Stay ${stay.reference} was cancelled.`,
        'stay',
        stay.id,
      );

      const amountPaid = money(stay.amountPaid);

      return {
        ok: true,
        stayId: stay.id,
        refundDue: amountPaid > 0 ? amountPaid : 0,
      };
    });

    // Best-effort, non-blocking cancellation email after the commit.
    void this.dispatchBookingCancellation(userId, result.stayId);

    return result;
  }

  async transferRoom(userId: string, dto: TransferRoomDto) {
    return this.db.transaction(async (tx) => {
      const user = await this.hotelContext.getCurrentUser(userId);
      const [stay] = await tx
        .select()
        .from(stays)
        .where(
          and(eq(stays.id, dto.stayId), eq(stays.hotelId, user.hotelId ?? '')),
        )
        .limit(1);
      if (!stay) throw new NotFoundException('Stay not found');
      if (stay.status === 'checked_out' || stay.status === 'cancelled') {
        throw new ConflictException('Cannot transfer a completed stay');
      }

      const [targetRoom] = await tx
        .select()
        .from(rooms)
        .where(and(eq(rooms.id, dto.roomId), eq(rooms.hotelId, stay.hotelId)))
        .limit(1);
      if (!targetRoom) throw new NotFoundException('Target room not found');

      const startOfTomorrow = new Date(
        stay.expectedCheckInAt.getFullYear(),
        stay.expectedCheckInAt.getMonth(),
        stay.expectedCheckInAt.getDate() + 1,
      );
      const isDue =
        stay.status === 'checked_in' ||
        stay.expectedCheckInAt.getTime() < startOfTomorrow.getTime();
      const targetOccupied =
        stay.status === 'checked_in'
          ? 'occupied'
          : isDue
            ? 'reserved'
            : 'available';
      if (targetRoom.status !== 'available') {
        throw new ConflictException(
          `Room ${targetRoom.number} is not available for transfer (current status: ${targetRoom.status}).`,
        );
      }

      const [targetOverlap] = await tx
        .select({ id: stays.id, reference: stays.reference })
        .from(stays)
        .where(
          and(
            eq(stays.hotelId, stay.hotelId),
            eq(stays.roomId, targetRoom.id),
            not(eq(stays.id, stay.id)),
            inArray(stays.status, [
              'reserved',
              'pending_arrival',
              'checked_in',
            ]),
            sql`${stays.expectedCheckoutAt}::timestamptz > ${stay.expectedCheckInAt}::timestamptz AND ${stays.expectedCheckInAt}::timestamptz < ${stay.expectedCheckoutAt}::timestamptz`,
          ),
        )
        .limit(1);

      if (targetOverlap) {
        throw new ConflictException(
          `Room ${targetRoom.number} is already reserved for these dates (stay ${targetOverlap.reference}).`,
        );
      }

      const [currentRoom] = await tx
        .select()
        .from(rooms)
        .where(
          and(eq(rooms.id, stay.roomId), eq(rooms.hotelId, user.hotelId ?? '')),
        )
        .limit(1);

      await tx
        .update(stays)
        .set({ roomId: targetRoom.id, updatedAt: new Date() })
        .where(eq(stays.id, stay.id));

      await tx
        .update(rooms)
        .set({ status: targetOccupied, updatedAt: new Date() })
        .where(eq(rooms.id, targetRoom.id));

      if (currentRoom && currentRoom.id !== targetRoom.id) {
        await tx
          .update(rooms)
          .set({
            status: stay.status === 'checked_in' ? 'cleaning' : 'available',
            updatedAt: new Date(),
          })
          .where(eq(rooms.id, currentRoom.id));
      }

      const [invoice] = await tx
        .select()
        .from(invoices)
        .where(eq(invoices.stayId, stay.id))
        .limit(1);
      if (invoice) {
        await tx
          .update(invoices)
          .set({ roomId: targetRoom.id, updatedAt: new Date() })
          .where(eq(invoices.id, invoice.id));
      }

      await this.activity.writeActivity(
        stay.hotelId,
        user.id,
        user.fullName,
        'room transferred',
        `Stay ${stay.reference} moved to Room ${targetRoom.number}.`,
        'stay',
        stay.id,
      );

      return { ok: true, stayId: stay.id, roomId: targetRoom.id };
    });
  }

  async checkIn(userId: string, dto: CheckInDto) {
    return this.db.transaction(async (tx) => {
      const user = await this.hotelContext.getCurrentUser(userId);
      const [stay] = await tx
        .select()
        .from(stays)
        .where(
          and(eq(stays.id, dto.stayId), eq(stays.hotelId, user.hotelId ?? '')),
        )
        .limit(1);

      if (!stay) throw new NotFoundException('Stay not found');

      if (!['reserved', 'pending_arrival'].includes(stay.status)) {
        throw new ConflictException('Only reserved stays can be checked in');
      }

      const [otherActive] = await tx
        .select({ id: stays.id })
        .from(stays)
        .where(
          and(
            eq(stays.hotelId, user.hotelId ?? ''),
            eq(stays.roomId, stay.roomId),
            inArray(stays.status, [
              'reserved',
              'pending_arrival',
              'checked_in',
            ]),
            not(eq(stays.id, stay.id)),
          ),
        )
        .limit(1);

      if (otherActive) {
        throw new ConflictException(
          'Room already has an active stay and cannot be checked in',
        );
      }

      const [room] = await tx
        .select()
        .from(rooms)
        .where(
          and(eq(rooms.id, stay.roomId), eq(rooms.hotelId, user.hotelId ?? '')),
        )
        .limit(1);

      if (!room) throw new NotFoundException('Room not found');
      if (!['available', 'reserved'].includes(room.status)) {
        throw new ConflictException('Room is not available');
      }

      await tx
        .update(stays)
        .set({
          status: 'checked_in',
          checkInAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(stays.id, stay.id));

      await tx
        .update(rooms)
        .set({
          status: 'occupied',
          updatedAt: new Date(),
        })
        .where(eq(rooms.id, room.id));

      await this.activity.writeActivity(
        stay.hotelId,
        user.id,
        user.fullName,
        'check-in completed',
        `Stay ${stay.reference} checked in.`,
        'stay',
        stay.id,
      );

      await this.activity.writeNotification(
        stay.hotelId,
        'guest_arrival',
        'Guest checked in',
        `Stay ${stay.reference} for Room ${room.number} is now active.`,
        'stay',
        stay.id,
      );

      return { ok: true, stayId: stay.id };
    });
  }

  async checkOut(userId: string, dto: CheckOutDto) {
    const result = await this.db.transaction(async (tx) => {
      const user = await this.hotelContext.getCurrentUser(userId);
      const [stay] = await tx
        .select()
        .from(stays)
        .where(
          and(eq(stays.id, dto.stayId), eq(stays.hotelId, user.hotelId ?? '')),
        )
        .limit(1);
      if (!stay) throw new NotFoundException('Stay not found');

      const [invoice] = await tx
        .select()
        .from(invoices)
        .where(eq(invoices.stayId, stay.id))
        .limit(1);
      if (!invoice) throw new NotFoundException('Invoice not found');

      const outstanding = roundMoney(
        money(invoice.total) -
          money(invoice.amountPaid) -
          (dto.amountPaid ?? 0),
      );

      if (
        outstanding > 0 &&
        !dto.overrideBalance &&
        !['admin', 'manager', 'finance', 'owner'].includes(user.role)
      ) {
        throw new ConflictException(
          'Outstanding balance must be settled before checkout or authorized with override',
        );
      }

      if (dto.amountPaid && dto.amountPaid > 0) {
        await tx.insert(payments).values({
          hotelId: stay.hotelId,
          reference: formatReference('PMT'),
          guestId: stay.guestId,
          stayId: stay.id,
          invoiceId: invoice.id,
          staffId: user.id,
          method: (dto.paymentMethod ?? 'cash') as any,
          amount: String(dto.amountPaid),
          status: outstanding > 0 ? 'partial' : 'paid',
        });
      }

      await tx
        .update(stays)
        .set({
          status: 'checked_out',
          actualCheckoutAt: new Date(),
          amountPaid: String(money(stay.amountPaid) + (dto.amountPaid ?? 0)),
          outstandingBalance: String(Math.max(0, outstanding)),
          updatedAt: new Date(),
        })
        .where(eq(stays.id, stay.id));

      const housekeepingEnabled = await this.hotelContext.isHousekeepingEnabled(
        stay.hotelId,
      );

      if (housekeepingEnabled) {
        await tx
          .update(rooms)
          .set({
            status: 'cleaning',
            updatedAt: new Date(),
          })
          .where(eq(rooms.id, stay.roomId));

        // One turnaround task per room: reuse the room's existing task row
        // (a completed "ready" cycle or an in-flight one) instead of piling up
        // a new housekeeping record on every checkout.
        const [existingTask] = await tx
          .select({ id: housekeepingTasks.id })
          .from(housekeepingTasks)
          .where(
            and(
              eq(housekeepingTasks.hotelId, stay.hotelId),
              eq(housekeepingTasks.roomId, stay.roomId),
            ),
          )
          .orderBy(desc(housekeepingTasks.createdAt))
          .limit(1);

        if (existingTask) {
          await tx
            .update(housekeepingTasks)
            .set({
              status: 'cleaning',
              stayId: stay.id,
              note: `Turnaround task from checkout ${stay.reference}`,
              updatedAt: new Date(),
            })
            .where(eq(housekeepingTasks.id, existingTask.id));
        } else {
          await tx.insert(housekeepingTasks).values({
            hotelId: stay.hotelId,
            roomId: stay.roomId,
            stayId: stay.id,
            status: 'cleaning',
            note: `Turnaround task from checkout ${stay.reference}`,
          });
        }
      } else {
        await tx
          .update(rooms)
          .set({
            status: 'available',
            updatedAt: new Date(),
          })
          .where(eq(rooms.id, stay.roomId));
      }

      await tx
        .update(invoices)
        .set({
          amountPaid: String(money(invoice.amountPaid) + (dto.amountPaid ?? 0)),
          outstanding: String(Math.max(0, outstanding)),
          status: outstanding <= 0 ? 'paid' : 'partially_paid',
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoice.id));

      await this.activity.writeActivity(
        stay.hotelId,
        user.id,
        user.fullName,
        'checkout completed',
        housekeepingEnabled
          ? `Stay ${stay.reference} checked out. Room sent to housekeeping.`
          : `Stay ${stay.reference} checked out. Room released for availability.`,
        'stay',
        stay.id,
      );

      await this.activity.writeNotification(
        stay.hotelId,
        'checkout_completed',
        'Checkout completed',
        `Guest has been checked out of stay ${stay.reference}.`,
        'stay',
        stay.id,
      );

      return {
        ok: true,
        outstanding: Math.max(0, outstanding),
        invoiceId: invoice.id,
      };
    });

    // Best-effort, non-blocking checkout/receipt email after the commit.
    void this.emailDispatch.dispatchInvoiceReceipt(userId, result.invoiceId);

    return result;
  }

  /** Manually re-send the reservation confirmation email for a stay. */
  async sendReservationConfirmation(userId: string, stayId: string) {
    const user = await this.hotelContext.getCurrentUser(userId);
    const hotelId = user.hotelId;
    if (!hotelId) throw new BadRequestException('Hotel context not found');

    const ctx = await this.loadStayEmailContext(userId, stayId);
    if (!ctx.guest?.email) {
      throw new BadRequestException('Guest has no email address on file.');
    }

    const result = await this.emailService.sendBookingConfirmation(
      ctx.guest.email,
      this.buildReservationEmailData(ctx),
      ctx.branding,
      ctx.sender,
      ctx.replyTo,
    );

    if (result.ok && !result.skipped) {
      await this.db
        .update(stays)
        .set({ confirmationEmailSentAt: new Date() })
        .where(eq(stays.id, stayId));
    }

    await this.activity.writeActivity(
      hotelId,
      user.id,
      user.fullName,
      'confirmation sent',
      result.skipped
        ? `Reservation ${ctx.stay.reference} confirmation queued for ${ctx.guest.email} (SMTP not configured).`
        : result.ok
          ? `Reservation ${ctx.stay.reference} confirmation sent to ${ctx.guest.email}.`
          : `Reservation ${ctx.stay.reference} confirmation failed to send to ${ctx.guest.email}.`,
      'stay',
      stayId,
    );

    return {
      ok: result.ok,
      skipped: result.skipped,
      info: result,
      to: ctx.guest.email,
    };
  }
}
