ALTER TABLE "hotel_settings" ADD COLUMN IF NOT EXISTS "smtp_host" varchar(255);--> statement-breakpoint
ALTER TABLE "hotel_settings" ADD COLUMN IF NOT EXISTS "smtp_port" integer;--> statement-breakpoint
ALTER TABLE "hotel_settings" ADD COLUMN IF NOT EXISTS "smtp_secure" boolean;--> statement-breakpoint
ALTER TABLE "hotel_settings" ADD COLUMN IF NOT EXISTS "smtp_user" varchar(255);--> statement-breakpoint
ALTER TABLE "hotel_settings" ADD COLUMN IF NOT EXISTS "smtp_pass" text;--> statement-breakpoint
ALTER TABLE "hotel_settings" ADD COLUMN IF NOT EXISTS "smtp_from" varchar(255);--> statement-breakpoint
ALTER TABLE "hotel_settings" ADD COLUMN IF NOT EXISTS "smtp_from_name" varchar(255);