import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private logger = new Logger('MailService');

  constructor() {
    // configure transporter from env
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {
    try {
      if (!process.env.SMTP_HOST) {
        this.logger.log(`SMTP not configured — skipping sending mail to ${to}`);
        this.logger.debug(`Mail content: ${subject}\n${text}`);
        return { ok: true, skipped: true };
      }

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@example.com',
        to,
        subject,
        text,
        html,
      });

      this.logger.log(`Sent mail to ${to}: ${info.messageId}`);
      return { ok: true, info };
    } catch (err) {
      this.logger.error('Mail send error', err as any);
      return { ok: false, error: err };
    }
  }
}
