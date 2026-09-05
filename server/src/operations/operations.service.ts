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
import { and, desc, eq, isNull, sql, or, inArray } from 'drizzle-orm';
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
  UpdateGuestDto,
  UpdateHousekeepingDto,
  UpdateRoomTypeDto,
  UpdateServiceDto,
  UpdateSettingsDto,
  UpdateStaffDto,
} from './dto';
import * as crypto from 'crypto';
import * as puppeteer from 'puppeteer';
import { MailService } from '../auth/mail.service';

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
    private readonly mailService: MailService,
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

    return user as UserContext;
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
      ? (occupiedRooms.length / totalRooms) * 100
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
    filters?: { status?: string; guestId?: string; roomId?: string },
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
      conditions.push(eq(stays.status, filters.status as any));
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

    return allStays.map((stay) => {
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
    });
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
      .where(eq(guests.id, stay.guestId))
      .limit(1);

    const [room] = await this.db
      .select()
      .from(rooms)
      .where(eq(rooms.id, stay.roomId))
      .limit(1);

    const [roomType] = await this.db
      .select()
      .from(roomTypes)
      .where(eq(roomTypes.id, stay.roomTypeId))
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

  async createBooking(userId: string, dto: CreateBookingDto) {
    return this.db.transaction(async (tx) => {
      const user = await this.getCurrentUser(userId);
      const hotelId = user.hotelId;
      if (!hotelId) throw new BadRequestException('Hotel context not found');
      const hotelFilter = eq(guests.hotelId, hotelId);

      let guestRecord = dto.guestId
        ? (
            await tx
              .select()
              .from(guests)
              .where(eq(guests.id, dto.guestId))
              .limit(1)
          )[0]
        : undefined;

      if (!guestRecord) {
        const [existingGuest] = await tx
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

        guestRecord = existingGuest;
      }

      if (!guestRecord) {
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

      if (!guestRecord) {
        throw new BadRequestException('Unable to resolve guest');
      }

      let roomRecord: any = undefined;

      if (dto.roomId) {
        [roomRecord] = await tx
          .select()
          .from(rooms)
          .where(eq(rooms.id, dto.roomId))
          .limit(1);
      } else if (dto.roomTypeId) {
        [roomRecord] = await tx
          .select()
          .from(rooms)
          .where(
            and(
              eq(rooms.roomTypeId, dto.roomTypeId),
              eq(rooms.status, 'available'),
            ),
          )
          .limit(1);
      } else {
        [roomRecord] = await tx
          .select()
          .from(rooms)
          .where(eq(rooms.status, 'available'))
          .limit(1);
      }

      if (!roomRecord) {
        throw new ConflictException('No available room found');
      }

      if (!['available'].includes(roomRecord.status)) {
        throw new ConflictException('Room is not available');
      }

      const [roomTypeRecord] = await tx
        .select()
        .from(roomTypes)
        .where(eq(roomTypes.id, roomRecord.roomTypeId))
        .limit(1);

      if (!roomTypeRecord) {
        throw new NotFoundException('Room type not found');
      }

      const rate =
        dto.rate || money(roomRecord.rate) || money(roomTypeRecord.basePrice);
      const totals = this.computeTotals({
        rate,
        nights: dto.nights,
        discount: dto.discount,
        taxes: dto.taxes ?? 0,
        serviceTotal: 0,
      });
      const amountPaid = dto.amountPaid ?? 0;
      const outstanding = roundMoney(Math.max(0, totals.total - amountPaid));
      const stayStatus = dto.checkInNow ? 'checked_in' : 'reserved';
      const reference = formatReference('ST');

      const [createdStay] = await tx
        .insert(stays)
        .values({
          hotelId,
          reference,
          guestId: guestRecord.id,
          roomId: roomRecord.id,
          roomTypeId: roomTypeRecord.id,
          status: stayStatus,
          expectedCheckInAt: dto.checkInNow
            ? new Date()
            : dto.expectedCheckInAt
              ? new Date(dto.expectedCheckInAt)
              : new Date(), // <-- ADD THIS LINE
          expectedCheckoutAt: new Date(Date.now() + dto.nights * 86400000),
          guestsCount: dto.guestsCount,
          nights: dto.nights,
          rate: String(rate),
          discount: String(dto.discount ?? 0),
          taxes: String(dto.taxes ?? 0),
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
        ...(dto.discount
          ? [
              {
                invoiceId: createdInvoice.id,
                description: 'Discount',
                quantity: 1,
                unitPrice: String(-Math.abs(dto.discount)),
                total: String(-Math.abs(dto.discount)),
                itemType: 'discount',
              },
            ]
          : []),
        ...(dto.taxes
          ? [
              {
                invoiceId: createdInvoice.id,
                description: 'Tax / fees',
                quantity: 1,
                unitPrice: String(dto.taxes),
                total: String(dto.taxes),
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

      await this.writeActivity(
        hotelId,
        user.id,
        user.fullName,
        'booking created',
        `Stay ${reference} created for ${guestRecord.firstName} ${guestRecord.lastName}.`,
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
  }

  async checkIn(userId: string, dto: CheckInDto) {
    return this.db.transaction(async (tx) => {
      const user = await this.getCurrentUser(userId);
      const [stay] = await tx
        .select()
        .from(stays)
        .where(eq(stays.id, dto.stayId))
        .limit(1);

      if (!stay) throw new NotFoundException('Stay not found');

      const [room] = await tx
        .select()
        .from(rooms)
        .where(eq(rooms.id, stay.roomId))
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
    return this.db.transaction(async (tx) => {
      const user = await this.getCurrentUser(userId);
      const [stay] = await tx
        .select()
        .from(stays)
        .where(eq(stays.id, dto.stayId))
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

      await tx
        .update(rooms)
        .set({
          status: 'cleaning',
          updatedAt: new Date(),
        })
        .where(eq(rooms.id, stay.roomId));

      await tx.insert(housekeepingTasks).values({
        hotelId: stay.hotelId,
        roomId: stay.roomId,
        stayId: stay.id,
        status: 'cleaning',
        note: `Turnaround task from checkout ${stay.reference}`,
      });

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
        `Stay ${stay.reference} checked out. Room sent to housekeeping.`,
        'stay',
        stay.id,
      );

      return { ok: true, outstanding: Math.max(0, outstanding) };
    });
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
    return this.db.transaction(async (tx) => {
      const user = await this.getCurrentUser(userId);
      const [stay] = await tx
        .select()
        .from(stays)
        .where(eq(stays.id, dto.stayId))
        .limit(1);
      if (!stay) throw new NotFoundException('Stay not found');

      const [invoice] = await tx
        .select()
        .from(invoices)
        .where(eq(invoices.id, dto.invoiceId))
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
        .where(eq(stays.id, dto.stayId))
        .limit(1);
      if (!stay) throw new NotFoundException('Stay not found');

      const [service] = await tx
        .select()
        .from(services)
        .where(and(eq(services.id, dto.serviceId), eq(services.isActive, true)))
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
    return this.db
      .select()
      .from(housekeepingTasks)
      .where(filter)
      .orderBy(desc(housekeepingTasks.createdAt));
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
      .where(eq(rooms.id, dto.roomId))
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
      .where(eq(rooms.id, dto.roomId))
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
        and(eq(invitations.hotelId, hotelId), isNull(invitations.acceptedAt)),
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
      const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
      const inviteUrl = `${frontend}/invite/${token}`;
      const subject = `You're invited to join ${user.fullName || 'the hotel'}`;
      const text = `You have been invited to join the hotel workspace as ${dto.role}. Visit ${inviteUrl} to accept the invitation.`;
      const html = `<p>You have been invited to join the hotel workspace as <strong>${dto.role}</strong>.</p><p>Click <a href="${inviteUrl}">here</a> to accept the invitation. The link expires in 7 days.</p>`;
      await this.mailService.sendMail(dto.email, subject, text, html);
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

  async getInvoiceReceipt(userId: string, invoiceId: string) {
    const user = await this.getCurrentUser(userId);
    const hotelId = user.hotelId;
    if (!hotelId) throw new BadRequestException('Hotel context not found');

    const [invoice] = await this.db
      .select()
      .from(invoices)
      .where(and(eq(invoices.hotelId, hotelId), eq(invoices.id, invoiceId)))
      .limit(1);

    if (!invoice) throw new NotFoundException('Invoice not found');

    const items = await this.db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoice.id));

    // Basic HTML receipt
    const html = `
      <html>
      <head><meta charset="utf-8"><title>Receipt ${invoice.reference}</title></head>
      <body style="font-family: Arial, sans-serif; color:#111;">
        <h2>Receipt: ${invoice.reference}</h2>
        <p>Total: ${invoice.total}</p>
        <p>Issued: ${invoice.issuedAt}</p>
        <hr />
        <h4>Items</h4>
        <ul>
          ${items.map((it: any) => `<li>${it.description} — ${it.total}</li>`).join('')}
        </ul>
      </body>
      </html>
    `;

    return { html };
  }

  async getInvoiceReceiptPdf(userId: string, invoiceId: string) {
    const user = await this.getCurrentUser(userId);
    const hotelId = user.hotelId;
    if (!hotelId) throw new BadRequestException('Hotel context not found');

    const [invoice] = await this.db
      .select()
      .from(invoices)
      .where(and(eq(invoices.hotelId, hotelId), eq(invoices.id, invoiceId)))
      .limit(1);

    if (!invoice) throw new NotFoundException('Invoice not found');

    const receipt = await this.getInvoiceReceipt(userId, invoiceId);

    // render PDF via puppeteer
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(receipt.html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'A4', printBackground: true });
      const filename = `receipt-${invoice.reference || invoice.id}.pdf`;
      return { pdf, filename };
    } finally {
      await browser.close();
    }
  }

  async sendInvoiceReceipt(userId: string, invoiceId: string, to?: string) {
    const user = await this.getCurrentUser(userId);
    const hotelId = user.hotelId;
    if (!hotelId) throw new BadRequestException('Hotel context not found');

    const [invoice] = await this.db
      .select()
      .from(invoices)
      .where(and(eq(invoices.hotelId, hotelId), eq(invoices.id, invoiceId)))
      .limit(1);

    if (!invoice) throw new NotFoundException('Invoice not found');

    const receipt = await this.getInvoiceReceipt(userId, invoiceId);

    const recipient =
      to || invoice.guestId ? String(invoice.guestId) : undefined;
    // guest email lookup
    let guestEmail: string | undefined = undefined;
    if (!to) {
      const [guest] = await this.db
        .select()
        .from(guests)
        .where(eq(guests.id, invoice.guestId))
        .limit(1);
      guestEmail = guest?.email ?? undefined;
    }

    const finalTo = to || guestEmail;
    if (!finalTo) throw new BadRequestException('Recipient email not found');

    const subject = `Receipt ${invoice.reference}`;
    const text = `Your receipt for ${invoice.reference}. Total: ${invoice.total}`;

    // attempt to generate PDF and attach when possible
    let attachment;
    try {
      const pdfResult = await this.getInvoiceReceiptPdf(userId, invoiceId);
      attachment = {
        filename: pdfResult.filename,
        content: pdfResult.pdf,
        contentType: 'application/pdf',
      };
    } catch (err) {
      // PDF generation failed — continue with HTML-only mail
      attachment = undefined;
    }

    const result = await this.mailService.sendMail(
      finalTo,
      subject,
      text,
      receipt.html,
      attachment ? [attachment] : undefined,
    );

    await this.writeActivity(
      hotelId,
      user.id,
      user.fullName,
      'receipt sent',
      `Receipt ${invoice.reference} sent to ${finalTo}.`,
      'invoice',
      invoice.id,
    );

    return { ok: result.ok, info: result };
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
      totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

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
          ? Math.min(100, (dayStays.length / totalRooms) * 100)
          : 0;

      return {
        date: iso,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: dayRevenue,
        occupancy: dayOccupancy || Math.round(occupancyRate),
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
        occupancyRate: roundMoney(occupancyRate),
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
