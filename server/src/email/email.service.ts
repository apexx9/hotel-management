import { Injectable, Logger } from '@nestjs/common';
import { BrevoClient } from '@getbrevo/brevo';
import { EmailConfig } from './email.config';
import {
  EmailContent,
  renderBookingCancellation,
  renderBookingConfirmation,
  renderPasswordReset,
  renderStaffInvitation,
  renderVerificationCode,
  ReservationEmailData,
} from './email.templates';

export type EmailRecipient = string;
export type Branding = {
  hotelName?: string | null;
  hotelAddress?: string | null;
  hotelPhone?: string | null;
  hotelEmail?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
};

export type EmailAttachment = {
  filename: string;
  content: Buffer | string;
  contentType?: string;
};

/**
 * Sender customization for a single message. Every hotel sends through the
 * platform's single Brevo client (configured via environment variables)
 * from the platform's verified sender address (SMTP_FROM). Hotels only
 * customize the display name shown before that address. Replies go to the
 * hotel via `replyTo`.
 */
export type SenderOverride = {
  name?: string | null;
};

export type SendEmailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: EmailAttachment[];
  /** Address replies go to (the hotel's own email). */
  replyTo?: string;
  /** Display name paired with the platform's From address. */
  sender?: SenderOverride;
};

export type EmailSendResult = {
  ok: boolean;
  skipped?: boolean;
  messageId?: string;
  error?: string;
};

/**
 * Central email service backed by ONE platform Brevo client (configured via
 * environment variables). Every send is non-blocking from the caller's
 * perspective (it never throws): failures are captured in the returned
 * result so business transactions are never rolled back because email
 * delivery failed. When no Brevo API key is configured, sends are
 * short-circuited and reported as `{ ok: true, skipped: true }` so callers
 * treat the happy path identically in development.
 *
 * SaaS model: emails always send From the platform's verified sender
 * (SMTP_FROM). Hotels customize the display name, the Reply-To address,
 * plus the logo and colors used in the message body. Providers are NOT
 * configurable per hotel.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger('EmailService');
  private brevo?: BrevoClient;

  constructor(private readonly config: EmailConfig) {}

  private getClient(): BrevoClient {
    if (!this.brevo) {
      this.brevo = new BrevoClient({
        apiKey: this.config.brevoApiKey!,
        timeoutInSeconds: 30,
        maxRetries: 2,
      });
    }
    return this.brevo;
  }

  /** From is always the platform sender; the name (hotel) may vary. */
  private buildSender(sender?: SenderOverride): {
    name: string;
    email: string;
  } {
    const name = sender?.name?.trim() || this.config.fromName;
    return { name, email: this.config.fromEmail };
  }

  /** Low-level send. Never throws; failures are returned in the result. */
  async send(options: SendEmailOptions): Promise<EmailSendResult> {
    try {
      if (!this.config.brevoApiKey) {
        this.logger.log(
          `Brevo not configured — skipping mail to ${options.to} (${options.subject})`,
        );
        return { ok: true, skipped: true };
      }

      const result =
        await this.getClient().transactionalEmails.sendTransacEmail({
          sender: this.buildSender(options.sender),
          to: [{ email: options.to }],
          replyTo: options.replyTo ? { email: options.replyTo } : undefined,
          subject: options.subject,
          htmlContent: options.html,
          textContent: options.text,
          attachment: options.attachments?.map((a) => ({
            name: a.filename,
            content:
              typeof a.content === 'string'
                ? a.content
                : a.content.toString('base64'),
          })),
        });

      this.logger.log(
        `Sent mail to ${options.to}: ${result.messageId ?? '—'} (${options.subject})`,
      );
      return { ok: true, messageId: result.messageId };
    } catch (err) {
      this.logger.error(
        `Failed to send mail to ${options.to} (${options.subject})`,
        err instanceof Error ? err.stack : String(err),
      );
      const message =
        err instanceof Error ? err.message : 'Unknown email error';
      return { ok: false, error: message };
    }
  }

  private deliver(
    content: EmailContent,
    to: string,
    sender?: SenderOverride,
    replyTo?: string | null,
  ): Promise<EmailSendResult> {
    return this.send({
      to,
      subject: content.subject,
      text: content.text,
      html: content.html,
      sender,
      replyTo: replyTo || undefined,
    });
  }

  async sendVerification(
    to: string,
    code: string,
    branding: Branding = {},
    sender?: SenderOverride,
    replyTo?: string | null,
  ): Promise<EmailSendResult> {
    return this.deliver(
      renderVerificationCode(branding, code),
      to,
      sender,
      replyTo,
    );
  }

  async sendPasswordReset(
    to: string,
    code: string,
    branding: Branding = {},
    sender?: SenderOverride,
    replyTo?: string | null,
  ): Promise<EmailSendResult> {
    return this.deliver(
      renderPasswordReset(branding, code),
      to,
      sender,
      replyTo,
    );
  }

  async sendStaffInvitation(
    to: string,
    data: {
      inviteUrl: string;
      role: string;
      inviterName?: string | null;
      expiresAt?: string | Date | null;
    },
    branding: Branding = {},
    sender?: SenderOverride,
    replyTo?: string | null,
  ): Promise<EmailSendResult> {
    return this.deliver(
      renderStaffInvitation(branding, data),
      to,
      sender,
      replyTo,
    );
  }

  async sendBookingConfirmation(
    to: string,
    data: ReservationEmailData,
    branding: Branding = {},
    sender?: SenderOverride,
    replyTo?: string | null,
  ): Promise<EmailSendResult> {
    return this.deliver(
      renderBookingConfirmation(branding, data),
      to,
      sender,
      replyTo,
    );
  }

  async sendBookingCancellation(
    to: string,
    data: {
      guestName?: string | null;
      reference: string;
      total: string;
      currency: string;
    },
    branding: Branding = {},
    sender?: SenderOverride,
    replyTo?: string | null,
  ): Promise<EmailSendResult> {
    return this.deliver(
      renderBookingCancellation(branding, data),
      to,
      sender,
      replyTo,
    );
  }
}
