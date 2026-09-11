import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDatabase } from '../database/database.decorator';
import type { Database } from '../database/database.types';
import {
  activityLogs,
  guests,
  hotels,
  hotelSettings,
  housekeepingTasks,
  invitations,
  invoices,
  invoiceItems,
  notifications,
  payments,
  rooms,
  roomTypes,
  serviceCharges,
  services,
  stays,
  users,
} from '../database/schema';
import {
  and,
  asc,
  desc,
  eq,
  isNull,
  sql,
  or,
  inArray,
  not,
  notInArray,
  gte,
  ilike,
} from 'drizzle-orm';
import {
  CheckInDto,
  CheckOutDto,
  CreateBookingDto,
  CreateGuestDto,
  CreateHousekeepingTaskDto,
  CreatePaymentDto,
  CreateRoomTypeDto,
  CreateServiceChargeDto,
  CreateServiceDto,
  InviteStaffDto,
  QueryReportsDto,
  UpdateBookingDto,
  UpdateGuestDto,
  UpdateHousekeepingDto,
  UpdateRoomTypeDto,
  UpdateServiceDto,
  UpdateSettingsDto,
  TransferRoomDto,
  UpdateStaffDto,
} from './dto';
import * as crypto from 'crypto';
import { EmailConfig } from '../email/email.config';
import { EmailService } from '../email/email.service';
import { ReceiptsService } from '../receipts/receipts.service';

type UserContext = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  hotelId: string | null;
};

const money = (value: unknown) => Number(value ?? 0);

const formatReference = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const roundMoney = (value: number) => Math.round(value * 100) / 100;

@Injectable()
export class OperationsService {
  constructor(
    @InjectDatabase() private readonly db: Database,
    private readonly emailService: EmailService,
    private readonly emailConfig: EmailConfig,
    private readonly receiptsService: ReceiptsService,
  ) {}

  private async getUserContext(userId: string): Promise<UserContext> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    return user;
  }

  private async getDefaultHotelId(userId: string): Promise<string | null> {
    const user = await this.getUserContext(userId);
    return user.hotelId ?? null;
  }

  private async getRequiredHotelId(userId: string): Promise<string> {
    const hotelId = await this.getDefaultHotelId(userId);
    if (!hotelId) {
      throw new BadRequestException('Hotel context not found');
    }
    return hotelId;
  }

  private async getCurrentUser(userId: string) {
    return this.getUserContext(userId);
  }

  private formatMoney(value: unknown, currency: string): string {
    return `${currency} ${Number(value ?? 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  private async getHotelBranding(hotelId: string) {
    const [settings] = await this.db
      .select()
      .from(hotelSettings)
      .where(eq(hotelSettings.hotelId, hotelId))
      .limit(1);

    return {
      settings,
      currency: settings?.currency || 'GHS',
      branding: {
        hotelName: settings?.name ?? null,
        hotelAddress: settings?.address ?? null,
        hotelPhone: settings?.phone ?? null,
        hotelEmail: settings?.email ?? null,
        logoUrl: settings?.logoUrl ?? null,
        primaryColor: settings?.primaryColor ?? null,
        accentColor: settings?.accentColor ?? null,
      },
      sender: {
        name: settings?.emailFromName ?? settings?.name ?? null,
      },
      replyTo: settings?.emailFrom ?? settings?.email ?? null,
    };
  }

  /**
   * Date-aware room availability. Returns candidate rooms (bookable by
   * physical state and capacity) plus which of them are blocked by
   * overlapping active stays.
   */
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
    const hotelId = await this.getRequiredHotelId(userId);

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
      await this.getHotelBranding(hotelId);

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
      total: this.formatMoney(ctx.stay.total, ctx.currency),
      amountPaid: this.formatMoney(ctx.stay.amountPaid, ctx.currency),
      outstanding: this.formatMoney(ctx.stay.outstandingBalance, ctx.currency),
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
          total: this.formatMoney(ctx.stay.total, ctx.currency),
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

  /** Build + send the branded receipt (with PDF attachment when possible). */
  private async deliverInvoiceReceipt(
    userId: string,
    invoiceId: string,
    to?: string,
  ) {
    const context = await this.receiptsService.getReceiptContext(
      userId,
      invoiceId,
    );
    const rendered = this.receiptsService.renderReceipt(context);

    const finalTo = to ?? context.guest?.email;
    if (!finalTo) {
      throw new BadRequestException(
        'Guest has no email address on file. Specify a recipient email instead.',
      );
    }

    let attachments;
    try {
      const pdf = await this.receiptsService.getReceiptPdf(context);
      attachments = [
        {
          filename: pdf.filename,
          content: pdf.pdf,
          contentType: 'application/pdf',
        },
      ];
    } catch {
      // PDF generation failed — send HTML-only so email still goes out.
    }

    const result = await this.emailService.send({
      to: finalTo,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
      attachments,
      sender: context.sender,
      replyTo: context.replyTo || undefined,
    });

    return { result, to: finalTo };
  }

  /** Best-effort, fire-and-forget receipt email after payment/checkout. */
  private async dispatchInvoiceReceipt(userId: string, invoiceId: string) {
    try {
      const delivery = await this.deliverInvoiceReceipt(userId, invoiceId);
      if (delivery.result.ok && !delivery.result.skipped) {
        await this.db
          .update(invoices)
          .set({ receiptEmailSentAt: new Date() })
          .where(eq(invoices.id, invoiceId));
      }
    } catch {
      // Email delivery must never break the payment flow.
    }
  }

  private async writeActivity(
    hotelId: string,
    actorUserId: string | null,
    actorName: string | null,
    event: string,
    description: string,
    referenceType?: string,
    referenceId?: string,
  ) {
    await this.db.insert(activityLogs).values({
      hotelId,
      actorUserId,
      actorName,
      event,
      description,
      referenceType,
      referenceId,
    });
  }

  private async writeNotification(
    hotelId: string,
    type:
      | 'checkout_completed'
      | 'checkout_overdue'
      | 'payment_outstanding'
      | 'room_ready'
      | 'room_unavailable'
      | 'maintenance_issue'
      | 'new_booking'
      | 'guest_arrival'
      | 'service_charge_added',
    title: string,
    message: string,
    referenceType?: string,
    referenceId?: string,
  ) {
    await this.db.insert(notifications).values({
      hotelId,
      type,
      title,
      message,
      referenceType,
      referenceId,
    });
  }

  private computeTotals(payload: {
    rate: number;
    nights: number;
    discount?: number;
    taxes?: number;
    serviceTotal?: number;
  }) {
    const subtotal = roundMoney(payload.rate * payload.nights);
    const discount = roundMoney(payload.discount ?? 0);
    const taxes = roundMoney(payload.taxes ?? 0);
    const serviceTotal = roundMoney(payload.serviceTotal ?? 0);
    const total = roundMoney(subtotal - discount + taxes + serviceTotal);
    return { subtotal, discount, taxes, serviceTotal, total };
  }

  private resolvePricingValue(
    amount: number,
    mode: 'value' | 'percentage' | undefined,
    value: number,
  ) {
    if (mode === 'percentage') {
      return roundMoney((amount * (value ?? 0)) / 100);
    }
    return roundMoney(value ?? 0);
  }

  private async getHotelPricingDefaults(hotelId: string) {
    const [settings] = await this.db
      .select()
      .from(hotelSettings)
      .where(eq(hotelSettings.hotelId, hotelId))
      .limit(1);

    return {
      taxType: settings?.defaultTaxType ?? 'value',
      taxValue: money(settings?.defaultTaxValue ?? 0),
      discountType: settings?.defaultDiscountType ?? 'value',
      discountValue: money(settings?.defaultDiscountValue ?? 0),
    };
  }

  private async isHousekeepingEnabled(hotelId: string): Promise<boolean> {
    const [settings] = await this.db
      .select({ systemPrefs: hotelSettings.systemPrefs })
      .from(hotelSettings)
      .where(eq(hotelSettings.hotelId, hotelId))
      .limit(1);

    if (!settings?.systemPrefs) return true;

    try {
      const prefs = JSON.parse(settings.systemPrefs) as {
        housekeepingEnabled?: boolean;
      };
      return prefs.housekeepingEnabled !== false;
    } catch {
      return true;
    }
  }

  // ==========================================
  // DASHBOARD
  // ==========================================
  async dashboard(userId: string) {
    const hotelId = await this.getDefaultHotelId(userId);
    const roomFilter = hotelId ? eq(rooms.hotelId, hotelId) : sql`true`;
    const roomTypeFilter = hotelId ? eq(roomTypes.hotelId, hotelId) : sql`true`;
    const guestFilter = hotelId ? eq(guests.hotelId, hotelId) : sql`true`;
    const stayFilter = hotelId ? eq(stays.hotelId, hotelId) : sql`true`;
    const paymentFilter = hotelId ? eq(payments.hotelId, hotelId) : sql`true`;
    const housekeepingFilter = hotelId
      ? eq(housekeepingTasks.hotelId, hotelId)
      : sql`true`;
    const activityFilter = hotelId
      ? eq(activityLogs.hotelId, hotelId)
      : sql`true`;

    const [
      allRooms,
      allRoomTypes,
      allGuests,
      allStays,
      allPayments,
      housekeeping,
      logs,
    ] = await Promise.all([
      this.db.select().from(rooms).where(roomFilter),
      this.db.select().from(roomTypes).where(roomTypeFilter),
      this.db.select().from(guests).where(guestFilter),
      this.db.select().from(stays).where(stayFilter),
      this.db.select().from(payments).where(paymentFilter),
      this.db.select().from(housekeepingTasks).where(housekeepingFilter),
      this.db
        .select()
        .from(activityLogs)
        .where(activityFilter)
        .orderBy(desc(activityLogs.createdAt))
        .limit(20),
    ]);

    const roomById = new Map(allRooms.map((room) => [room.id, room]));
    const guestById = new Map(allGuests.map((guest) => [guest.id, guest]));

    const currentStays = allStays.filter(
      (stay) => stay.status === 'checked_in',
    );
    const occupiedRooms = allRooms.filter((room) => room.status === 'occupied');
    const availableRooms = allRooms.filter(
      (room) => room.status === 'available',
    );
    const todayIso = new Date().toISOString().slice(0, 10);
    const revenueCollectedToday = allPayments
      .filter(
        (payment) =>
          new Date(payment.createdAt).toISOString().slice(0, 10) === todayIso,
      )
      .reduce((sum, payment) => sum + money(payment.amount), 0);
    const totalRooms = allRooms.length;
    const occupancy = totalRooms
      ? Math.round((occupiedRooms.length / totalRooms) * 1000) / 10
      : 0;
    const projected =
      revenueCollectedToday +
      currentStays.reduce(
        (sum, stay) => sum + money(stay.outstandingBalance),
        0,
      );
    const adr = currentStays.length
      ? currentStays.reduce((sum, stay) => sum + money(stay.rate), 0) /
        currentStays.length
      : 0;
    const revpar = totalRooms ? revenueCollectedToday / totalRooms : 0;
    const roomTypeRevenue = allRoomTypes.map((roomType) => {
      const roomTypeStays = allStays.filter(
        (stay) => stay.roomTypeId === roomType.id,
      );
      return {
        id: roomType.id,
        type: roomType.name,
        revenue: roomTypeStays.reduce(
          (sum, stay) => sum + money(stay.total),
          0,
        ),
      };
    });

    const nextArrival = allStays
      .filter((stay) => ['reserved', 'pending_arrival'].includes(stay.status))
      .sort(
        (a, b) => a.expectedCheckInAt.getTime() - b.expectedCheckInAt.getTime(),
      )[0];

    const nextDeparture = currentStays.sort(
      (a, b) => a.expectedCheckoutAt.getTime() - b.expectedCheckoutAt.getTime(),
    )[0];

    const attentionItems = [
      ...currentStays
        .filter((stay) => money(stay.outstandingBalance) > 0)
        .map((stay) => ({
          id: `balance-${stay.id}`,
          type: 'payment',
          title: `Outstanding balance for ${stay.reference}`,
          description: `GHS ${money(stay.outstandingBalance).toFixed(2)} remains unpaid.`,
        })),
      ...allRooms
        .filter((room) =>
          ['maintenance', 'out_of_service'].includes(room.status),
        )
        .map((room) => ({
          id: `room-${room.id}`,
          type: 'room',
          title: `Room ${room.number} unavailable`,
          description: `Room status is ${room.status.replace('_', ' ')}.`,
        })),
    ].slice(0, 8);

    return {
      dashboardStats: {
        occupancy,
        occupiedRooms: occupiedRooms.length,
        availableRooms: availableRooms.length,
        totalRooms,
        revenueCollectedToday,
        projectedEndOfDayRevenue: projected,
        averageDailyRate: adr,
        revPar: revpar,
        todayCheckIns: allStays.filter(
          (stay) =>
            stay.status === 'checked_in' &&
            new Date(stay.updatedAt).toISOString().slice(0, 10) === todayIso,
        ).length,
        todayCheckOuts: allStays.filter(
          (stay) =>
            stay.status === 'checked_out' &&
            new Date(stay.updatedAt).toISOString().slice(0, 10) === todayIso,
        ).length,
      },
      arrivals: allStays
        .filter(
          (stay) =>
            stay.status === 'pending_arrival' || stay.status === 'reserved',
        )
        .slice(0, 10)
        .map((stay) => ({
          ...stay,
          roomNumber: roomById.get(stay.roomId)?.number ?? null,
          guestName: guestById.get(stay.guestId)
            ? `${guestById.get(stay.guestId)?.firstName} ${guestById.get(stay.guestId)?.lastName}`
            : null,
        })),
      departures: currentStays.slice(0, 10).map((stay) => ({
        ...stay,
        roomNumber: roomById.get(stay.roomId)?.number ?? null,
        guestName: guestById.get(stay.guestId)
          ? `${guestById.get(stay.guestId)?.firstName} ${guestById.get(stay.guestId)?.lastName}`
          : null,
      })),
      roomStatus: {
        available: availableRooms.length,
        occupied: occupiedRooms.length,
        total: totalRooms,
        occupancy,
        turningOver: housekeeping.filter((item) =>
          ['cleaning', 'inspection'].includes(item.status),
        ).length,
        checkInsRemaining: allStays.filter((stay) =>
          ['pending_arrival', 'reserved'].includes(stay.status),
        ).length,
        averageNightlyRate: adr,
      },
      revenue: {
        today: revenueCollectedToday,
        projected: projected,
        byRoomType: roomTypeRevenue,
      },
      occupancy: {
        value: occupancy,
        trend: [],
      },
      housekeeping: {
        cleaning: housekeeping.filter((item) => item.status === 'cleaning')
          .length,
        inspection: housekeeping.filter((item) => item.status === 'inspection')
          .length,
        ready: housekeeping.filter((item) => item.status === 'ready').length,
        maintenance: housekeeping.filter(
          (item) => item.status === 'maintenance',
        ).length,
      },
      attentionItems,
      recentActivity: logs,
      nextArrival: nextArrival
        ? {
            ...nextArrival,
            roomNumber: roomById.get(nextArrival.roomId)?.number ?? null,
            guestName: guestById.get(nextArrival.guestId)
              ? `${guestById.get(nextArrival.guestId)?.firstName} ${guestById.get(nextArrival.guestId)?.lastName}`
              : null,
          }
        : undefined,
      nextDeparture: nextDeparture
        ? {
            ...nextDeparture,
            roomNumber: roomById.get(nextDeparture.roomId)?.number ?? null,
            guestName: guestById.get(nextDeparture.guestId)
              ? `${guestById.get(nextDeparture.guestId)?.firstName} ${guestById.get(nextDeparture.guestId)?.lastName}`
              : null,
          }
        : undefined,
    };
  }

  // ==========================================
  // ROOMS & ROOM TYPES
  // ==========================================
  async listRooms(userId?: string) {
    const hotelId = userId ? await this.getDefaultHotelId(userId) : null;
    const filter = hotelId ? eq(rooms.hotelId, hotelId) : sql`true`;
    return this.db
      .select()
      .from(rooms)
      .where(filter)
      .orderBy(desc(rooms.updatedAt));
  }

  async listRoomTypes(userId?: string) {
    const hotelId = userId ? await this.getDefaultHotelId(userId) : null;
    const filter = hotelId ? eq(roomTypes.hotelId, hotelId) : sql`true`;
    return this.db
      .select()
      .from(roomTypes)
      .where(filter)
      .orderBy(desc(roomTypes.updatedAt));
  }

  async getRoomType(userId: string, id: string) {
    const hotelId = await this.getDefaultHotelId(userId);
    const filter = hotelId ? eq(roomTypes.hotelId, hotelId) : sql`true`;
    const [found] = await this.db
      .select()
      .from(roomTypes)
      .where(and(filter, eq(roomTypes.id, id)))
      .limit(1);

    if (!found) throw new NotFoundException('Room type not found');
    return found;
  }

  async createRoomType(userId: string, dto: CreateRoomTypeDto) {
    const hotelId = await this.getRequiredHotelId(userId);
    const [created] = await this.db
      .insert(roomTypes)
      .values({
        hotelId,
        name: dto.name,
        description: dto.description,
        basePrice: String(dto.basePrice),
        capacity: dto.capacity,
        bedConfiguration: dto.bedConfiguration,
        amenities: dto.amenities,
      })
      .returning();

    await this.writeActivity(
      hotelId,
      userId,
      null,
      'room type created',
      `Room type ${created.name} was created.`,
      'room_type',
      created.id,
    );

    return created;
  }

  async updateRoomType(userId: string, id: string, dto: UpdateRoomTypeDto) {
    const hotelId = await this.getRequiredHotelId(userId);
    const filter = eq(roomTypes.hotelId, hotelId);

    const updateFields: any = { updatedAt: new Date() };
    if (dto.name !== undefined) updateFields.name = dto.name;
    if (dto.description !== undefined)
      updateFields.description = dto.description;
    if (dto.basePrice !== undefined)
      updateFields.basePrice = String(dto.basePrice);
    if (dto.capacity !== undefined) updateFields.capacity = dto.capacity;
    if (dto.bedConfiguration !== undefined)
      updateFields.bedConfiguration = dto.bedConfiguration;
    if (dto.amenities !== undefined) updateFields.amenities = dto.amenities;
    if (dto.isActive !== undefined) updateFields.isActive = dto.isActive;

    const [updated] = await this.db
      .update(roomTypes)
      .set(updateFields)
      .where(and(filter, eq(roomTypes.id, id)))
      .returning();

    if (!updated) throw new NotFoundException('Room type not found');

    await this.writeActivity(
      hotelId,
      userId,
      null,
      'room type updated',
      `Room type ${updated.name} was updated.`,
      'room_type',
      updated.id,
    );

    return updated;
  }

  async deleteRoomType(userId: string, id: string) {
    const hotelId = await this.getRequiredHotelId(userId);
    const filter = eq(roomTypes.hotelId, hotelId);

    const [existing] = await this.db
      .select()
      .from(roomTypes)
      .where(and(filter, eq(roomTypes.id, id)))
      .limit(1);

    if (!existing) throw new NotFoundException('Room type not found');

    await this.db.delete(roomTypes).where(and(filter, eq(roomTypes.id, id)));

    return { ok: true, message: `Room type ${existing.name} deleted` };
  }

  // ==========================================
  // GUESTS
  // ==========================================
  async listGuests(userId: string, query?: string) {
    const hotelId = await this.getDefaultHotelId(userId);
    const filter = hotelId ? eq(guests.hotelId, hotelId) : sql`true`;
    const rows = await this.db
      .select()
      .from(guests)
      .where(filter)
      .orderBy(desc(guests.updatedAt));

    const q = query?.trim();
    if (!q) return rows;
    const lower = q.toLowerCase();
    return rows.filter((guest) =>
      [
        guest.firstName,
        guest.lastName,
        guest.phone,
        guest.email,
        guest.identificationNumber,
      ]
        .filter(Boolean)
        .some((item) => String(item).toLowerCase().includes(lower)),
    );
  }

  async getGuest(userId: string, id: string) {
    const hotelId = await this.getDefaultHotelId(userId);
    const filter = hotelId ? eq(guests.hotelId, hotelId) : sql`true`;
    const [guest] = await this.db
      .select()
      .from(guests)
      .where(and(filter, eq(guests.id, id)))
      .limit(1);

    if (!guest) throw new NotFoundException('Guest not found');

    const guestStays = await this.db
      .select()
      .from(stays)
      .where(and(filter, eq(stays.guestId, guest.id)))
      .orderBy(desc(stays.createdAt));

    const guestInvoices = await this.db
      .select()
      .from(invoices)
      .where(and(filter, eq(invoices.guestId, guest.id)))
      .orderBy(desc(invoices.createdAt));

    return {
      ...guest,
      stays: guestStays,
      invoices: guestInvoices,
    };
  }

  async createGuest(userId: string, dto: CreateGuestDto) {
    const hotelId = await this.getRequiredHotelId(userId);
    const hotelFilter = eq(guests.hotelId, hotelId);
    const [existing] = await this.db
      .select()
      .from(guests)
      .where(
        and(
          hotelFilter,
          or(
            eq(guests.phone, dto.phone),
            dto.email ? eq(guests.email, dto.email) : sql`false`,
            dto.identificationNumber
              ? eq(guests.identificationNumber, dto.identificationNumber)
              : sql`false`,
          ),
        ),
      )
      .limit(1);

    if (existing) return existing;

    const [created] = await this.db
      .insert(guests)
      .values({
        hotelId,
        firstName: dto.firstName,
        lastName: dto.lastName,
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

    await this.writeActivity(
      hotelId,
      userId,
      null,
      'guest created',
      `${created.firstName} ${created.lastName} was added to the guest directory.`,
      'guest',
      created.id,
    );

    return created;
  }

  async updateGuest(userId: string, id: string, dto: UpdateGuestDto) {
    const hotelId = await this.getRequiredHotelId(userId);
    const filter = eq(guests.hotelId, hotelId);

    const updateFields: any = { updatedAt: new Date() };
    if (dto.firstName !== undefined) updateFields.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateFields.lastName = dto.lastName;
    if (dto.phone !== undefined) updateFields.phone = dto.phone;
    if (dto.email !== undefined) updateFields.email = dto.email;
    if (dto.nationality !== undefined)
      updateFields.nationality = dto.nationality;
    if (dto.identificationType !== undefined)
      updateFields.identificationType = dto.identificationType;
    if (dto.identificationNumber !== undefined)
      updateFields.identificationNumber = dto.identificationNumber;
    if (dto.address !== undefined) updateFields.address = dto.address;
    if (dto.emergencyContact !== undefined)
      updateFields.emergencyContact = dto.emergencyContact;
    if (dto.notes !== undefined) updateFields.notes = dto.notes;

    const [updated] = await this.db
      .update(guests)
      .set(updateFields)
      .where(and(filter, eq(guests.id, id)))
      .returning();

    if (!updated) throw new NotFoundException('Guest not found');

    await this.writeActivity(
      hotelId,
      userId,
      null,
      'guest updated',
      `${updated.firstName} ${updated.lastName} profile was updated.`,
      'guest',
      updated.id,
    );

    return updated;
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
    const hotelId = await this.getDefaultHotelId(userId);

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

  // ==========================================
  // GLOBAL SEARCH
  // ==========================================
  private escapeLike(value: string) {
    return value.replace(/[\\%_]/g, (m) => `\\${m}`);
  }

  async globalSearch(userId: string, rawQuery?: string) {
    const hotelId = await this.getDefaultHotelId(userId);

    const empty = { guests: [], rooms: [], stays: [], roomTypes: [] };
    const query = rawQuery?.trim() ?? '';
    if (!query) return empty;

    const tokens = query.split(/\s+/).filter(Boolean);
    const patterns = tokens.map((t) => `%${this.escapeLike(t.toLowerCase())}%`);

    const guestFullName = sql`lower(${guests.firstName} || ' ' || ${guests.lastName})`;

    const [guestRows, roomRows, stayRows, roomTypeRows] = await Promise.all([
      hotelId
        ? this.db
            .select()
            .from(guests)
            .where(
              and(
                eq(guests.hotelId, hotelId),
                ...patterns.map((p) =>
                  or(
                    ilike(guests.firstName, p),
                    ilike(guests.lastName, p),
                    ilike(guestFullName, p),
                    ilike(guests.phone, p),
                    ilike(guests.email, p),
                    ilike(guests.identificationNumber, p),
                  ),
                ),
              ),
            )
            .orderBy(desc(guests.updatedAt))
            .limit(6)
        : this.db.select().from(guests).limit(0),

      hotelId
        ? this.db
            .select({
              room: rooms,
              roomType: roomTypes,
            })
            .from(rooms)
            .leftJoin(
              roomTypes,
              and(
                eq(roomTypes.id, rooms.roomTypeId),
                eq(roomTypes.hotelId, rooms.hotelId),
              ),
            )
            .where(
              and(
                eq(rooms.hotelId, hotelId),
                ...patterns.map((p) =>
                  or(
                    ilike(rooms.number, p),
                    ilike(rooms.floor, p),
                    ilike(roomTypes.name, p),
                  ),
                ),
              ),
            )
            .orderBy(desc(rooms.updatedAt))
            .limit(6)
        : this.db
            .select({
              room: rooms,
              roomType: roomTypes,
            })
            .from(rooms)
            .limit(0),

      hotelId
        ? this.db
            .select({
              stay: stays,
              guest: guests,
              room: rooms,
              roomType: roomTypes,
            })
            .from(stays)
            .leftJoin(
              guests,
              and(
                eq(guests.id, stays.guestId),
                eq(guests.hotelId, stays.hotelId),
              ),
            )
            .leftJoin(
              rooms,
              and(eq(rooms.id, stays.roomId), eq(rooms.hotelId, stays.hotelId)),
            )
            .leftJoin(
              roomTypes,
              and(
                eq(roomTypes.id, stays.roomTypeId),
                eq(roomTypes.hotelId, stays.hotelId),
              ),
            )
            .where(
              and(
                eq(stays.hotelId, hotelId),
                ...patterns.map((p) =>
                  or(
                    ilike(stays.reference, p),
                    ilike(roomTypes.name, p),
                    ilike(rooms.number, p),
                    ilike(guestFullName, p),
                  ),
                ),
              ),
            )
            .orderBy(desc(stays.createdAt))
            .limit(6)
        : this.db
            .select({
              stay: stays,
              guest: guests,
              room: rooms,
              roomType: roomTypes,
            })
            .from(stays)
            .limit(0),

      hotelId
        ? this.db
            .select()
            .from(roomTypes)
            .where(
              and(
                eq(roomTypes.hotelId, hotelId),
                ...patterns.map((p) =>
                  or(
                    ilike(roomTypes.name, p),
                    ilike(roomTypes.description, p),
                    ilike(roomTypes.amenities, p),
                  ),
                ),
              ),
            )
            .orderBy(desc(roomTypes.updatedAt))
            .limit(6)
        : this.db.select().from(roomTypes).limit(0),
    ]);

    return {
      guests: guestRows.map((g) => ({
        id: g.id,
        title: `${g.firstName} ${g.lastName}`,
        subtitle: [g.phone, g.email].filter(Boolean).join(' · ') || null,
      })),
      rooms: roomRows.map(({ room, roomType }) => {
        const roomSubtitle = [roomType?.name, room.status]
          .filter(Boolean)
          .join(' · ');
        return {
          id: room.id,
          title: `Room ${room.number}`,
          subtitle: roomSubtitle || null,
        };
      }),
      stays: stayRows.map(({ stay, guest, room }) => {
        const guestName = guest
          ? `${guest.firstName} ${guest.lastName}`
          : 'Guest';
        return {
          id: stay.id,
          title: `${stay.reference} — ${guestName}`,
          subtitle: room ? `Room ${room.number}` : null,
        };
      }),
      roomTypes: roomTypeRows.map((rt) => ({
        id: rt.id,
        title: rt.name,
        subtitle: rt.description || null,
      })),
    };
  }

  async getStay(userId: string, id: string) {
    const hotelId = await this.getDefaultHotelId(userId);
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
    },
  ) {
    const hotelId = await this.getRequiredHotelId(userId);

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
      const user = await this.getCurrentUser(userId);
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

      const defaults = await this.getHotelPricingDefaults(hotelId);
      const rate =
        dto.rate || money(roomRecord.rate) || money(roomTypeRecord.basePrice);
      const subtotal = roundMoney(rate * dto.nights);
      const discountMode = (dto.discountMode ??
        defaults.discountType ??
        'value') as 'value' | 'percentage';
      const discountValue = dto.discount ?? defaults.discountValue;
      const discount = this.resolvePricingValue(
        subtotal,
        discountMode,
        discountValue,
      );
      const taxMode = (dto.taxMode ?? defaults.taxType ?? 'value') as
        'value' | 'percentage';
      const taxValue = dto.taxes ?? defaults.taxValue;
      const taxes = this.resolvePricingValue(
        subtotal - discount,
        taxMode,
        taxValue,
      );
      const totals = this.computeTotals({
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

      await tx
        .update(rooms)
        .set({
          status: dto.checkInNow ? 'occupied' : 'reserved',
          updatedAt: new Date(),
        })
        .where(eq(rooms.id, roomRecord.id));

      const pricingDetails = {
        discountMode,
        discountValue,
        taxMode,
        taxValue,
      };

      await this.writeActivity(
        hotelId,
        user.id,
        user.fullName,
        'booking created',
        `Stay ${reference} created for ${guestRecord.firstName} ${guestRecord.lastName}. Pricing defaults applied: discount ${pricingDetails.discountValue} (${pricingDetails.discountMode}), tax ${pricingDetails.taxValue} (${pricingDetails.taxMode}).`,
        'stay',
        createdStay.id,
      );

      await this.writeNotification(
        hotelId,
        'new_booking',
        'New booking created',
        `Stay ${reference} was created for Room ${roomRecord.number}.`,
        'stay',
        createdStay.id,
      );

      if (dto.checkInNow) {
        await this.writeNotification(
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
      void this.dispatchInvoiceReceipt(userId, createdBooking.invoice.id);
    }

    return createdBooking;
  }

  async updateBooking(userId: string, id: string, dto: UpdateBookingDto) {
    const user = await this.getCurrentUser(userId);
    const hotelId = user.hotelId;
    if (!hotelId) throw new BadRequestException('Hotel context not found');

    const [stay] = await this.db
      .select()
      .from(stays)
      .where(and(eq(stays.id, id), eq(stays.hotelId, hotelId)))
      .limit(1);

    if (!stay) throw new NotFoundException('Booking not found');

    const updateFields: any = { updatedAt: new Date() };
    const changedKeys: string[] = [];

    if (dto.rate !== undefined) {
      updateFields.rate = String(dto.rate);
      changedKeys.push('rate');
    }
    if (dto.discount !== undefined) {
      updateFields.discount = String(dto.discount);
      changedKeys.push('discount');
    }
    if (dto.discountMode !== undefined) {
      updateFields.discount = String(
        this.resolvePricingValue(
          money(stay.rate) * money(stay.nights),
          dto.discountMode,
          money(dto.discount ?? stay.discount),
        ),
      );
      changedKeys.push('discountMode');
    }
    if (dto.taxes !== undefined) {
      updateFields.taxes = String(dto.taxes);
      changedKeys.push('taxes');
    }
    if (dto.taxMode !== undefined) {
      updateFields.taxes = String(
        this.resolvePricingValue(
          money(stay.rate) * money(stay.nights) - money(stay.discount),
          dto.taxMode,
          money(dto.taxes ?? stay.taxes),
        ),
      );
      changedKeys.push('taxMode');
    }
    if (dto.notes !== undefined) {
      updateFields.notes = dto.notes;
      changedKeys.push('notes');
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

    const [updatedStay] = await this.db
      .update(stays)
      .set(updateFields)
      .where(eq(stays.id, id))
      .returning();

    const subtotal = roundMoney(
      money(updatedStay.rate) * money(updatedStay.nights),
    );
    const total = roundMoney(
      subtotal - money(updatedStay.discount) + money(updatedStay.taxes),
    );

    await this.db
      .update(stays)
      .set({
        total: String(total),
        outstandingBalance: String(
          Math.max(0, total - money(updatedStay.amountPaid)),
        ),
        updatedAt: new Date(),
      })
      .where(eq(stays.id, id));

    const [invoice] = await this.db
      .select()
      .from(invoices)
      .where(and(eq(invoices.stayId, stay.id), eq(invoices.hotelId, hotelId)))
      .limit(1);

    if (invoice) {
      await this.db
        .update(invoices)
        .set({
          subtotal: String(subtotal),
          discount: String(updatedStay.discount),
          taxes: String(updatedStay.taxes),
          total: String(total),
          outstanding: String(Math.max(0, total - money(invoice.amountPaid))),
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoice.id));
    }

    await this.writeActivity(
      hotelId,
      user.id,
      user.fullName,
      'booking updated',
      `Booking ${stay.reference} was updated. Reason: ${dto.editReason.trim()}.`,
      'stay',
      stay.id,
    );

    return { ok: true, stayId: updatedStay.id, reason: dto.editReason.trim() };
  }

  async cancelBooking(userId: string, id: string) {
    const result = await this.db.transaction(async (tx) => {
      const user = await this.getCurrentUser(userId);
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

      await this.writeActivity(
        stay.hotelId,
        user.id,
        user.fullName,
        'booking cancelled',
        `Stay ${stay.reference} was cancelled.`,
        'stay',
        stay.id,
      );

      await this.writeNotification(
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
      const user = await this.getCurrentUser(userId);
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

      const targetOccupied =
        stay.status === 'checked_in' ? 'occupied' : 'reserved';
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

      await this.writeActivity(
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
      const user = await this.getCurrentUser(userId);
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

      await this.writeActivity(
        stay.hotelId,
        user.id,
        user.fullName,
        'check-in completed',
        `Stay ${stay.reference} checked in.`,
        'stay',
        stay.id,
      );

      await this.writeNotification(
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
      const user = await this.getCurrentUser(userId);
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

      const housekeepingEnabled = await this.isHousekeepingEnabled(
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

      await this.writeActivity(
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

      await this.writeNotification(
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
    void this.dispatchInvoiceReceipt(userId, result.invoiceId);

    return result;
  }

  // ==========================================
  // INVOICES & PAYMENTS
  // ==========================================
  async listInvoices(userId: string, stayId?: string) {
    const hotelId = await this.getDefaultHotelId(userId);
    const hotelFilter = hotelId ? eq(invoices.hotelId, hotelId) : sql`true`;
    const conditions = [hotelFilter];
    if (stayId) conditions.push(eq(invoices.stayId, stayId));

    return this.db
      .select()
      .from(invoices)
      .where(and(...conditions))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoice(userId: string, id: string) {
    const hotelId = await this.getDefaultHotelId(userId);
    const hotelFilter = hotelId ? eq(invoices.hotelId, hotelId) : sql`true`;

    const [invoice] = await this.db
      .select()
      .from(invoices)
      .where(and(hotelFilter, eq(invoices.id, id)))
      .limit(1);

    if (!invoice) throw new NotFoundException('Invoice not found');

    const items = await this.db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoice.id));

    const invoicePayments = await this.db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, invoice.id));

    return {
      ...invoice,
      items,
      payments: invoicePayments,
    };
  }

  async getInvoiceItems(userId: string, invoiceId: string) {
    const invoice = await this.getInvoice(userId, invoiceId);
    return invoice.items;
  }

  async listPayments(userId: string, stayId?: string) {
    const hotelId = await this.getDefaultHotelId(userId);
    const hotelFilter = hotelId ? eq(payments.hotelId, hotelId) : sql`true`;
    const conditions = [hotelFilter];
    if (stayId) conditions.push(eq(payments.stayId, stayId));

    return this.db
      .select()
      .from(payments)
      .where(and(...conditions))
      .orderBy(desc(payments.createdAt));
  }

  async getPayment(userId: string, id: string) {
    const hotelId = await this.getDefaultHotelId(userId);
    const hotelFilter = hotelId ? eq(payments.hotelId, hotelId) : sql`true`;

    const [payment] = await this.db
      .select()
      .from(payments)
      .where(and(hotelFilter, eq(payments.id, id)))
      .limit(1);

    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async recordPayment(userId: string, dto: CreatePaymentDto) {
    const result = await this.db.transaction(async (tx) => {
      const user = await this.getCurrentUser(userId);
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
        .where(
          and(
            eq(invoices.id, dto.invoiceId),
            eq(invoices.hotelId, user.hotelId ?? ''),
          ),
        )
        .limit(1);
      if (!invoice) throw new NotFoundException('Invoice not found');

      if (dto.amount <= 0) {
        throw new BadRequestException(
          'Payment amount must be greater than zero',
        );
      }

      const [payment] = await tx
        .insert(payments)
        .values({
          hotelId: stay.hotelId,
          reference: formatReference('PMT'),
          guestId: stay.guestId,
          stayId: stay.id,
          invoiceId: invoice.id,
          staffId: user.id,
          method: dto.method,
          amount: String(dto.amount),
          status: 'paid',
          notes: dto.notes,
        })
        .returning();

      const newAmountPaid = money(invoice.amountPaid) + dto.amount;
      const newOutstanding = roundMoney(
        Math.max(0, money(invoice.total) - newAmountPaid),
      );

      await tx
        .update(invoices)
        .set({
          amountPaid: String(newAmountPaid),
          outstanding: String(newOutstanding),
          status: newOutstanding > 0 ? 'partially_paid' : 'paid',
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoice.id));

      await tx
        .update(stays)
        .set({
          amountPaid: String(money(stay.amountPaid) + dto.amount),
          outstandingBalance: String(
            Math.max(0, money(stay.outstandingBalance) - dto.amount),
          ),
          updatedAt: new Date(),
        })
        .where(eq(stays.id, stay.id));

      await this.writeActivity(
        stay.hotelId,
        user.id,
        user.fullName,
        'payment recorded',
        `Payment ${payment.reference} of GHS ${dto.amount} recorded for stay ${stay.reference}.`,
        'payment',
        payment.id,
      );

      return payment;
    });

    // Best-effort, non-blocking payment receipt email after the commit.
    void this.dispatchInvoiceReceipt(userId, result.invoiceId);

    return result;
  }

  async reversePayment(userId: string, id: string) {
    return this.db.transaction(async (tx) => {
      const user = await this.getCurrentUser(userId);
      const hotelId = user.hotelId;
      if (!hotelId) throw new BadRequestException('Hotel context not found');

      const [payment] = await tx
        .select()
        .from(payments)
        .where(and(eq(payments.id, id), eq(payments.hotelId, hotelId)))
        .limit(1);
      if (!payment) throw new NotFoundException('Payment not found');
      if (payment.status === 'reversed') {
        throw new ConflictException('This payment has already been reversed');
      }

      await tx
        .update(payments)
        .set({ status: 'reversed' })
        .where(eq(payments.id, payment.id));

      const [invoice] = await tx
        .select()
        .from(invoices)
        .where(
          and(
            eq(invoices.id, payment.invoiceId),
            eq(invoices.hotelId, user.hotelId ?? ''),
          ),
        )
        .limit(1);

      if (invoice) {
        const newAmountPaid = roundMoney(
          Math.max(0, money(invoice.amountPaid) - money(payment.amount)),
        );
        const newOutstanding = roundMoney(
          Math.max(0, money(invoice.total) - newAmountPaid),
        );
        await tx
          .update(invoices)
          .set({
            amountPaid: String(newAmountPaid),
            outstanding: String(newOutstanding),
            status:
              newAmountPaid <= 0
                ? 'issued'
                : newOutstanding > 0
                  ? 'partially_paid'
                  : 'paid',
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, invoice.id));
      }

      const [stay] = await tx
        .select()
        .from(stays)
        .where(
          and(
            eq(stays.id, payment.stayId),
            eq(stays.hotelId, user.hotelId ?? ''),
          ),
        )
        .limit(1);
      if (stay) {
        await tx
          .update(stays)
          .set({
            amountPaid: String(
              Math.max(0, money(stay.amountPaid) - money(payment.amount)),
            ),
            outstandingBalance: String(
              roundMoney(
                money(stay.outstandingBalance) + money(payment.amount),
              ),
            ),
            updatedAt: new Date(),
          })
          .where(eq(stays.id, stay.id));
      }

      await this.writeActivity(
        payment.hotelId,
        user.id,
        user.fullName,
        'payment reversed',
        `Payment ${payment.reference} of ${
          payment.amount
        } was reversed against stay.`,
        'payment',
        payment.id,
      );

      return { ok: true, paymentId: payment.id };
    });
  }

  // ==========================================
  // SERVICES & SERVICE CHARGES
  // ==========================================
  async listServices(userId?: string) {
    const hotelId = userId ? await this.getDefaultHotelId(userId) : null;
    const filter = hotelId ? eq(services.hotelId, hotelId) : sql`true`;
    return this.db
      .select()
      .from(services)
      .where(filter)
      .orderBy(desc(services.createdAt));
  }

  async getService(userId: string, id: string) {
    const hotelId = await this.getDefaultHotelId(userId);
    const filter = hotelId ? eq(services.hotelId, hotelId) : sql`true`;
    const [service] = await this.db
      .select()
      .from(services)
      .where(and(filter, eq(services.id, id)))
      .limit(1);

    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async createService(userId: string, dto: CreateServiceDto) {
    const hotelId = await this.getRequiredHotelId(userId);
    const [created] = await this.db
      .insert(services)
      .values({
        hotelId,
        name: dto.name,
        category: dto.category,
        price: String(dto.price),
        description: dto.description,
        isActive: dto.isActive ?? true,
      })
      .returning();

    await this.writeActivity(
      hotelId,
      userId,
      null,
      'service created',
      `Service ${created.name} was added to catalog.`,
      'service',
      created.id,
    );

    return created;
  }

  async updateService(userId: string, id: string, dto: UpdateServiceDto) {
    const hotelId = await this.getRequiredHotelId(userId);
    const filter = eq(services.hotelId, hotelId);

    const updateFields: any = { updatedAt: new Date() };
    if (dto.name !== undefined) updateFields.name = dto.name;
    if (dto.category !== undefined) updateFields.category = dto.category;
    if (dto.price !== undefined) updateFields.price = String(dto.price);
    if (dto.description !== undefined)
      updateFields.description = dto.description;
    if (dto.isActive !== undefined) updateFields.isActive = dto.isActive;

    const [updated] = await this.db
      .update(services)
      .set(updateFields)
      .where(and(filter, eq(services.id, id)))
      .returning();

    if (!updated) throw new NotFoundException('Service not found');

    await this.writeActivity(
      hotelId,
      userId,
      null,
      'service updated',
      `Service ${updated.name} was updated.`,
      'service',
      updated.id,
    );

    return updated;
  }

  async deleteService(userId: string, id: string) {
    const hotelId = await this.getRequiredHotelId(userId);
    const filter = eq(services.hotelId, hotelId);

    const [existing] = await this.db
      .select()
      .from(services)
      .where(and(filter, eq(services.id, id)))
      .limit(1);

    if (!existing) throw new NotFoundException('Service not found');

    await this.db.delete(services).where(and(filter, eq(services.id, id)));

    return { ok: true, message: `Service ${existing.name} deleted` };
  }

  async listServiceCharges(userId: string, stayId?: string) {
    const hotelId = await this.getDefaultHotelId(userId);
    const hotelFilter = hotelId
      ? eq(serviceCharges.hotelId, hotelId)
      : sql`true`;
    const conditions = [hotelFilter];
    if (stayId) conditions.push(eq(serviceCharges.stayId, stayId));

    return this.db
      .select()
      .from(serviceCharges)
      .where(and(...conditions))
      .orderBy(desc(serviceCharges.createdAt));
  }

  async addServiceCharge(userId: string, dto: CreateServiceChargeDto) {
    return this.db.transaction(async (tx) => {
      const user = await this.getCurrentUser(userId);
      const [stay] = await tx
        .select()
        .from(stays)
        .where(
          and(eq(stays.id, dto.stayId), eq(stays.hotelId, user.hotelId ?? '')),
        )
        .limit(1);
      if (!stay) throw new NotFoundException('Stay not found');

      const [service] = await tx
        .select()
        .from(services)
        .where(
          and(
            eq(services.id, dto.serviceId),
            eq(services.hotelId, user.hotelId ?? ''),
            eq(services.isActive, true),
          ),
        )
        .limit(1);

      if (!service)
        throw new NotFoundException('Service not found or inactive');

      const total = roundMoney(money(service.price) * dto.quantity);

      await tx.insert(serviceCharges).values({
        hotelId: stay.hotelId,
        guestId: stay.guestId,
        stayId: stay.id,
        serviceId: service.id,
        quantity: dto.quantity,
        unitPrice: String(service.price),
        total: String(total),
        staffId: user.id,
        status: 'posted',
      });

      const [invoice] = await tx
        .select()
        .from(invoices)
        .where(eq(invoices.stayId, stay.id))
        .limit(1);
      if (invoice) {
        await tx
          .update(invoices)
          .set({
            subtotal: String(money(invoice.subtotal) + total),
            total: String(money(invoice.total) + total),
            outstanding: String(money(invoice.outstanding) + total),
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, invoice.id));

        await tx.insert(invoiceItems).values({
          invoiceId: invoice.id,
          description: `${service.name} x ${dto.quantity}`,
          quantity: dto.quantity,
          unitPrice: String(service.price),
          total: String(total),
          itemType: 'service',
        });
      }

      await tx
        .update(stays)
        .set({
          serviceTotal: String(money(stay.serviceTotal) + total),
          total: String(money(stay.total) + total),
          outstandingBalance: String(money(stay.outstandingBalance) + total),
          updatedAt: new Date(),
        })
        .where(eq(stays.id, stay.id));

      await this.writeActivity(
        stay.hotelId,
        user.id,
        user.fullName,
        'service charge added',
        `${service.name} (GHS ${total}) added to stay ${stay.reference}.`,
        'stay',
        stay.id,
      );

      await this.writeNotification(
        stay.hotelId,
        'service_charge_added',
        'Service charge added',
        `${service.name} was added to stay ${stay.reference}.`,
        'stay',
        stay.id,
      );

      return { ok: true, total };
    });
  }

  // ==========================================
  // HOUSEKEEPING
  // ==========================================
  async listHousekeeping(userId?: string) {
    const hotelId = userId ? await this.getDefaultHotelId(userId) : null;
    const filter = hotelId ? eq(housekeepingTasks.hotelId, hotelId) : sql`true`;
    const tasks = await this.db
      .select()
      .from(housekeepingTasks)
      .where(filter)
      .orderBy(desc(housekeepingTasks.createdAt));

    const roomFilter = hotelId ? eq(rooms.hotelId, hotelId) : sql`true`;
    const allRooms = await this.db.select().from(rooms).where(roomFilter);
    const roomById = new Map(allRooms.map((r) => [r.id, r]));

    return tasks.map((task) => {
      const room = roomById.get(task.roomId);
      return {
        ...task,
        roomNumber: room?.number ?? null,
        roomFloor: room?.floor ?? null,
      };
    });
  }

  async getHousekeeping(userId: string, id: string) {
    const hotelId = await this.getDefaultHotelId(userId);
    const filter = hotelId ? eq(housekeepingTasks.hotelId, hotelId) : sql`true`;
    const [task] = await this.db
      .select()
      .from(housekeepingTasks)
      .where(and(filter, eq(housekeepingTasks.id, id)))
      .limit(1);

    if (!task) throw new NotFoundException('Housekeeping task not found');
    return task;
  }

  async createHousekeepingTask(userId: string, dto: CreateHousekeepingTaskDto) {
    const user = await this.getCurrentUser(userId);
    const [room] = await this.db
      .select()
      .from(rooms)
      .where(
        and(eq(rooms.id, dto.roomId), eq(rooms.hotelId, user.hotelId ?? '')),
      )
      .limit(1);

    if (!room) throw new NotFoundException('Room not found');

    const [created] = await this.db
      .insert(housekeepingTasks)
      .values({
        hotelId: room.hotelId,
        roomId: room.id,
        stayId: dto.stayId,
        status: dto.status ?? 'cleaning',
        assignedToUserId: dto.assignedToUserId,
        note: dto.note,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
      })
      .returning();

    await this.writeActivity(
      room.hotelId,
      user.id,
      user.fullName,
      'housekeeping task created',
      `Housekeeping task created for Room ${room.number}.`,
      'room',
      room.id,
    );

    return created;
  }

  async updateHousekeeping(userId: string, dto: UpdateHousekeepingDto) {
    const user = await this.getCurrentUser(userId);
    const [room] = await this.db
      .select()
      .from(rooms)
      .where(
        and(eq(rooms.id, dto.roomId), eq(rooms.hotelId, user.hotelId ?? '')),
      )
      .limit(1);
    if (!room) throw new NotFoundException('Room not found');

    const [task] = await this.db
      .select()
      .from(housekeepingTasks)
      .where(
        and(
          eq(housekeepingTasks.roomId, room.id),
          inArray(housekeepingTasks.status, [
            'cleaning',
            'inspection',
            'maintenance',
            'ready',
          ]),
        ),
      )
      .orderBy(desc(housekeepingTasks.createdAt))
      .limit(1);

    if (task) {
      await this.db
        .update(housekeepingTasks)
        .set({
          status: dto.status,
          note: dto.note ?? task.note,
          completedAt: dto.status === 'ready' ? new Date() : task.completedAt,
          updatedAt: new Date(),
        })
        .where(eq(housekeepingTasks.id, task.id));
    } else {
      await this.db.insert(housekeepingTasks).values({
        hotelId: room.hotelId,
        roomId: room.id,
        status: dto.status,
        note: dto.note,
      });
    }

    if (dto.status === 'ready') {
      await this.db
        .update(rooms)
        .set({ status: 'available', updatedAt: new Date() })
        .where(eq(rooms.id, room.id));
      await this.writeNotification(
        room.hotelId,
        'room_ready',
        'Room ready',
        `Room ${room.number} is ready for assignment.`,
        'room',
        room.id,
      );
    } else if (dto.status === 'cleaning' || dto.status === 'inspection') {
      await this.db
        .update(rooms)
        .set({ status: dto.status, updatedAt: new Date() })
        .where(eq(rooms.id, room.id));
    } else if (dto.status === 'maintenance') {
      await this.db
        .update(rooms)
        .set({ status: 'maintenance', updatedAt: new Date() })
        .where(eq(rooms.id, room.id));
    }

    await this.writeActivity(
      room.hotelId,
      user.id,
      user.fullName,
      'housekeeping updated',
      `Room ${room.number} marked ${dto.status}.`,
      'room',
      room.id,
    );

    return { ok: true };
  }

  // ==========================================
  // ACTIVITY LOGS & NOTIFICATIONS
  // ==========================================
  async listActivity(userId: string) {
    const hotelId = await this.getDefaultHotelId(userId);
    const filter = hotelId ? eq(activityLogs.hotelId, hotelId) : sql`true`;
    return this.db
      .select()
      .from(activityLogs)
      .where(filter)
      .orderBy(desc(activityLogs.createdAt))
      .limit(100);
  }

  async getActivity(userId: string, id: string) {
    const hotelId = await this.getDefaultHotelId(userId);
    const filter = hotelId ? eq(activityLogs.hotelId, hotelId) : sql`true`;
    const [log] = await this.db
      .select()
      .from(activityLogs)
      .where(and(filter, eq(activityLogs.id, id)))
      .limit(1);

    if (!log) throw new NotFoundException('Activity log not found');
    return log;
  }

  async listNotifications(userId: string) {
    const hotelId = await this.getDefaultHotelId(userId);
    const filter = hotelId ? eq(notifications.hotelId, hotelId) : sql`true`;
    return this.db
      .select()
      .from(notifications)
      .where(filter)
      .orderBy(desc(notifications.createdAt))
      .limit(100);
  }

  async markNotificationRead(userId: string, id: string) {
    const hotelId = await this.getDefaultHotelId(userId);
    const filter = hotelId ? eq(notifications.hotelId, hotelId) : sql`true`;

    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(and(filter, eq(notifications.id, id)));

    return { ok: true };
  }

  async markAllNotificationsRead(userId: string) {
    const hotelId = await this.getDefaultHotelId(userId);
    const filter = hotelId ? eq(notifications.hotelId, hotelId) : sql`true`;

    await this.db.update(notifications).set({ isRead: true }).where(filter);

    return { ok: true };
  }

  // ==========================================
  // STAFF MANAGEMENT
  // ==========================================
  async listStaff(userId: string) {
    const hotelId = await this.getDefaultHotelId(userId);
    if (!hotelId) return [];

    const staffUsers = await this.db
      .select({
        id: users.id,
        email: users.email,
        phone: users.phone,
        fullName: users.fullName,
        role: users.role,
        isVerified: users.isVerified,
      })
      .from(users)
      .where(eq(users.hotelId, hotelId));

    const pendingInvitations = await this.db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.hotelId, hotelId),
          eq(invitations.status, 'pending'),
          isNull(invitations.acceptedAt),
        ),
      );

    return {
      staff: staffUsers,
      invitations: pendingInvitations,
    };
  }

  async getStaffMember(userId: string, id: string) {
    const hotelId = await this.getRequiredHotelId(userId);

    const [staff] = await this.db
      .select({
        id: users.id,
        email: users.email,
        phone: users.phone,
        fullName: users.fullName,
        role: users.role,
        isVerified: users.isVerified,
      })
      .from(users)
      .where(and(eq(users.hotelId, hotelId), eq(users.id, id)))
      .limit(1);

    if (!staff) throw new NotFoundException('Staff member not found');
    return staff;
  }

  async inviteStaff(userId: string, dto: InviteStaffDto) {
    const user = await this.getCurrentUser(userId);
    const hotelId = user.hotelId;
    if (!hotelId) throw new BadRequestException('Hotel not found for user');

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

    const [invitation] = await this.db
      .insert(invitations)
      .values({
        token,
        email: dto.email,
        hotelId: hotelId,
        role: dto.role,
        expiresAt: expiresAt,
        // acceptedAt is null by default
      })
      .returning();

    await this.writeActivity(
      hotelId,
      user.id,
      user.fullName,
      'staff invited',
      `Invitation sent to ${dto.email} for role ${dto.role}.`,
      'invitation',
      invitation.id,
    );

    // Send invitation email (if configured)
    try {
      const { branding, sender, replyTo } =
        await this.getHotelBranding(hotelId);
      const inviteUrl = `${this.emailConfig.frontendUrl}/invite/${token}`;
      await this.emailService.sendStaffInvitation(
        dto.email,
        {
          inviteUrl,
          role: dto.role,
          inviterName: user.fullName,
          expiresAt: invitation.expiresAt,
        },
        branding,
        sender,
        replyTo,
      );
    } catch (err) {
      // Log but don't fail invite creation
      // writeActivity already recorded the invite
    }

    return {
      ok: true,
      invitation,
      inviteUrl: `/invite/${token}`,
    };
  }

  async revokeInvitation(userId: string, invitationId: string) {
    const user = await this.getCurrentUser(userId);
    const hotelId = user.hotelId;
    if (!hotelId) throw new BadRequestException('Hotel not found for user');

    const [invitation] = await this.db
      .select()
      .from(invitations)
      .where(
        and(eq(invitations.hotelId, hotelId), eq(invitations.id, invitationId)),
      )
      .limit(1);

    if (!invitation) throw new NotFoundException('Invitation not found');

    if (invitation.status !== 'pending' || invitation.acceptedAt) {
      throw new BadRequestException('Only pending invitations can be revoked');
    }

    const [revoked] = await this.db
      .update(invitations)
      .set({ status: 'revoked', updatedAt: new Date() })
      .where(eq(invitations.id, invitation.id))
      .returning();

    await this.writeActivity(
      hotelId,
      user.id,
      user.fullName,
      'invitation revoked',
      `Invitation for ${invitation.email} (${invitation.role}) was withdrawn. The invite link no longer works.`,
      'invitation',
      invitation.id,
    );

    return { ok: true, invitation: revoked };
  }

  async resendInvitation(userId: string, invitationId: string) {
    const user = await this.getCurrentUser(userId);
    const hotelId = user.hotelId;
    if (!hotelId) throw new BadRequestException('Hotel not found for user');

    const [invitation] = await this.db
      .select()
      .from(invitations)
      .where(
        and(eq(invitations.hotelId, hotelId), eq(invitations.id, invitationId)),
      )
      .limit(1);

    if (!invitation) throw new NotFoundException('Invitation not found');

    if (invitation.status !== 'pending' || invitation.acceptedAt) {
      throw new BadRequestException('Only pending invitations can be resent');
    }

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    const [updated] = await this.db
      .update(invitations)
      .set({ token, expiresAt, updatedAt: new Date() })
      .where(eq(invitations.id, invitation.id))
      .returning();

    try {
      const { branding, sender, replyTo } =
        await this.getHotelBranding(hotelId);
      const inviteUrl = `${this.emailConfig.frontendUrl}/invite/${token}`;
      await this.emailService.sendStaffInvitation(
        invitation.email,
        {
          inviteUrl,
          role: invitation.role,
          inviterName: user.fullName,
          expiresAt,
        },
        branding,
        sender,
        replyTo,
      );
    } catch (err) {
      // Log but don't fail resend
    }

    await this.writeActivity(
      hotelId,
      user.id,
      user.fullName,
      'invitation resent',
      `Invitation for ${invitation.email} (${invitation.role}) was resent with a new link.`,
      'invitation',
      invitation.id,
    );

    return {
      ok: true,
      invitation: updated,
      inviteUrl: `/invite/${token}`,
    };
  }

  async getInvoiceReceipt(userId: string, invoiceId: string) {
    const context = await this.receiptsService.getReceiptContext(
      userId,
      invoiceId,
    );
    return { html: this.receiptsService.renderReceipt(context).html };
  }

  async getInvoiceReceiptPdf(userId: string, invoiceId: string) {
    const context = await this.receiptsService.getReceiptContext(
      userId,
      invoiceId,
    );
    return this.receiptsService.getReceiptPdf(context);
  }

  async sendInvoiceReceipt(userId: string, invoiceId: string, to?: string) {
    const user = await this.getCurrentUser(userId);
    const hotelId = user.hotelId;
    if (!hotelId) throw new BadRequestException('Hotel context not found');

    const [invoice] = await this.db
      .select({ id: invoices.id, reference: invoices.reference })
      .from(invoices)
      .where(and(eq(invoices.hotelId, hotelId), eq(invoices.id, invoiceId)))
      .limit(1);
    if (!invoice) throw new NotFoundException('Invoice not found');

    const delivery = await this.deliverInvoiceReceipt(userId, invoiceId, to);

    if (delivery.result.ok && !delivery.result.skipped) {
      await this.db
        .update(invoices)
        .set({ receiptEmailSentAt: new Date() })
        .where(eq(invoices.id, invoiceId));
    }

    await this.writeActivity(
      hotelId,
      user.id,
      user.fullName,
      'receipt sent',
      delivery.result.skipped
        ? `Receipt ${invoice.reference} queued for ${delivery.to} (SMTP not configured).`
        : delivery.result.ok
          ? `Receipt ${invoice.reference} sent to ${delivery.to}.`
          : `Receipt ${invoice.reference} failed to send to ${delivery.to}.`,
      'invoice',
      invoice.id,
    );

    return {
      ok: delivery.result.ok,
      skipped: delivery.result.skipped,
      info: delivery.result,
      to: delivery.to,
    };
  }

  /** Manually re-send the reservation confirmation email for a stay. */
  async sendReservationConfirmation(userId: string, stayId: string) {
    const user = await this.getCurrentUser(userId);
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

    await this.writeActivity(
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

  async updateStaff(userId: string, id: string, dto: UpdateStaffDto) {
    const currentUser = await this.getCurrentUser(userId);
    const hotelId = currentUser.hotelId;
    if (!hotelId) throw new BadRequestException('Hotel context not found');

    const [existing] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.hotelId, hotelId), eq(users.id, id)))
      .limit(1);

    if (!existing) throw new NotFoundException('Staff member not found');

    const updateFields: any = {};
    if (dto.role !== undefined) updateFields.role = dto.role;
    if (dto.isVerified !== undefined) updateFields.isVerified = dto.isVerified;

    const [updated] = await this.db
      .update(users)
      .set(updateFields)
      .where(and(eq(users.hotelId, hotelId), eq(users.id, id)))
      .returning({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        isVerified: users.isVerified,
      });

    await this.writeActivity(
      hotelId,
      currentUser.id,
      currentUser.fullName,
      'staff updated',
      `Staff ${updated.fullName} role updated to ${updated.role}.`,
      'user',
      updated.id,
    );

    return updated;
  }

  // ==========================================
  // SETTINGS PERSISTENCE
  // ==========================================
  async getSettings(userId: string) {
    const hotelId = await this.getRequiredHotelId(userId);

    let [settings] = await this.db
      .select()
      .from(hotelSettings)
      .where(eq(hotelSettings.hotelId, hotelId))
      .limit(1);

    if (!settings) {
      // Create default settings based on hotels table
      const [hotel] = await this.db
        .select()
        .from(hotels)
        .where(eq(hotels.id, hotelId))
        .limit(1);

      [settings] = await this.db
        .insert(hotelSettings)
        .values({
          hotelId,
          name: hotel?.name ?? 'My Hotel',
          email: hotel?.email ?? '',
          phone: hotel?.phone ?? '',
          address: hotel?.address ?? '',
          timezone: 'UTC',
          currency: 'GHS',
          language: 'en',
          checkInTime: '14:00',
          checkOutTime: '11:00',
          guestIdRequired: true,
          taxRate: '15.00',
          defaultTaxType: 'value',
          defaultTaxValue: '0',
          defaultDiscountType: 'value',
          defaultDiscountValue: '0',
          invoicePrefix: 'INV',
          bookingPolicy: 'Standard cancellation 24h prior to arrival.',
        })
        .returning();
    }

    return settings;
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    const user = await this.getCurrentUser(userId);
    const hotelId = user.hotelId;
    if (!hotelId) throw new BadRequestException('Hotel context not found');

    await this.getSettings(userId); // ensure row exists

    const updateFields: any = { updatedAt: new Date() };
    if (dto.name !== undefined) updateFields.name = dto.name;
    if (dto.email !== undefined) updateFields.email = dto.email;
    if (dto.phone !== undefined) updateFields.phone = dto.phone;
    if (dto.address !== undefined) updateFields.address = dto.address;
    if (dto.logoUrl !== undefined) updateFields.logoUrl = dto.logoUrl;
    if (dto.timezone !== undefined) updateFields.timezone = dto.timezone;
    if (dto.currency !== undefined) updateFields.currency = dto.currency;
    if (dto.language !== undefined) updateFields.language = dto.language;
    if (dto.checkInTime !== undefined)
      updateFields.checkInTime = dto.checkInTime;
    if (dto.checkOutTime !== undefined)
      updateFields.checkOutTime = dto.checkOutTime;
    if (dto.bookingPolicy !== undefined)
      updateFields.bookingPolicy = dto.bookingPolicy;
    if (dto.guestIdRequired !== undefined)
      updateFields.guestIdRequired = dto.guestIdRequired;
    if (dto.taxRate !== undefined) updateFields.taxRate = String(dto.taxRate);
    if (dto.defaultTaxType !== undefined)
      updateFields.defaultTaxType = dto.defaultTaxType;
    if (dto.defaultTaxValue !== undefined)
      updateFields.defaultTaxValue = String(dto.defaultTaxValue);
    if (dto.defaultDiscountType !== undefined)
      updateFields.defaultDiscountType = dto.defaultDiscountType;
    if (dto.defaultDiscountValue !== undefined)
      updateFields.defaultDiscountValue = String(dto.defaultDiscountValue);
    if (dto.invoicePrefix !== undefined)
      updateFields.invoicePrefix = dto.invoicePrefix;
    if (dto.acceptedPaymentMethods !== undefined)
      updateFields.acceptedPaymentMethods = dto.acceptedPaymentMethods;
    if (dto.serviceConfig !== undefined)
      updateFields.serviceConfig = dto.serviceConfig;
    if (dto.notificationPrefs !== undefined)
      updateFields.notificationPrefs = dto.notificationPrefs;
    if (dto.systemPrefs !== undefined)
      updateFields.systemPrefs = dto.systemPrefs;
    if (dto.emailFrom !== undefined)
      updateFields.emailFrom = dto.emailFrom || null;
    if (dto.emailFromName !== undefined)
      updateFields.emailFromName = dto.emailFromName || null;
    if (dto.primaryColor !== undefined)
      updateFields.primaryColor = dto.primaryColor || '#1900ff';
    if (dto.accentColor !== undefined)
      updateFields.accentColor = dto.accentColor || '#0ea5e9';

    const [updated] = await this.db
      .update(hotelSettings)
      .set(updateFields)
      .where(eq(hotelSettings.hotelId, hotelId))
      .returning();

    // Also update hotels table name/email/phone/address if provided
    if (dto.name || dto.email || dto.phone || dto.address) {
      await this.db
        .update(hotels)
        .set({
          ...(dto.name ? { name: dto.name } : {}),
          ...(dto.email ? { email: dto.email } : {}),
          ...(dto.phone ? { phone: dto.phone } : {}),
          ...(dto.address ? { address: dto.address } : {}),
        })
        .where(eq(hotels.id, hotelId));
    }

    await this.writeActivity(
      hotelId,
      user.id,
      user.fullName,
      'settings updated',
      'Hotel operational settings were updated.',
      'settings',
      updated.id,
    );

    return updated;
  }

  /** Send a test email using the platform SMTP with the hotel's branding. */
  async testEmailSend(userId: string, to?: string) {
    const user = await this.getCurrentUser(userId);
    const hotelId = user.hotelId;
    if (!hotelId) throw new BadRequestException('Hotel context not found');

    const { settings, branding, sender, replyTo } =
      await this.getHotelBranding(hotelId);
    const recipient = to?.trim() || settings?.email?.trim() || user.email;
    if (!recipient) {
      throw new BadRequestException(
        'No test recipient. Provide an email or set the hotel email first.',
      );
    }

    if (!this.emailConfig.enabled) {
      return {
        ok: true,
        skipped: true,
        to: recipient,
        info: 'Email provider is not configured (BREVO_API_KEY). The email will be sent once the API key is set.',
      };
    }

    const hotelName = branding.hotelName || 'Your Hotel';
    const primaryColor = branding.primaryColor || '#1900ff';
    const safeName = String(hotelName)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;');

    const result = await this.emailService.send({
      to: recipient,
      subject: `Test email from ${hotelName}`,
      text: `This is a test email from ${hotelName}. If you received this, your email settings are working.`,
      html: `<div style="font-family:sans-serif;background:#f4f4f5;padding:24px"><div style="max-width:480px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7"><div style="background:${primaryColor};padding:20px 24px;color:#fff;font-weight:700">${safeName}</div><div style="padding:24px;color:#18181b"><p style="margin:0 0 12px">This is a <strong>test email</strong> from <strong>${safeName}</strong>.</p><p style="margin:0">If you received this, your email settings are working correctly.</p></div></div></div>`,
      sender,
      replyTo: replyTo || undefined,
    });

    return {
      ok: result.ok,
      skipped: result.skipped,
      error: result.error ?? null,
      info: result,
      to: recipient,
    };
  }

  // ==========================================
  // REPORTING & ANALYTICS
  // ==========================================
  async getReportsSummary(userId: string, query: QueryReportsDto) {
    const hotelId = await this.getDefaultHotelId(userId);
    const hotelFilter = hotelId ? eq(rooms.hotelId, hotelId) : sql`true`;
    const stayHotelFilter = hotelId ? eq(stays.hotelId, hotelId) : sql`true`;
    const paymentHotelFilter = hotelId
      ? eq(payments.hotelId, hotelId)
      : sql`true`;
    const guestHotelFilter = hotelId ? eq(guests.hotelId, hotelId) : sql`true`;
    const roomTypeHotelFilter = hotelId
      ? eq(roomTypes.hotelId, hotelId)
      : sql`true`;
    const housekeepingHotelFilter = hotelId
      ? eq(housekeepingTasks.hotelId, hotelId)
      : sql`true`;

    const now = new Date();
    let startDate = new Date();

    const range = query.range ?? '7d';
    if (range === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === '7d') {
      startDate = new Date(now.getTime() - 7 * 86400000);
    } else if (range === '30d') {
      startDate = new Date(now.getTime() - 30 * 86400000);
    } else if (range === '90d') {
      startDate = new Date(now.getTime() - 90 * 86400000);
    } else if (range === 'custom' && query.startDate) {
      startDate = new Date(query.startDate);
    }

    const [
      allRooms,
      allRoomTypes,
      allGuests,
      allStays,
      allPayments,
      housekeeping,
    ] = await Promise.all([
      this.db.select().from(rooms).where(hotelFilter),
      this.db.select().from(roomTypes).where(roomTypeHotelFilter),
      this.db.select().from(guests).where(guestHotelFilter),
      this.db.select().from(stays).where(stayHotelFilter),
      this.db.select().from(payments).where(paymentHotelFilter),
      this.db.select().from(housekeepingTasks).where(housekeepingHotelFilter),
    ]);

    const totalRooms = allRooms.length;
    const occupiedRooms = allRooms.filter(
      (r) => r.status === 'occupied',
    ).length;
    const availableRooms = allRooms.filter(
      (r) => r.status === 'available',
    ).length;
    const maintenanceRooms = allRooms.filter((r) =>
      ['maintenance', 'out_of_service'].includes(r.status),
    ).length;
    const occupancyRate =
      totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 1000) / 10 : 0;

    const filteredPayments = allPayments.filter(
      (p) => new Date(p.createdAt) >= startDate,
    );
    const totalRevenue = filteredPayments.reduce(
      (sum, p) => sum + money(p.amount),
      0,
    );

    const filteredStays = allStays.filter(
      (s) => new Date(s.createdAt) >= startDate,
    );
    const totalRoomRevenue = filteredStays.reduce(
      (sum, s) => sum + money(s.rate) * (s.nights || 1),
      0,
    );
    const totalServiceRevenue = filteredStays.reduce(
      (sum, s) => sum + money(s.serviceTotal),
      0,
    );
    const totalOutstanding = allStays.reduce(
      (sum, s) => sum + money(s.outstandingBalance),
      0,
    );

    const activeStaysCount = allStays.filter(
      (s) => s.status === 'checked_in',
    ).length;
    const completedStaysCount = filteredStays.filter(
      (s) => s.status === 'checked_out',
    ).length;
    const cancelledStaysCount = filteredStays.filter(
      (s) => s.status === 'cancelled',
    ).length;

    const newGuestsCount = allGuests.filter(
      (g) => new Date(g.createdAt) >= startDate,
    ).length;

    // Build day-by-day trends (past 7 slots)
    const daysCount =
      range === 'today' ? 1 : range === '7d' ? 7 : range === '30d' ? 10 : 7;
    const dailyTrends = Array.from({ length: daysCount }, (_, i) => {
      const d = new Date(now.getTime() - (daysCount - 1 - i) * 86400000);
      const iso = d.toISOString().slice(0, 10);
      const dayPayments = allPayments.filter(
        (p) => new Date(p.createdAt).toISOString().slice(0, 10) === iso,
      );
      const dayStays = allStays.filter(
        (s) => new Date(s.createdAt).toISOString().slice(0, 10) === iso,
      );

      const dayRevenue = dayPayments.reduce(
        (sum, p) => sum + money(p.amount),
        0,
      );
      const dayOccupancy =
        totalRooms > 0
          ? Math.round(
              Math.min(100, (dayStays.length / totalRooms) * 100) * 10,
            ) / 10
          : 0;

      return {
        date: iso,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: dayRevenue,
        occupancy: dayOccupancy || occupancyRate,
      };
    });

    const roomTypeRevenue = allRoomTypes.map((rt) => {
      const rtStays = filteredStays.filter((s) => s.roomTypeId === rt.id);
      return {
        id: rt.id,
        name: rt.name,
        revenue: rtStays.reduce((sum, s) => sum + money(s.total), 0),
        bookingsCount: rtStays.length,
      };
    });

    return {
      range,
      occupancy: {
        totalRooms,
        occupiedRooms,
        availableRooms,
        maintenanceRooms,
        occupancyRate: Math.round(occupancyRate * 10) / 10,
      },
      revenue: {
        totalRevenue: roundMoney(totalRevenue),
        roomRevenue: roundMoney(totalRoomRevenue),
        serviceRevenue: roundMoney(totalServiceRevenue),
        outstandingBalance: roundMoney(totalOutstanding),
      },
      bookings: {
        totalBookings: filteredStays.length,
        activeStays: activeStaysCount,
        completedStays: completedStaysCount,
        cancelledStays: cancelledStaysCount,
      },
      guests: {
        totalGuests: allGuests.length,
        newGuests: newGuestsCount,
      },
      housekeeping: {
        cleaning: housekeeping.filter((h) => h.status === 'cleaning').length,
        inspection: housekeeping.filter((h) => h.status === 'inspection')
          .length,
        ready: housekeeping.filter((h) => h.status === 'ready').length,
        maintenance: housekeeping.filter((h) => h.status === 'maintenance')
          .length,
      },
      dailyTrends,
      roomTypeRevenue,
    };
  }
}
