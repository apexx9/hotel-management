-- Replace per-hotel SMTP provider config with email sender + branding colors.
-- All hotels use the platform SMTP (Nodemailer); they only customize the
-- sender address/name, logo, and email/receipt colors.

ALTER TABLE "hotel_settings"
  DROP COLUMN IF EXISTS "smtp_host",
  DROP COLUMN IF EXISTS "smtp_port",
  DROP COLUMN IF EXISTS "smtp_secure",
  DROP COLUMN IF EXISTS "smtp_user",
  DROP COLUMN IF EXISTS "smtp_pass",
  DROP COLUMN IF EXISTS "smtp_from",
  DROP COLUMN IF EXISTS "smtp_from_name";

ALTER TABLE "hotel_settings"
  ADD COLUMN IF NOT EXISTS "email_from" varchar(255),
  ADD COLUMN IF NOT EXISTS "email_from_name" varchar(255),
  ADD COLUMN IF NOT EXISTS "primary_color" varchar(16) NOT NULL DEFAULT '#1900ff',
  ADD COLUMN IF NOT EXISTS "accent_color" varchar(16) NOT NULL DEFAULT '#0ea5e9';