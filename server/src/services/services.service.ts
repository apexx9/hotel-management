import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDatabase } from '../database/database.decorator';
import type { Database } from '../database/database.types';
import { hotels, invoices, invoiceItems, services, serviceCharges, stays, users } from '../database/schema';
import { and, desc, eq, sql } from 'drizzle-orm';
import { CreateServiceChargeDto, CreateServiceDto, UpdateServiceDto } from '../shared/dto';
import { formatReference, money, roundMoney } from '../common/pricing.util';
import { HotelContextService } from '../common/hotel-context.service';
import { ActivityService } from '../common/activity.service';


@Injectable()
export class ServicesService {
  constructor(
    @InjectDatabase() private readonly db: Database,
    private readonly hotelContext: HotelContextService,
    private readonly activity: ActivityService,
  ) {}

  // ==========================================
  // SERVICES & SERVICE CHARGES
  // ==========================================
  async listServices(userId?: string) {
    const hotelId = userId ? await this.hotelContext.getDefaultHotelId(userId) : null;
    const filter = hotelId ? eq(services.hotelId, hotelId) : sql`true`;
    return this.db
      .select()
      .from(services)
      .where(filter)
      .orderBy(desc(services.createdAt));
  }

  async getService(userId: string, id: string) {
    const hotelId = await this.hotelContext.getDefaultHotelId(userId);
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
    const hotelId = await this.hotelContext.getRequiredHotelId(userId);
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

    await this.activity.writeActivity(
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
    const hotelId = await this.hotelContext.getRequiredHotelId(userId);
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

    await this.activity.writeActivity(
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
    const hotelId = await this.hotelContext.getRequiredHotelId(userId);
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
    const hotelId = await this.hotelContext.getDefaultHotelId(userId);
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
      const user = await this.hotelContext.getCurrentUser(userId);
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

      await this.activity.writeActivity(
        stay.hotelId,
        user.id,
        user.fullName,
        'service charge added',
        `${service.name} (GHS ${total}) added to stay ${stay.reference}.`,
        'stay',
        stay.id,
      );

      await this.activity.writeNotification(
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

}
