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
  notifications,
  payments,
  rooms,
  roomTypes,
  stays,
  users,
} from '../database/schema';
import { and, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import {
  InviteStaffDto,
  QueryReportsDto,
  UpdateSettingsDto,
  UpdateStaffDto,
} from '../shared/dto';
import * as crypto from 'crypto';
import { EmailConfig } from '../email/email.config';
import { EmailService } from '../email/email.service';
import { formatReference, money, roundMoney } from '../common/pricing.util';
import { HotelContextService } from '../common/hotel-context.service';
import { ActivityService } from '../common/activity.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectDatabase() private readonly db: Database,
    private readonly emailService: EmailService,
    private readonly emailConfig: EmailConfig,
    private readonly hotelContext: HotelContextService,
    private readonly activity: ActivityService,
  ) {}

  // ==========================================
  // DASHBOARD
  // ==========================================
  async dashboard(userId: string) {
    const hotelId = await this.hotelContext.getDefaultHotelId(userId);
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
        turningOver: allRooms.filter((room) =>
          ['cleaning', 'inspection'].includes(room.status),
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
        cleaning: allRooms.filter((room) => room.status === 'cleaning').length,
        inspection: allRooms.filter((room) => room.status === 'inspection')
          .length,
        ready: availableRooms.length,
        maintenance: allRooms.filter((room) => room.status === 'maintenance')
          .length,
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
  // GLOBAL SEARCH
  // ==========================================
  private escapeLike(value: string) {
    return value.replace(/[\\%_]/g, (m) => `\\${m}`);
  }

  async globalSearch(userId: string, rawQuery?: string) {
    const hotelId = await this.hotelContext.getDefaultHotelId(userId);

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



  // ==========================================
  // ACTIVITY LOGS & NOTIFICATIONS
  // ==========================================
  async listActivity(userId: string) {
    const hotelId = await this.hotelContext.getDefaultHotelId(userId);
    const filter = hotelId ? eq(activityLogs.hotelId, hotelId) : sql`true`;
    return this.db
      .select()
      .from(activityLogs)
      .where(filter)
      .orderBy(desc(activityLogs.createdAt))
      .limit(100);
  }

  async getActivity(userId: string, id: string) {
    const hotelId = await this.hotelContext.getDefaultHotelId(userId);
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
    const hotelId = await this.hotelContext.getDefaultHotelId(userId);
    const filter = hotelId ? eq(notifications.hotelId, hotelId) : sql`true`;
    return this.db
      .select()
      .from(notifications)
      .where(filter)
      .orderBy(desc(notifications.createdAt))
      .limit(100);
  }

  async markNotificationRead(userId: string, id: string) {
    const hotelId = await this.hotelContext.getDefaultHotelId(userId);
    const filter = hotelId ? eq(notifications.hotelId, hotelId) : sql`true`;

    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(and(filter, eq(notifications.id, id)));

    return { ok: true };
  }

  async markAllNotificationsRead(userId: string) {
    const hotelId = await this.hotelContext.getDefaultHotelId(userId);
    const filter = hotelId ? eq(notifications.hotelId, hotelId) : sql`true`;

    await this.db.update(notifications).set({ isRead: true }).where(filter);

    return { ok: true };
  }

  // ==========================================
  // STAFF MANAGEMENT
  // ==========================================
  async listStaff(userId: string) {
    const hotelId = await this.hotelContext.getDefaultHotelId(userId);
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
    const hotelId = await this.hotelContext.getRequiredHotelId(userId);

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
    const user = await this.hotelContext.getCurrentUser(userId);
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

    await this.activity.writeActivity(
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
        await this.hotelContext.getHotelBranding(hotelId);
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
    const user = await this.hotelContext.getCurrentUser(userId);
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

    await this.activity.writeActivity(
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
    const user = await this.hotelContext.getCurrentUser(userId);
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
        await this.hotelContext.getHotelBranding(hotelId);
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

    await this.activity.writeActivity(
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



  async updateStaff(userId: string, id: string, dto: UpdateStaffDto) {
    const currentUser = await this.hotelContext.getCurrentUser(userId);
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

    await this.activity.writeActivity(
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

  async deleteStaff(userId: string, id: string) {
    const currentUser = await this.hotelContext.getCurrentUser(userId);
    const hotelId = currentUser.hotelId;
    if (!hotelId) throw new BadRequestException('Hotel context not found');

    if (currentUser.id === id) {
      throw new BadRequestException(
        'You cannot remove your own account here.',
      );
    }

    const [existing] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.hotelId, hotelId), eq(users.id, id)))
      .limit(1);

    if (!existing) throw new NotFoundException('Staff member not found');

    if (existing.role === 'owner') {
      throw new ForbiddenException(
        'The hotel owner account cannot be removed by another staff member.',
      );
    }

    const [removed] = await this.db
      .delete(users)
      .where(and(eq(users.hotelId, hotelId), eq(users.id, id)))
      .returning({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
      });

    // Also withdraw any pending invitation sent to that address.
    await this.db
      .update(invitations)
      .set({ status: 'revoked', updatedAt: new Date() })
      .where(
        and(
          eq(invitations.hotelId, hotelId),
          eq(invitations.email, existing.email.toLowerCase()),
          eq(invitations.status, 'pending'),
        ),
      );

    await this.activity.writeActivity(
      hotelId,
      currentUser.id,
      currentUser.fullName,
      'staff removed',
      `Staff ${removed.fullName} (${removed.email}) was removed from the hotel.`,
      'user',
      removed.id,
    );

    return { ok: true, removed };
  }

  // ==========================================
  // SETTINGS PERSISTENCE
  // ==========================================
  async getSettings(userId: string) {
    const hotelId = await this.hotelContext.getRequiredHotelId(userId);

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
    const user = await this.hotelContext.getCurrentUser(userId);
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

    await this.activity.writeActivity(
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
    const user = await this.hotelContext.getCurrentUser(userId);
    const hotelId = user.hotelId;
    if (!hotelId) throw new BadRequestException('Hotel context not found');

    const { settings, branding, sender, replyTo } =
      await this.hotelContext.getHotelBranding(hotelId);
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
    const hotelId = await this.hotelContext.getDefaultHotelId(userId);
    const hotelFilter = hotelId ? eq(rooms.hotelId, hotelId) : sql`true`;
    const stayHotelFilter = hotelId ? eq(stays.hotelId, hotelId) : sql`true`;
    const paymentHotelFilter = hotelId
      ? eq(payments.hotelId, hotelId)
      : sql`true`;
    const guestHotelFilter = hotelId ? eq(guests.hotelId, hotelId) : sql`true`;
    const roomTypeHotelFilter = hotelId
      ? eq(roomTypes.hotelId, hotelId)
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
    ] = await Promise.all([
      this.db.select().from(rooms).where(hotelFilter),
      this.db.select().from(roomTypes).where(roomTypeHotelFilter),
      this.db.select().from(guests).where(guestHotelFilter),
      this.db.select().from(stays).where(stayHotelFilter),
      this.db.select().from(payments).where(paymentHotelFilter),
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
        cleaning: allRooms.filter((r) => r.status === 'cleaning').length,
        inspection: allRooms.filter((r) => r.status === 'inspection').length,
        ready: allRooms.filter((r) => r.status === 'available').length,
        maintenance: allRooms.filter((r) =>
          ['maintenance', 'out_of_service'].includes(r.status),
        ).length,
      },
      dailyTrends,
      roomTypeRevenue,
    };
  }
}
