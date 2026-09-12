import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDatabase } from '../database/database.decorator';
import type { Database } from '../database/database.types';
import { invoices } from '../database/schema';
import { eq } from 'drizzle-orm';
import { EmailService } from '../email/email.service';
import { ReceiptsService } from '../receipts/receipts.service';

@Injectable()
export class EmailDispatchService {
  constructor(
    @InjectDatabase() private readonly db: Database,
    private readonly emailService: EmailService,
    private readonly receiptsService: ReceiptsService,
  ) {}

  /** Build + send the branded receipt (with PDF attachment when possible). */
  async deliverInvoiceReceipt(userId: string, invoiceId: string, to?: string) {
    const context = await this.receiptsService.getReceiptContext(
      userId,
      invoiceId,
    );
    const rendered = this.receiptsService.renderReceipt(context);

    const finalTo = to ?? context.guest?.email;
    if (!finalTo) {
      throw new BadRequestException(
        'Guest has no email address on file. Specify a recipient email instead.',
      );
    }

    let attachments;
    try {
      const pdf = await this.receiptsService.getReceiptPdf(context);
      attachments = [
        {
          filename: pdf.filename,
          content: pdf.pdf,
          contentType: 'application/pdf',
        },
      ];
    } catch {
      // PDF generation failed — send HTML-only so email still goes out.
    }

    const result = await this.emailService.send({
      to: finalTo,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
      attachments,
      sender: context.sender,
      replyTo: context.replyTo || undefined,
    });

    return { result, to: finalTo };
  }

  /** Best-effort, fire-and-forget receipt email after payment/checkout. */
  async dispatchInvoiceReceipt(userId: string, invoiceId: string) {
    try {
      const delivery = await this.deliverInvoiceReceipt(userId, invoiceId);
      if (delivery.result.ok && !delivery.result.skipped) {
        await this.db
          .update(invoices)
          .set({ receiptEmailSentAt: new Date() })
          .where(eq(invoices.id, invoiceId));
      }
    } catch {
      // Email delivery must never break the payment flow.
    }
  }
}