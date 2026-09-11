import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { OnModuleDestroy } from '@nestjs/common';
import { InjectDatabase } from '../database/database.decorator';
import type { Database } from '../database/database.types';
import {
  guests,
  hotelSettings,
  invoices,
  invoiceItems,
  payments,
  rooms,
  roomTypes,
  stays,
  users,
} from '../database/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import type { SenderOverride } from '../email/email.service';

export type Branding = {
  hotelName?: string | null;
  hotelAddress?: string | null;
  hotelPhone?: string | null;
  hotelEmail?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
};

export type ReceiptContext = {
  invoice: Record<string, any>;
  items: Record<string, any>[];
  payments: Record<string, any>[];
  stay: Record<string, any> | null;
  guest: Record<string, any>;
  branding: Branding;
  currency: string;
  sender: SenderOverride;
  replyTo: string | null;
};

export type RenderedReceipt = {
  html: string;
  subject: string;
  text: string;
  filename: string;
};

const money = (value: unknown): number => Number(value ?? 0);

const escapeHtml = (value: unknown): string =>
  String((value as string | number | boolean | null | undefined) ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const formatMoney = (value: unknown, currency: string): string => {
  const formatted = Number(value ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency} ${formatted}`;
};

const formatDate = (value: unknown): string => {
  if (!value) return '—';
  const d = new Date(value as string | number | Date);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatMethod = (method: string): string =>
  method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Renders the single, authoritative, branded receipt document for an
 * invoice. The exact same HTML is used for on-screen preview, printing,
 * PDF export and the email body, which guarantees the guest always sees
 * the same document regardless of channel.
 *
 * Every query is scoped to a hotel: an invoice id can never leak data
 * across hotels, and guest details always come from the database record
 * (`stays.guestId → guests`), never from stale frontend state.
 */
@Injectable()
export class ReceiptsService implements OnModuleDestroy {
  private readonly logger = new Logger('ReceiptsService');
  private browser?: puppeteer.Browser;

  constructor(@InjectDatabase() private readonly db: Database) {}

  /** Load the full context for an invoice, hotel-scoped and authoritative. */
  async getReceiptContext(
    userId: string,
    invoiceId: string,
  ): Promise<ReceiptContext> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const hotelId = user?.hotelId ?? null;
    if (!hotelId) throw new NotFoundException('Hotel context not found');

    const [invoice] = await this.db
      .select()
      .from(invoices)
      .where(and(eq(invoices.hotelId, hotelId), eq(invoices.id, invoiceId)))
      .limit(1);
    if (!invoice) throw new NotFoundException('Invoice not found');

    const items = await this.db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoice.id))
      .orderBy(asc(invoiceItems.createdAt));

    const paymentRows = await this.db
      .select()
      .from(payments)
      .where(
        and(eq(payments.invoiceId, invoice.id), eq(payments.hotelId, hotelId)),
      )
      .orderBy(desc(payments.createdAt));

    const [guest] = await this.db
      .select()
      .from(guests)
      .where(and(eq(guests.id, invoice.guestId), eq(guests.hotelId, hotelId)))
      .limit(1);

    const [stay] = await this.db
      .select()
      .from(stays)
      .where(eq(stays.id, invoice.stayId))
      .limit(1);

    let room: Record<string, any> | undefined;
    let roomType: Record<string, any> | undefined;
    if (stay) {
      const [r] = await this.db
        .select()
        .from(rooms)
        .where(eq(rooms.id, stay.roomId))
        .limit(1);
      room = r;
      if (r) {
        const [rt] = await this.db
          .select()
          .from(roomTypes)
          .where(eq(roomTypes.id, r.roomTypeId))
          .limit(1);
        roomType = rt;
      }
    }

    const [settings] = await this.db
      .select()
      .from(hotelSettings)
      .where(eq(hotelSettings.hotelId, hotelId))
      .limit(1);

    const currency = settings?.currency || 'GHS';

    const branding: Branding = {
      hotelName: settings?.name || null,
      hotelAddress: settings?.address || null,
      hotelPhone: settings?.phone || null,
      hotelEmail: settings?.email || null,
      logoUrl: settings?.logoUrl || null,
      primaryColor: settings?.primaryColor || null,
      accentColor: settings?.accentColor || null,
    };

    const sender: SenderOverride = {
      name: settings?.emailFromName || settings?.name || null,
    };

    const replyTo: string | null =
      settings?.emailFrom || settings?.email || null;

    return {
      invoice,
      items,
      payments: paymentRows,
      stay: stay
        ? {
            ...stay,
            roomNumber: typeof room?.number === 'string' ? room.number : null,
            roomTypeName:
              typeof roomType?.name === 'string' ? roomType.name : null,
          }
        : null,
      guest: guest ?? { id: invoice.guestId, firstName: '', lastName: '' },
      branding,
      currency,
      sender,
      replyTo,
    };
  }

  /** Produce subject/text/html for the receipt document. */
  renderReceipt(context: ReceiptContext): RenderedReceipt {
    const { invoice, items, payments, stay, guest, branding, currency } =
      context;

    const subtotal = money(invoice.subtotal);
    const discount = money(invoice.discount);
    const taxes = money(invoice.taxes);
    const total = money(invoice.total);
    const amountPaid = money(invoice.amountPaid);
    const outstanding = money(invoice.outstanding);

    const guestName =
      [guest.firstName, guest.lastName].filter(Boolean).join(' ') || 'Guest';

    const statusLabel = String(invoice.status ?? '').replace(/_/g, ' ');

    const itemsHtml =
      items.length > 0
        ? items
            .map((it) => {
              const qty = Number(it.quantity ?? 1);
              return `
                <tr>
                  <td style="padding:10px 12px; border-bottom:1px solid #f3f4f6; color:#111827; font-size:14px;">${escapeHtml(
                    it.description,
                  )}</td>
                  <td style="padding:10px 12px; border-bottom:1px solid #f3f4f6; color:#4b5563; font-size:13px; text-align:center;">${qty}</td>
                  <td style="padding:10px 12px; border-bottom:1px solid #f3f4f6; color:#4b5563; font-size:13px; text-align:right;">${formatMoney(
                    it.unitPrice,
                    currency,
                  )}</td>
                  <td style="padding:10px 12px; border-bottom:1px solid #f3f4f6; color:#111827; font-size:14px; text-align:right; font-weight:600;">${formatMoney(
                    it.total,
                    currency,
                  )}</td>
                </tr>`;
            })
            .join('')
        : `<tr><td colspan="4" style="padding:12px; color:#9ca3af; font-size:13px;">No itemized charges.</td></tr>`;

    const paymentsHtml =
      payments.length > 0
        ? payments
            .map(
              (p) => `
                <tr>
                  <td style="padding:8px 12px; border-bottom:1px solid #f9fafb; color:#111827; font-size:13px;">${formatMethod(
                    p.method as string,
                  )}</td>
                  <td style="padding:8px 12px; border-bottom:1px solid #f9fafb; color:#4b5563; font-size:13px;">${escapeHtml(
                    p.reference,
                  )}</td>
                  <td style="padding:8px 12px; border-bottom:1px solid #f9fafb; color:#4b5563; font-size:12px;">${formatDate(
                    p.createdAt,
                  )}</td>
                  <td style="padding:8px 12px; border-bottom:1px solid #f9fafb; color:#111827; font-size:13px; text-align:right; font-weight:600;">${formatMoney(
                    p.amount,
                    currency,
                  )}</td>
                </tr>`,
            )
            .join('')
        : '<tr><td style="padding:12px; color:#9ca3af; font-size:13px;">No payments recorded yet.</td></tr>';

    const receiptHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Receipt ${escapeHtml(invoice.reference)}</title>
<style>
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  * { box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background: #e5e7eb; color: #111827; }
  .sheet { background: #ffffff; max-width: 760px; margin: 24px auto; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
  @media print { body { background: #ffffff; } .sheet { margin: 0; max-width: none; border-radius: 0; box-shadow: none; } }
</style>
</head>
<body>
  <div class="sheet" style="background:#fff; max-width:760px; margin:24px auto; border-radius:14px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.08);">
    <div style="background:${escapeHtml(branding.primaryColor || '#1900ff')}; color:#fff; padding:26px 32px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px; background:${escapeHtml(branding.primaryColor || '#1900ff')}; color:#fff;">
        <div style="background:${escapeHtml(branding.primaryColor || '#1900ff')}; color:#fff;">
          ${branding.logoUrl ? `<div style="margin-bottom:14px;"><img src="${escapeHtml(branding.logoUrl)}" alt="${escapeHtml(branding.hotelName || '')} logo" style="max-height:56px; max-width:260px; height:auto;" /></div>` : ''}
          <div style="font-size:22px; font-weight:800; letter-spacing:0.4px;">${escapeHtml(
            branding.hotelName || 'Hotel',
          )}</div>
          ${branding.hotelAddress ? `<div style="margin-top:4px; font-size:13px; opacity:0.85;">${escapeHtml(branding.hotelAddress)}</div>` : ''}
          ${
            branding.hotelPhone || branding.hotelEmail
              ? `<div style="margin-top:2px; font-size:13px; opacity:0.85;">${escapeHtml(
                  [branding.hotelPhone, branding.hotelEmail]
                    .filter(Boolean)
                    .join(' · '),
                )}</div>`
              : ''
          }
        </div>
        <div style="text-align:right; background:${escapeHtml(branding.primaryColor || '#1900ff')}; color:#fff;">
          <div style="font-size:16px; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Receipt</div>
          <div style="margin-top:4px; font-size:14px; opacity:0.9;">${escapeHtml(invoice.reference)}</div>
          <div style="margin-top:6px; display:inline-block; background:rgba(255,255,255,0.2); border-radius:999px; padding:3px 12px; font-size:12px; text-transform:capitalize;">${escapeHtml(
            statusLabel,
          )}</div>
        </div>
      </div>
    </div>

    <div style="padding:28px 32px;">
      <div style="display:flex; flex-wrap:wrap; gap:16px; margin-bottom:22px; background:#f9fafb; border:1px solid #f3f4f6; border-radius:10px; padding:16px 18px;">
        <div style="flex:1; min-width:220px; background:#f9fafb;">
          <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:#6b7280; margin-bottom:4px;">Billed to</div>
          <div style="font-size:15px; font-weight:600; color:#111827;">${escapeHtml(
            guestName,
          )}</div>
          ${guest.phone ? `<div style="font-size:13px; color:#4b5563; margin-top:2px;">${escapeHtml(guest.phone)}</div>` : ''}
          ${guest.email ? `<div style="font-size:13px; color:#4b5563;">${escapeHtml(guest.email)}</div>` : ''}
        </div>
        <div style="flex:1; min-width:220px; background:#f9fafb;">
          <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:#6b7280; margin-bottom:4px;">Stay</div>
          ${
            stay
              ? `
            <div style="font-size:13px; color:#4b5563;">Room ${escapeHtml(stay.roomNumber || '—')}${stay.roomTypeName ? ` · ${escapeHtml(stay.roomTypeName)}` : ''}</div>
            <div style="font-size:13px; color:#4b5563;">Check-in ${escapeHtml(stay.expectedCheckInAt ? formatDate(stay.expectedCheckInAt) : '—')}</div>
            <div style="font-size:13px; color:#4b5563;">Check-out ${escapeHtml(stay.expectedCheckoutAt ? formatDate(stay.expectedCheckoutAt) : '—')}</div>
          `
              : '<div style="font-size:13px; color:#4b5563;">—</div>'
          }
        </div>
        <div style="flex:1; min-width:220px; background:#f9fafb;">
          <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:#6b7280; margin-bottom:4px;">Issued</div>
          <div style="font-size:13px; color:#4b5563;">${formatDate(invoice.issuedAt ?? invoice.createdAt)}</div>
        </div>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-bottom:20px;">
        <thead>
          <tr>
            <th style="text-align:left; padding:10px 12px; background:#f9fafb; color:#6b7280; font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">Description</th>
            <th style="text-align:center; padding:10px 12px; background:#f9fafb; color:#6b7280; font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">Qty</th>
            <th style="text-align:right; padding:10px 12px; background:#f9fafb; color:#6b7280; font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">Unit price</th>
            <th style="text-align:right; padding:10px 12px; background:#f9fafb; color:#6b7280; font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <table align="right" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-bottom:24px; min-width:280px;">
        <tr>
          <td style="padding:6px 10px; color:#6b7280; font-size:13px;">Subtotal</td>
          <td style="padding:6px 10px; color:#111827; font-size:13px; text-align:right;">${formatMoney(
            subtotal,
            currency,
          )}</td>
        </tr>
        ${
          discount !== 0
            ? `<tr>
          <td style="padding:6px 10px; color:#6b7280; font-size:13px;">Discount</td>
          <td style="padding:6px 10px; color:#16a34a; font-size:13px; text-align:right;">− ${formatMoney(discount, currency)}</td>
        </tr>`
            : ''
        }
        ${
          taxes !== 0
            ? `<tr>
          <td style="padding:6px 10px; color:#6b7280; font-size:13px;">Taxes</td>
          <td style="padding:6px 10px; color:#111827; font-size:13px; text-align:right;">${formatMoney(taxes, currency)}</td>
        </tr>`
            : ''
        }
        <tr>
          <td style="padding:10px; border-top:2px solid #111827; font-size:15px; font-weight:700;">Total</td>
          <td style="padding:10px; border-top:2px solid #111827; text-align:right; font-size:15px; font-weight:700;">${formatMoney(
            total,
            currency,
          )}</td>
        </tr>
        <tr>
          <td style="padding:6px 10px; color:#16a34a; font-size:13px;">Paid</td>
          <td style="padding:6px 10px; color:#16a34a; font-size:13px; text-align:right; font-weight:600;">− ${formatMoney(
            amountPaid,
            currency,
          )}</td>
        </tr>
        <tr>
          <td style="padding:6px 10px; color:${outstanding > 0 ? '#dc2626' : '#16a34a'}; font-size:14px; font-weight:700;">Due</td>
          <td style="padding:6px 10px; color:${outstanding > 0 ? '#dc2626' : '#16a34a'}; font-size:14px; text-align:right; font-weight:700;">${formatMoney(
            outstanding,
            currency,
          )}</td>
        </tr>
      </table>

      <h4 style="margin:26px 0 12px; font-size:14px; font-weight:700; color:#111827;">Payments</h4>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-bottom:12px;">
        <thead>
          <tr>
            <th style="text-align:left; padding:8px 12px; background:#f9fafb; color:#6b7280; font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">Method</th>
            <th style="text-align:left; padding:8px 12px; background:#f9fafb; color:#6b7280; font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">Reference</th>
            <th style="text-align:left; padding:8px 12px; background:#f9fafb; color:#6b7280; font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">Date</th>
            <th style="text-align:right; padding:8px 12px; background:#f9fafb; color:#6b7280; font-size:11px; text-transform:uppercase; letter-spacing:0.8px;">Amount</th>
          </tr>
        </thead>
        <tbody>${paymentsHtml}</tbody>
      </table>

      <div style="margin-top:26px; padding-top:18px; border-top:1px solid #e5e7eb; color:#9ca3af; font-size:12px; line-height:1.7;">
        Thank you for choosing ${escapeHtml(branding.hotelName || 'us')}.
        <div style="margin-top:2px;">This receipt is auto-generated. For questions please contact the hotel directly.</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    const subject = `Receipt ${invoice.reference}`;
    const text = `Receipt ${invoice.reference} — Total ${formatMoney(
      total,
      currency,
    )}, Paid ${formatMoney(amountPaid, currency)}, Due ${formatMoney(
      outstanding,
      currency,
    )}.`;
    const filename = `receipt-${invoice.reference || invoice.id}.pdf`;

    return { html: receiptHtml, subject, text, filename };
  }

  /** Render the receipt HTML to a PDF via Puppeteer. */
  async getReceiptPdf(
    context: ReceiptContext,
  ): Promise<{ pdf: Buffer; filename: string }> {
    const rendered = this.renderReceipt(context);
    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();
      try {
        await page.setContent(rendered.html, { waitUntil: 'networkidle0' });
        const pdf = await page.pdf({ format: 'A4', printBackground: true });
        return { pdf, filename: rendered.filename };
      } finally {
        await page.close();
      }
    } catch (err) {
      this.logger.error(
        `PDF generation failed for ${context.invoice.reference}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw err;
    }
  }

  private async getBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return this.browser;
  }

  async onModuleDestroy() {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch {
        // best-effort cleanup
      }
      this.browser = undefined;
    }
  }
}
