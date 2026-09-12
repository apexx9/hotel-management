import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDatabase } from '../database/database.decorator';
import type { Database } from '../database/database.types';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreateRoomsBulkDto } from './dto/create-rooms-bulk.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { UpdateRoomStatusDto } from './dto/update-room-status.dto';
import {
  activityLogs,
  housekeepingTasks,
  notifications,
  rooms,
  stays,
  users,
} from '../database/schema';
import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';

@Injectable()
export class RoomService {
  constructor(@InjectDatabase() private readonly db: Database) {}

  private async getUserHotelId(userId: string): Promise<string | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    return user.hotelId;
  }

  private async getRequiredHotelId(userId: string): Promise<string> {
    const hotelId = await this.getUserHotelId(userId);
    if (!hotelId) {
      throw new BadRequestException('Hotel context not found');
    }
    return hotelId;
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

  async create(userId: string, dto: CreateRoomDto) {
    const hotelId = await this.getRequiredHotelId(userId);
    const hotelFilter = eq(rooms.hotelId, hotelId);

    const [existing] = await this.db
      .select()
      .from(rooms)
      .where(and(hotelFilter, eq(rooms.number, dto.number)))
      .limit(1);

    if (existing) {
      throw new ConflictException(`Room ${dto.number} already exists`);
    }

    const [newRoom] = await this.db
      .insert(rooms)
      .values({
        hotelId,
        number: dto.number,
        floor: String(dto.floor),
        roomTypeId: dto.roomTypeId,
        rate: dto.rate !== undefined ? String(dto.rate) : '0',
        capacity: dto.capacity ?? 2,
        status: 'available',
      })
      .returning();

    await this.writeActivity(
      hotelId,
      userId,
      null,
      'room created',
      `Room ${newRoom.number} created on Floor ${newRoom.floor}.`,
      'room',
      newRoom.id,
    );

    return newRoom;
  }

  async createMany(userId: string, dto: CreateRoomsBulkDto) {
    const hotelId = await this.getRequiredHotelId(userId);

    const seen = new Set<string>();
    const uniqueRooms = dto.rooms.filter((room) => {
      const number = room.number.trim();
      if (seen.has(number)) return false;
      seen.add(number);
      return true;
    });

    const existing = await this.db
      .select({ number: rooms.number })
      .from(rooms)
      .where(eq(rooms.hotelId, hotelId));

    const existingNumbers = new Set(existing.map((r) => r.number));
    const conflicted = new Set<string>();
    const toCreate = uniqueRooms.filter((room) => {
      const number = room.number.trim();
      if (existingNumbers.has(number)) {
        conflicted.add(number);
        return false;
      }
      return true;
    });

    const roomValues: (typeof rooms.$inferInsert)[] = toCreate.map((room) => ({
      hotelId,
      number: room.number.trim(),
      floor: String(room.floor),
      roomTypeId: room.roomTypeId,
      rate: room.rate !== undefined ? String(room.rate) : '0',
      capacity: room.capacity ?? 2,
      status: 'available',
    }));

    const created = toCreate.length
      ? await this.db.insert(rooms).values(roomValues).returning()
      : [];

    if (created.length) {
      await this.writeActivity(
        hotelId,
        userId,
        null,
        'bulk rooms created',
        `Created ${created.length} room(s): ${created
          .map((r) => r.number)
          .join(', ')}.`,
      );
    }

    return {
      created,
      conflicts: [...conflicted],
    };
  }

  async findOne(id: string, userId: string) {
    const hotelId = await this.getUserHotelId(userId);
    const hotelFilter = hotelId ? eq(rooms.hotelId, hotelId) : sql`true`;

    const [foundRoom] = await this.db
      .select()
      .from(rooms)
      .where(and(hotelFilter, eq(rooms.id, id)))
      .limit(1);

    if (!foundRoom) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    return (await this.applyEffectiveStatus([foundRoom], hotelId))[0];
  }

  async findAll(userId: string, query?: string) {
    const hotelId = await this.getUserHotelId(userId);
    const hotelFilter = hotelId ? eq(rooms.hotelId, hotelId) : sql`true`;

    let rows = await this.db
      .select()
      .from(rooms)
      .where(hotelFilter)
      .orderBy(desc(rooms.updatedAt));

    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.number.toLowerCase().includes(q) ||
          String(r.floor).toLowerCase().includes(q),
      );
    }

    return this.applyEffectiveStatus(rows, hotelId);
  }

  async update(id: string, userId: string, dto: UpdateRoomDto) {
    const hotelId = await this.getRequiredHotelId(userId);
    const hotelFilter = eq(rooms.hotelId, hotelId);

    const [existing] = await this.db
      .select()
      .from(rooms)
      .where(and(hotelFilter, eq(rooms.id, id)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    const updateFields: Partial<typeof rooms.$inferInsert> & {
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (dto.number !== undefined) updateFields.number = dto.number;
    if (dto.floor !== undefined) updateFields.floor = String(dto.floor);
    if (dto.roomTypeId !== undefined) updateFields.roomTypeId = dto.roomTypeId;
    if (dto.rate !== undefined) updateFields.rate = String(dto.rate);
    if (dto.capacity !== undefined) updateFields.capacity = dto.capacity;
    if (dto.status !== undefined) updateFields.status = dto.status;

    const [updatedRoom] = await this.db
      .update(rooms)
      .set(updateFields)
      .where(and(hotelFilter, eq(rooms.id, id)))
      .returning();

    await this.writeActivity(
      hotelId,
      userId,
      null,
      'room updated',
      `Room ${updatedRoom.number} updated.`,
      'room',
      updatedRoom.id,
    );

    return updatedRoom;
  }

  private startOfTomorrow(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  }

  private isDueStay(
    stay: Pick<NonNullable<typeof stays.$inferSelect>, 'expectedCheckInAt'>,
  ): boolean {
    return stay.expectedCheckInAt.getTime() < this.startOfTomorrow().getTime();
  }

  private async blockingStayForRoom(hotelId: string, roomId: string) {
    const [stay] = await this.db
      .select()
      .from(stays)
      .where(
        and(
          eq(stays.hotelId, hotelId),
          eq(stays.roomId, roomId),
          or(
            eq(stays.status, 'checked_in'),
            and(
              inArray(stays.status, ['reserved', 'pending_arrival']),
              sql`${stays.expectedCheckInAt}::timestamptz < ${this.startOfTomorrow()}::timestamptz`,
            ),
          ),
        ),
      )
      .limit(1);
    return stay ?? null;
  }

  private async applyEffectiveStatus(
    rows: (typeof rooms.$inferSelect)[],
    hotelId: string | null,
  ) {
    if (rows.length === 0) return rows;

    const stayHotelFilter = hotelId ? eq(stays.hotelId, hotelId) : sql`true`;

    const dueStays = await this.db
      .select({ roomId: stays.roomId })
      .from(stays)
      .where(
        and(
          stayHotelFilter,
          inArray(
            stays.roomId,
            rows.map((room) => room.id),
          ),
          inArray(stays.status, ['reserved', 'pending_arrival']),
          sql`${stays.expectedCheckInAt}::timestamptz < ${this.startOfTomorrow()}::timestamptz`,
        ),
      );

    const dueRoomIds = new Set(dueStays.map((stay) => stay.roomId));

    return rows.map((room) => {
      if (room.status === 'available' && dueRoomIds.has(room.id)) {
        return { ...room, status: 'reserved' };
      }
      if (room.status === 'reserved' && !dueRoomIds.has(room.id)) {
        return { ...room, status: 'available' };
      }
      return room;
    });
  }

  async updateStatus(id: string, userId: string, dto: UpdateRoomStatusDto) {
    const hotelId = await this.getRequiredHotelId(userId);
    const hotelFilter = eq(rooms.hotelId, hotelId);

    const [existing] = await this.db
      .select()
      .from(rooms)
      .where(and(hotelFilter, eq(rooms.id, id)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    if (dto.status === 'occupied' || dto.status === 'reserved') {
      throw new BadRequestException(
        `Room status '${dto.status}' is assigned automatically by the booking lifecycle`,
      );
    }

    const blockingStay = await this.blockingStayForRoom(hotelId, existing.id);
    if (blockingStay && dto.status === 'available') {
      throw new ConflictException(
        `Room ${existing.number} has an active stay and cannot be marked available`,
      );
    }
    if (
      blockingStay &&
      (dto.status === 'maintenance' || dto.status === 'out_of_service')
    ) {
      throw new ConflictException(
        `Room ${existing.number} has an active stay and cannot be taken out of service`,
      );
    }

    const [updatedRoom] = await this.db
      .update(rooms)
      .set({
        status: dto.status,
        updatedAt: new Date(),
      })
      .where(and(hotelFilter, eq(rooms.id, id)))
      .returning();

    await this.writeActivity(
      hotelId,
      userId,
      null,
      'room status updated',
      `Room ${updatedRoom.number} status changed to ${dto.status}.`,
      'room',
      updatedRoom.id,
    );

    if (dto.status === 'available') {
      await this.db.insert(notifications).values({
        hotelId,
        type: 'room_ready',
        title: 'Room available',
        message: `Room ${updatedRoom.number} is now available.`,
        referenceType: 'room',
        referenceId: updatedRoom.id,
      });
    }

    return updatedRoom;
  }

  async markAvailable(id: string, userId: string) {
    const hotelId = await this.getRequiredHotelId(userId);
    const hotelFilter = eq(rooms.hotelId, hotelId);

    const [existing] = await this.db
      .select()
      .from(rooms)
      .where(and(hotelFilter, eq(rooms.id, id)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    const blockingStay = await this.blockingStayForRoom(hotelId, existing.id);
    if (blockingStay) {
      throw new ConflictException(
        `Room ${existing.number} has an active stay and cannot be marked available`,
      );
    }

    if (!existing.isActive) {
      throw new ConflictException(
        `Room ${existing.number} is deactivated and cannot be marked available`,
      );
    }

    await this.db
      .update(housekeepingTasks)
      .set({
        status: 'ready',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(housekeepingTasks.hotelId, hotelId),
          eq(housekeepingTasks.roomId, existing.id),
          inArray(housekeepingTasks.status, [
            'cleaning',
            'inspection',
            'maintenance',
          ]),
        ),
      );

    const [updatedRoom] = await this.db
      .update(rooms)
      .set({
        status: 'available',
        updatedAt: new Date(),
      })
      .where(and(hotelFilter, eq(rooms.id, id)))
      .returning();

    await this.writeActivity(
      hotelId,
      userId,
      null,
      'room marked available',
      `Room ${updatedRoom.number} marked available.`,
      'room',
      updatedRoom.id,
    );

    await this.db.insert(notifications).values({
      hotelId,
      type: 'room_ready',
      title: 'Room available',
      message: `Room ${updatedRoom.number} is now available.`,
      referenceType: 'room',
      referenceId: updatedRoom.id,
    });

    return updatedRoom;
  }

  async remove(id: string, userId: string) {
    const hotelId = await this.getRequiredHotelId(userId);
    const hotelFilter = eq(rooms.hotelId, hotelId);

    const [existing] = await this.db
      .select()
      .from(rooms)
      .where(and(hotelFilter, eq(rooms.id, id)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    if (
      existing.status === 'occupied' ||
      (await this.blockingStayForRoom(hotelId, id))
    ) {
      throw new BadRequestException(
        'Cannot delete a room that is occupied or has a stay due today',
      );
    }

    await this.db.delete(rooms).where(and(hotelFilter, eq(rooms.id, id)));

    await this.writeActivity(
      hotelId,
      userId,
      null,
      'room deleted',
      `Room ${existing.number} was deleted.`,
      'room',
      id,
    );

    return {
      ok: true,
      message: `Room ${existing.number} deleted successfully`,
    };
  }
}
