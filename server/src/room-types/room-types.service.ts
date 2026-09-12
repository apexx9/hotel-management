import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDatabase } from '../database/database.decorator';
import type { Database } from '../database/database.types';
import { roomTypes } from '../database/schema';
import { and, desc, eq, sql } from 'drizzle-orm';
import { CreateRoomTypeDto, UpdateRoomTypeDto } from '../shared/dto';
import { HotelContextService } from '../common/hotel-context.service';
import { ActivityService } from '../common/activity.service';


@Injectable()
export class RoomTypesService {
  constructor(
    @InjectDatabase() private readonly db: Database,
    private readonly hotelContext: HotelContextService,
    private readonly activity: ActivityService,
  ) {}

  async listRoomTypes(userId?: string) {
    const hotelId = userId ? await this.hotelContext.getDefaultHotelId(userId) : null;
    const filter = hotelId ? eq(roomTypes.hotelId, hotelId) : sql`true`;
    return this.db
      .select()
      .from(roomTypes)
      .where(filter)
      .orderBy(desc(roomTypes.updatedAt));
  }

  async getRoomType(userId: string, id: string) {
    const hotelId = await this.hotelContext.getDefaultHotelId(userId);
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
    const hotelId = await this.hotelContext.getRequiredHotelId(userId);
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

    await this.activity.writeActivity(
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
    const hotelId = await this.hotelContext.getRequiredHotelId(userId);
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

    await this.activity.writeActivity(
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
    const hotelId = await this.hotelContext.getRequiredHotelId(userId);
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

}
