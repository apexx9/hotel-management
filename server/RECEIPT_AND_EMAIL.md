Receipt PDF & Email Notes

Overview

- The server can generate HTML receipts and convert them to PDF using Puppeteer.
- Emails (including PDF attachments) are sent via Nodemailer. If SMTP environment variables are not set, the MailService will log and skip sending (returns `{ ok: true, skipped: true }`).

Required environment variables

- `SMTP_HOST` - SMTP host (optional for local/dev; required to actually send mail)
- `SMTP_PORT` - SMTP port (default 587)
- `SMTP_USER` - SMTP username (optional)
- `SMTP_PASS` - SMTP password (optional)
- `SMTP_FROM` - From address used when sending mail (default: `no-reply@example.com`)
- `FRONTEND_URL` - URL used by invite links (e.g., `https://app.example.com`)

Puppeteer notes

- Puppeteer is used to render HTML receipts to PDF in `OperationsService.getInvoiceReceiptPdf`.
- The server launches Chromium with flags `--no-sandbox --disable-setuid-sandbox` for compatibility in many containerized environments.
- In some environments (restricted containers, Alpine musl, serverless) a custom Chromium build or additional libs may be required.

Deployment guidance

- When deploying, ensure the environment has enough memory and the required system libraries for Chromium. On Debian/Ubuntu install the `libnss3`, `libatk1.0-0`, `libgtk-3-0`, `libx11-xcb1`, and related packages.
- If running in Docker, use a base image that supports Chromium or use a prebuilt Chromium binary. Example Docker base: `node:18-bullseye-slim` and install dependencies.

Optional improvements

- Add a background email queue (BullMQ/Redis) to handle retries and avoid blocking request handlers during PDF generation and email sending.
- Add a `GET /invoices/:id/receipt.pdf?download=1` query parameter to toggle `Content-Disposition: attachment` vs `inline` if you want both behaviors.

Location of implementation

- PDF generation: `server/src/operations/operations.service.ts` -> `getInvoiceReceiptPdf`
- PDF endpoint: `server/src/operations/operations.controller.ts` -> `GET /invoices/:id/receipt.pdf`
- Mail sending with attachment: `server/src/auth/mail.service.ts` and usage in `OperationsService.sendInvoiceReceipt`.

Testing locally

- To test PDF generation without SMTP, ensure `SMTP_HOST` is unset and request the PDF endpoint in the browser: `http://localhost:3001/api/invoices/:id/receipt.pdf`.
- To test email sending, set SMTP env vars (or use a testing SMTP service like Mailtrap) and call the send endpoint.
