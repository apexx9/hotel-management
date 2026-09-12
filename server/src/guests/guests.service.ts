import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDatabase } from '../database/database.decorator';
import type { Database } from '../database/database.types';
import { guests, invoices, stays } from '../database/schema';
import { and, desc, eq, or, sql } from 'drizzle-orm';
import { CreateGuestDto, UpdateGuestDto } from '../shared/dto';
import { HotelContextService } from '../common/hotel-context.service';
import { ActivityService } from '../common/activity.service';

@Injectable()
export class GuestsService {
  constructor(
    @InjectDatabase() private readonly db: Database,
    private readonly hotelContext: HotelContextService,
    private readonly activity: ActivityService,
  ) {}

  async listGuests(userId: string, query?: string) {
    const hotelId = await this.hotelContext.getDefaultHotelId(userId);
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
    const hotelId = await this.hotelContext.getDefaultHotelId(userId);
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
    const hotelId = await this.hotelContext.getRequiredHotelId(userId);
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

    await this.activity.writeActivity(
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
    const hotelId = await this.hotelContext.getRequiredHotelId(userId);
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

    await this.activity.writeActivity(
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
}