# Receipt & Email Notes

## Overview

- The server generates branded HTML receipts and converts them to PDF using Puppeteer (`ReceiptsService`).
- Emails are sent via Brevo through the centralized `EmailModule` (`EmailService`). If `BREVO_API_KEY` is not set, sending is skipped and returns `{ ok: true, skipped: true }` — email never blocks or rolls back a business operation.
- Guests/rooms/receipt/email data is always loaded server-side from the database (backend is the source of truth), so emails and receipts can never show a wrong guest name or email.

## Required environment variables

| Variable         | Purpose                                                            |
| ---------------- | ------------------------------------------------------------------ |
| `BREVO_API_KEY`  | Brevo API key. Unset = email disabled (skipped)                    |
| `SMTP_FROM`      | **Verified Brevo sender** (default `no-reply@example.com`)          |
| `SMTP_FROM_NAME` | Platform-default display sender name (default `Hotel Management`)   |
| `FRONTEND_URL`   | Public client origin used for links inside emails                  |

## One platform email service (SaaS)

All hotels send through a **single shared Brevo client** configured
with the environment variables above — hotels cannot configure their own
email provider.

**SaaS sender model (Reply-To):** every email is sent From the platform's
verified Brevo sender (`SMTP_FROM`) so SPF/DKIM/DMARC pass for all
hotels. Per-hotel customization (Settings → Hotel → **Email & Branding**,
stored on `hotel_settings`, migration `0006_email_branding_settings.sql`)
controls:

- `email_from` — the **Reply-To** address: where replies land (the hotel's
  mailbox). Falls back to the hotel contact email. Never used as the From
  header (an unverified customer domain would fail DMARC).
- `email_from_name` — the display name shown before the platform address
  (defaults to the hotel name), e.g. `"The Grand Hotel"
  <notifications@yourplatform.com>`.
- `logo_url` — a hosted logo shown at the top of receipts and in the email
  header.
- `primary_color`, `accent_color` — brand colors used by email templates and
  the receipt document (header banner, buttons, accents).

A **Send Test Email** button (`POST /settings/test-email`, requires
`settings.update`) verifies the platform SMTP + the hotel's branding from
the UI (service reports `skipped` when `BREVO_API_KEY` is not configured).
Both auth emails and operations emails resolve the hotel's sender/branding.

## Email flows (server)

- **Automatic (fire-and-forget, after the DB transaction commits):**
  - Booking created → booking confirmation to the authoritative guest email (`stays.confirmationEmailSentAt`)
  - Booking cancelled → cancellation notice
  - Payment recorded → invoice/receipt emailed (`invoices.receiptEmailSentAt`)
  - Checkout completed → receipt emailed (`invoices.receiptEmailSentAt`)
- **Manual (await result, `{ ok, skipped, info, to }`):**
  - `POST /invoices/:id/send-receipt` — re-send a receipt
  - `POST /bookings/:id/send-confirmation` — (re)send a reservation confirmation
- Auth emails (verification code, password reset, staff invitation) also go through `EmailService`.

## Endpoints & RBAC

- `GET  /invoices/:id/receipt`            — branded HTML receipt — requires `invoices.view`
- `GET  /invoices/:id/receipt.pdf`        — PDF receipt — requires `invoices.view`
- `POST /invoices/:id/send-receipt`       — email receipt — requires `invoices.send`
- `POST /bookings/:id/send-confirmation`  — email confirmation — requires `reservations.update`

All queries are scoped to the caller's hotel via the `users.hotelId` chain.

## Location of implementation

- Email config/templates/service/module: `server/src/email/`
- Branded receipt renderer + PDF: `server/src/receipts/`
- Orchestration (auto-send + manual endpoints): `server/src/operations/operations.service.ts`
- Schema columns: `stays.confirmation_email_sent_at`, `invoices.receipt_email_sent_at`

## Database migration

- `server/drizzle/0004_email_tracking.sql` adds the two tracking columns (idempotent `IF NOT EXISTS`). The columns are already applied to the database.
- Note: `rooms.is_active` is NOT part of this migration — it already exists in the DB.

## Puppeteer notes

- `ReceiptsService` launches a shared Chromium instance lazily with `--no-sandbox --disable-setuid-sandbox` for container compatibility.
- In restricted environments (Alpine musl, serverless) a custom Chromium build or additional system libraries may be required.

## Deployment guidance

- Ensure enough memory + Chromium system libraries (`libnss3`, `libatk1.0-0`, `libgtk-3-0`, `libx11-xcb1`, etc.). Docker base `node:18-bullseye-slim` with dependencies installed works.
- Configure the Brevo API key before relying on email delivery.

## Optional improvements

- Replace fire-and-forget sends with a background email queue (BullMQ/Redis) for retries and to avoid blocking request handlers during PDF generation.
- Add `?download=1` to toggle `Content-Disposition: attachment` vs `inline` for the PDF endpoint.