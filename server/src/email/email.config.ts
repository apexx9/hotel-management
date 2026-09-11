import { Injectable } from '@nestjs/common';

/**
 * Centralized email configuration loaded from environment variables.
 *
 * | Variable       | Required | Default               | Description                          |
 * |----------------|----------|------------------------------|--------------------------------------|
 * | BREVO_API_KEY  | yes      | — (email disabled)          | Brevo API key                       |
 * | SMTP_FROM      | no       | no-reply@example.com        | Sender email address (must be a verified Brevo sender) |
 * | SMTP_FROM_NAME | no       | Hotel Management            | Display name shown as sender         |
 * | FRONTEND_URL   | no       | localhost:3000 in dev,      | Public frontend origin (email links) |
 * |                |          | the Vercel app in production|                                      |
 *
 * When `BREVO_API_KEY` is not set the application runs fully without email
 * delivery: every send is short-circuited and reported as `skipped`. This
 * keeps development and offline deployments working end to end.
 *
 * Brevo does NOT require a custom sending domain: you create and verify a
 * sender email address (via an email confirmation code) in Settings >
 * Senders & IP. Without domain authentication Brevo rewrites the From
 * address to @brevosend.com to protect deliverability.
 */
@Injectable()
export class EmailConfig {
  readonly enabled: boolean;
  readonly brevoApiKey?: string;
  readonly fromEmail: string;
  readonly fromName: string;
  readonly frontendUrl: string;

  constructor() {
    this.brevoApiKey = process.env.BREVO_API_KEY?.trim() || undefined;
    this.enabled = Boolean(this.brevoApiKey);
    this.fromEmail = process.env.SMTP_FROM?.trim() || 'no-reply@example.com';
    this.fromName = process.env.SMTP_FROM_NAME?.trim() || 'Hotel Management';
    this.frontendUrl =
      process.env.FRONTEND_URL?.trim() ||
      (process.env.NODE_ENV === 'production'
        ? 'https://hotel-management-orcin-eight.vercel.app'
        : 'http://localhost:3000');
  }
}
