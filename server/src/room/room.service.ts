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
import { UpdateRoomDto } from './dto/update-room.dto';
import { UpdateRoomStatusDto } from './dto/update-room-status.dto';
import { activityLogs, notifications, rooms, users } from '../database/schema';
import { and, desc, eq, sql } from 'drizzle-orm';

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

    return user.hotel_id;
  }

  private async writeActivity(
    hotelId: string | null,
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
    const hotelId = await this.getUserHotelId(userId);
    const hotelFilter = hotelId ? eq(rooms.hotelId, hotelId) : sql`true`;

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

    return foundRoom;
  }

  async findAll(userId: string) {
    const hotelId = await this.getUserHotelId(userId);
    const hotelFilter = hotelId ? eq(rooms.hotelId, hotelId) : sql`true`;

    return this.db
      .select()
      .from(rooms)
      .where(hotelFilter)
      .orderBy(desc(rooms.updatedAt));
  }

  async update(id: string, userId: string, dto: UpdateRoomDto) {
    const hotelId = await this.getUserHotelId(userId);
    const hotelFilter = hotelId ? eq(rooms.hotelId, hotelId) : sql`true`;

    const [existing] = await this.db
      .select()
      .from(rooms)
      .where(and(hotelFilter, eq(rooms.id, id)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    const updateFields: any = {
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

  async updateStatus(id: string, userId: string, dto: UpdateRoomStatusDto) {
    const hotelId = await this.getUserHotelId(userId);
    const hotelFilter = hotelId ? eq(rooms.hotelId, hotelId) : sql`true`;

    const [existing] = await this.db
      .select()
      .from(rooms)
      .where(and(hotelFilter, eq(rooms.id, id)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Room with ID ${id} not found`);
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

  async remove(id: string, userId: string) {
    const hotelId = await this.getUserHotelId(userId);
    const hotelFilter = hotelId ? eq(rooms.hotelId, hotelId) : sql`true`;

    const [existing] = await this.db
      .select()
      .from(rooms)
      .where(and(hotelFilter, eq(rooms.id, id)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    if (existing.status === 'occupied') {
      throw new BadRequestException('Cannot delete an occupied room');
    }

    await this.db
      .delete(rooms)
      .where(and(hotelFilter, eq(rooms.id, id)));

    await this.writeActivity(
      hotelId,
      userId,
      null,
      'room deleted',
      `Room ${existing.number} was deleted.`,
      'room',
      id,
    );

    return { ok: true, message: `Room ${existing.number} deleted successfully` };
  }
}
