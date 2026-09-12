import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDatabase } from '../database/database.decorator';
import type { Database } from '../database/database.types';
import {
  hotels,
  invoices,
  invoiceItems,
  payments,
  stays,
  users,
} from '../database/schema';
import { and, desc, eq, sql } from 'drizzle-orm';
import { CreatePaymentDto, RefundPaymentDto } from '../shared/dto';
import { formatReference, money, roundMoney } from '../common/pricing.util';
import { HotelContextService } from '../common/hotel-context.service';
import { ActivityService } from '../common/activity.service';
import { EmailDispatchService } from '../common/email-dispatch.service';
import { ReceiptsService } from '../receipts/receipts.service';

@Injectable()
export class FinanceService {
  constructor(
    @InjectDatabase() private readonly db: Database,
    private readonly hotelContext: HotelContextService,
    private readonly activity: ActivityService,
    private readonly emailDispatch: EmailDispatchService,
    private readonly receiptsService: ReceiptsService,
  ) {}

  // INVOICES & PAYMENTS
  // ==========================================
  async listInvoices(userId: string, stayId?: string) {
    const hotelId = await this.hotelContext.getDefaultHotelId(userId);
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
    const hotelId = await this.hotelContext.getDefaultHotelId(userId);
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
    const hotelId = await this.hotelContext.getDefaultHotelId(userId);
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
    const hotelId = await this.hotelContext.getDefaultHotelId(userId);
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

      await this.activity.writeActivity(
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
    void this.emailDispatch.dispatchInvoiceReceipt(userId, result.invoiceId);

    return result;
  }

  async recordRefund(userId: string, dto: RefundPaymentDto) {
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

      const [invoice] = await tx
        .select()
        .from(invoices)
        .where(
          and(
            eq(invoices.stayId, stay.id),
            eq(invoices.hotelId, user.hotelId ?? ''),
          ),
        )
        .limit(1);
      if (!invoice) throw new NotFoundException('Invoice not found');

      if (dto.amount <= 0) {
        throw new BadRequestException(
          'Refund amount must be greater than zero',
        );
      }

      const [payment] = await tx
        .insert(payments)
        .values({
          hotelId: stay.hotelId,
          reference: formatReference('REF'),
          guestId: stay.guestId,
          stayId: stay.id,
          invoiceId: invoice.id,
          staffId: user.id,
          method: dto.method,
          amount: String(-dto.amount),
          status: 'refunded',
          notes: dto.notes,
        })
        .returning();

      const newAmountPaid = roundMoney(
        Math.max(0, money(invoice.amountPaid) - dto.amount),
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

      const newStayPaid = roundMoney(
        Math.max(0, money(stay.amountPaid) - dto.amount),
      );

      await tx
        .update(stays)
        .set({
          amountPaid: String(newStayPaid),
          outstandingBalance: String(
            roundMoney(Math.max(0, money(stay.total) - newStayPaid)),
          ),
          updatedAt: new Date(),
        })
        .where(eq(stays.id, stay.id));

      await this.activity.writeActivity(
        stay.hotelId,
        user.id,
        user.fullName,
        'refund recorded',
        `Refund of ${dto.amount} recorded for stay ${stay.reference}.`,
        'payment',
        payment.id,
      );

      return payment;
    });
  }

  async reversePayment(userId: string, id: string) {
    return this.db.transaction(async (tx) => {
      const user = await this.hotelContext.getCurrentUser(userId);
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

      await this.activity.writeActivity(
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
    const user = await this.hotelContext.getCurrentUser(userId);
    const hotelId = user.hotelId;
    if (!hotelId) throw new BadRequestException('Hotel context not found');

    const [invoice] = await this.db
      .select({ id: invoices.id, reference: invoices.reference })
      .from(invoices)
      .where(and(eq(invoices.hotelId, hotelId), eq(invoices.id, invoiceId)))
      .limit(1);
    if (!invoice) throw new NotFoundException('Invoice not found');

    const delivery = await this.emailDispatch.deliverInvoiceReceipt(userId, invoiceId, to);

    if (delivery.result.ok && !delivery.result.skipped) {
      await this.db
        .update(invoices)
        .set({ receiptEmailSentAt: new Date() })
        .where(eq(invoices.id, invoiceId));
    }

    await this.activity.writeActivity(
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
}
