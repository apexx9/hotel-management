# Hotel Management System — Email, Receipt & Customer Communication Implementation Report

Date: 2026-09-11 · Scope: server (`~/.../hotel-management/server`) + client (`~/.../hotel-management/client`)

---

## 1. Overview & Scope

Delivered a production-quality email, receipt, and customer-communication system:

- A centralized **EmailModule** (config, templates, service, module) used by Auth and Operations.
- A single branded **ReceiptsService** document powering preview → print → PDF → email.
- **Non-blocking, authoritative-guest emails** on booking, cancellation, payment, and checkout, with email-status columns.
- **RBAC-guarded manual endpoints** for re-sending receipts and confirmations.
- Frontend UX: preview/print/download/email on invoices, email (re)send on reservations, accurate send/skipped/error toasts, email-status indicators.
- Environment-variable docs, favicon/branding metadata.
- Two live bug fixes: `/finance/reports` stuck loading and a 15s notifications timeout.

All guest data used for emails/receipts is read server-side from the database (the backend remains the source of truth) — the UI never supplies the guest name/email for rendering or delivery.

---

## 2. Root-Cause Analysis & Live Bug Fixes

### Bug 1 — `/finance/reports` stuck on loader
- **Root cause:** `fetchReport(range)` in the reports page never passed `showLoader` on the first fetch. A slow remote database plus the reports endpoint aggregating many tables meant the request took longer than the UI's loader convention, leaving the page on the loading skeleton with no data on arrival.
- **Fix:** `client/app/(dashboard)/finance/reports/page.tsx` — the initial `useEffect` now calls `fetchReport(range, true)` (loader shown until the first fetch settles), matching the pattern used by other pages.

### Bug 2 — Notifications requests timing out (15s)
- **Root cause:** the axios client in `client/actions/api.ts` used a 15s default timeout; against the slow remote database the notifications background poll frequently exceeded it, firing `TimeoutError` errors.
- **Fix:**
  - `client/actions/api.ts` — default timeout raised 15s → **30s**.
  - `client/services/notifications.service.ts` — `getNotifications` accepts `{ silent?: boolean }`; silent requests never throw (return empty on failure) so background polling can't spam console errors or toasts.
  - `client/components/dashboard/top-bar.tsx` — the background poll uses `getNotifications({ silent: true })`.
  - The settings page keeps its interactive (non-silent) notification behaviors.

---

## 3. Email Module (infrastructure)

New module `server/src/email/`:

- **`email.config.ts`** — `EmailConfig` reads and validates `SMTP_HOST`, `SMTP_PORT` (587), `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_FROM_NAME`, `FRONTEND_URL`. `enabled = Boolean(SMTP_HOST)`.
- **`email.service.ts`** — `EmailService` builds a lazy, pooled Nodemailer transporter (max 3 connections, connect/greeting/socket timeouts). `send()` never throws — it returns `{ ok, skipped?, messageId?, error? }`; `skipped: true` when SMTP is unset. Semantic senders: `sendVerification`, `sendPasswordReset`, `sendStaffInvitation`, `sendBookingConfirmation`, `sendBookingCancellation`.
- **`email.module.ts`** — providers/exports `EmailConfig` and `EmailService`.

Design rule honored: email failure **never** rolls back or throws the business operation — it is always best-effort (see §7).

---

## 4. Email Templates

`server/src/email/email.templates.ts` — pure functions returning full HTML with inline styles (no external CSS — safe in email clients):

- Shared branded `renderLayout` (hotel name, footer, `#1900ff` primary).
- `renderVerificationCode`, `renderPasswordReset`, `renderStaffInvitation` (uses `FRONTEND_URL`).
- `renderBookingConfirmation` (ReservationEmailData: stay reference, room/room type/number, check-in/out, nights, guests, rates, taxes, discount, **total**, outstanding, guest contact info) with `renderSummaryTable`.
- `renderBookingCancellation`.

---

## 5. Receipts Module (one document, many outputs)

New module `server/src/receipts/` (`receipts.module.ts`, `receipts.service.ts`):

- **`getReceiptContext(userId, invoiceId)`** — loads invoice + items + payments + stay + room (number/floor) + room type + guest + `hotel_settings` (name, address, phone, email, logo, currency, tax). Every query is hotel-scoped through `users.hotelId`.
- **`renderReceipt(context)`** — the single branded HTML receipt (logo/name header, guest + stay block, itemized table, discounts/taxes/payments, totals, payment summary), plus subject, plain-text body, and filename. One template ⇒ preview, print, PDF, and email all match.
- **`getReceiptPdf(context)`** — renders the same HTML to an A4 `printBackground` PDF via a shared lazy Puppeteer browser (`--no-sandbox --disable-setuid-sandbox`); the browser is closed on module destroy.

---

## 6. Server Wiring — Auth

- `auth.module.ts` removed the old `MailService`, now imports and re-exports `EmailModule`.
- `auth.service.ts` injects `EmailService` and uses it for:
  - registration verification code (`sendVerification(normalizedEmail, token)`),
  - resend verification (`requestVerification`),
  - password reset (`sendPasswordReset`).
- The old `server/src/auth/mail.service.ts` was **deleted** — a single SMTP path now exists.

---

## 7. Server Wiring — Operations (auto-send + manual)

`operations.service.ts` now injects `EmailService` + `ReceiptsService` and:

- Automatically, **after the DB transaction commits** (never inside it, never blocking/breaking the request):
  - `createBooking` → `dispatchBookingConfirmation` (updates `stays.confirmation_email_sent_at`)
  - `cancelBooking` → `dispatchBookingCancellation`
  - `recordPayment` → `dispatchInvoiceReceipt` (updates `invoices.receipt_email_sent_at`)
  - `checkOut` → `dispatchInvoiceReceipt`
  - `inviteStaff` → `sendStaffInvitation` with hotel branding
- Manual endpoints (await result → `{ ok, skipped, info, to }`):
  - `POST /invoices/:id/send-receipt` → `sendInvoiceReceipt` (writes an activity log entry on sent/skipped/failed; records `receipt_email_sent_at` on actual delivery).
  - `POST /bookings/:id/send-confirmation` → `sendReservationConfirmation` (records `confirmation_email_sent_at` on success).
- Helpers: `formatMoney`, `getHotelBranding`, `loadStayEmailContext`, `buildReservationEmailData`, `deliverInvoiceReceipt`. The guest's **authoritative** email always comes from the DB join (`guests.email`), never from frontend input.

---

## 8. Schema & Database Migration

- `server/src/database/schema/hms.schema.ts`: added `stays.confirmation_email_sent_at` and `invoices.receipt_email_sent_at` (nullable `timestamp with time zone`).
- `server/drizzle/0004_email_tracking.sql`: idempotent (`ADD COLUMN IF NOT EXISTS`) migration for the two columns; **already applied** to the live database (confirmed via `information_schema`).
- Note: `rooms.is_active` is intentionally **not** in this migration — verified present in the database already. (The on-disk `0004_room_is_active.sql` is untracked by the drizzle journal; schema/doc state is consistent.)

---

## 9. RBAC & Security

- `GET /invoices/:id/receipt` and `GET /invoices/:id/receipt.pdf` → `invoices.view` (added; previously unguarded at the policy level).
- `POST /invoices/:id/send-receipt` → `invoices.send` (RECEPTIONIST, ACCOUNTANT).
- `POST /bookings/:id/send-confirmation` → `reservations.update` (RECEPTIONIST).
- Every receipt/email flow resolves the target hotel from `users.hotelId` and filters all joins by it — a user can never read or email another hotel's receipts.
- Email secrets stay in server-side env vars only; `EmailService.send` never logs passwords or message content.

---

## 10. Frontend Integration

- **Invoices detail dialog** (`finance/invoices/page.tsx`): `Preview` (branded HTML in a window), `Print` (opens preview then prints), `Download PDF` (`/api/invoices/:id/receipt.pdf`), `Email Receipt` with spinner/sending state that parses the server result — success toast names the recipient, `skipped` toast explains email delivery is disabled, failure shows an error. "Receipt last emailed on …" shown when present (data refreshes after sending).
- **Reservations page** (`reservations/page.tsx`): new **Email / Resend** action per reservation (spinner while sending, accurate toasts, refreshes so the "Emailed …" indicator updates); disabled without a guest email on file.
- **Booking dialog** keeps its automatic branded-receipt preview on creation; confirmation email is auto-dispatched server-side.
- Services/actions: `sendReservationConfirmation` added to `actions/operations.ts` + `bookings.service.ts`; types updated (`DashboardStaySummary.confirmationEmailSentAt`, `Invoice.receiptEmailSentAt`).
- **Branding**: replaced the stock Next favicon with a branded `app/icon.svg` (#1900ff monogram); layout metadata now has a title template + `applicationName`.
- `.env.example` documented for both `server/` and `client/`.

---

## 11. Configuration & Environment Variables

Documented in `server/.env.example` and `client/.env.example`, and in `server/RECEIPT_AND_EMAIL.md`:

| Variable | Purpose |
| --- | --- |
| `SMTP_HOST` | Enables email; unset ⇒ all sends `{ ok: true, skipped: true }` |
| `SMTP_PORT` / `SMTP_SECURE` | 587 default / implicit-TLS toggle |
| `SMTP_USER` / `SMTP_PASS` | SMTP auth |
| `SMTP_FROM` / `SMTP_FROM_NAME` | Sender identity |
| `FRONTEND_URL` | Links inside emails |
| `DATABASE_URL`, `PG_*`, `JWT_SECRET`, `PORT`, `CLIENT_ORIGIN`, `REQUIRE_EMAIL_VERIFICATION` | Logged/stated for completeness |
| `NEXT_PUBLIC_API_URL` (client) | Backend origin for rewrites |

---

## 12. Testing & Verification

What was actually verified:

- Server TypeScript compiles cleanly: `nest build` ✔ and `npx tsc --noEmit` ✔.
- Server ESLint: new `src/email/**` and `src/receipts/**` clean ✔; `operations.service.ts` / `auth.service.ts` retain the codebase's pre-existing `no-unsafe-*` lint style (new lines follow the same pattern).
- Server Jest: **3 suites / 3 tests pass** ✔.
- Client TypeScript: `npx tsc --noEmit` — clean ✔.
- Client ESLint on all touched files — no new violations (remaining hits are pre-existing codebase-wide patterns) ✔.
- Database: migration columns confirmed present in the live DB via read-only queries; the SSL-override issue (self-signed chain) was resolved for tooling by stripping `sslmode` from the connection URL.

**Honest caveats:**
- **Real email delivery was not exercised end-to-end**: SMTP_HOST is unset in this environment, so sends run the `skipped` path. Delivery should be verified with a test SMTP (e.g., Mailtrap) before relying on it.
- **PDF generation was not exercised end-to-end** through the HTTP endpoint here (Puppeteer launch depends on runtime Chromium/libs).
- No new automated tests were added for the email/receipt flows (existing unit/e2e suites pass unchanged).

---

## 13. Known Limitations & Follow-Ups

- **Background queue** (BullMQ/Redis) would make auto-sends retryable and relax request handlers during PDF generation/email sends — the current design is fire-and-forget by design, not queued.
- Operational **migration journal** mismatch: `drizzle/meta/_journal.json` never tracked `0004_room_is_active`; `0004_email_tracking` was applied directly. A future `drizzle-kit migrate` may need the journal reconciled first.
- `recordPayment`'s activity message hardcodes "GHS" (pre-existing, out of scope).
- If SMTP is later configured, confirm `SMTP_SECURE` matches the provider (465 implicit vs 587 STARTTLS) — the default `false` (587) is correct for most providers.
- Deploy requires Chromium system libraries / enough memory (see `server/RECEIPT_AND_EMAIL.md`).

> Status: feature-complete per scope. Email delivery and PDF download should be smoke-tested against a live SMTP + the deployed Chromium before opening to end users.

---

## Addendum — Per-hotel email sender & branding (SaaS, single platform SMTP)

Added after the initial report. All hotels share **one Nodemailer transport**
(the platform env SMTP) — providers are NOT configurable per hotel:

- **Schema/migration:** `hotel_settings` gained `email_from`, `email_from_name`,
  `primary_color`, `accent_color`; the earlier per-hotel SMTP provider columns
  (`smtp_host/port/secure/user/pass/from/from_name`) were **removed**
  (`server/drizzle/0006_email_branding_settings.sql`, idempotent, **applied**;
  `0005_hotel_smtp_settings.sql` remains in the journal as history).
- **EmailService:** revert to a single lazy, pooled platform transporter
  (`email.service.ts`). Emails always send From the platform's verified
  domain (`SMTP_FROM`); per-message `sender` overrides only the display
  name, and `replyTo` carries the hotel's own address.
- **Branding:** email templates (`email.templates.ts`) and the receipt document
  (`receipts.service.ts`) now render the hotel's `logoUrl`, `primaryColor`, and
  `accentColor` (header banner, buttons, code blocks, divider accents).
- **Resolution:** run flows (`loadStayEmailContext`), receipts
  (`ReceiptsService` context), staff invites, and auth account emails
  (`resolveAccountEmailContext` in `auth.service.ts`) all resolve the hotel's
  sender name + reply-to + branding. Registration (pre-hotel) uses env defaults.
- **UI:** Settings → Hotel → **Email & Branding** — reply-to email, sender
  name, logo URL (with preview), primary/accent color pickers — plus a
  **Send Test Email** control (`POST /settings/test-email`, requires
  `settings.update` = OWNER/ADMIN/MANAGER) with clear sent/skipped/failed
  feedback (test verifies the platform SMTP +
  hotel branding).
- **Persistence:** `UpdateSettingsDto` + `updateSettings` persist the fields;
  client schema/types (`operations.schema.ts`, `HotelSettingsResponse`) updated.
- **Verification:** server `nest build` + `tsc` clean; jest 3/3 pass; client
  `tsc` clean; email/receipts dirs eslint-clean (operations/auth retain
  pre-existing codebase-style lint). Real SMTP delivery still requires a
  configured platform provider to smoke-test.