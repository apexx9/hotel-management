ALTER TABLE "hotel_settings" ADD COLUMN "default_tax_type" varchar(16) DEFAULT 'value' NOT NULL;--> statement-breakpoint
ALTER TABLE "hotel_settings" ADD COLUMN "default_tax_value" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "hotel_settings" ADD COLUMN "default_discount_type" varchar(16) DEFAULT 'value' NOT NULL;--> statement-breakpoint
ALTER TABLE "hotel_settings" ADD COLUMN "default_discount_value" numeric(12, 2) DEFAULT '0' NOT NULL;