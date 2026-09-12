import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDatabase } from '../database/database.decorator';
import type { Database } from '../database/database.types';
import { hotels, housekeepingTasks, rooms, users } from '../database/schema';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { CreateHousekeepingTaskDto, UpdateHousekeepingDto } from '../shared/dto';
import { HotelContextService } from '../common/hotel-context.service';
import { ActivityService } from '../common/activity.service';


@Injectable()
export class HousekeepingService {
  constructor(
    @InjectDatabase() private readonly db: Database,
    private readonly hotelContext: HotelContextService,
    private readonly activity: ActivityService,
  ) {}

  // ==========================================
  // HOUSEKEEPING
  // ==========================================
  async listHousekeeping(userId?: string) {
    const hotelId = userId ? await this.hotelContext.getDefaultHotelId(userId) : null;
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
    const hotelId = await this.hotelContext.getDefaultHotelId(userId);
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
    const user = await this.hotelContext.getCurrentUser(userId);
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

    await this.activity.writeActivity(
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
    const user = await this.hotelContext.getCurrentUser(userId);
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
      await this.activity.writeNotification(
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

    await this.activity.writeActivity(
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

}
