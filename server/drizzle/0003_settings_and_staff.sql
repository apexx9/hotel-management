-- Hotel Settings table for persistent configuration

CREATE TABLE IF NOT EXISTS hotel_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL UNIQUE REFERENCES hotels(id) ON DELETE CASCADE ON UPDATE CASCADE,
  name varchar(255),
  email varchar(255),
  phone varchar(64),
  address text,
  logo_url text,
  timezone varchar(64) NOT NULL DEFAULT 'UTC',
  currency varchar(16) NOT NULL DEFAULT 'GHS',
  language varchar(16) NOT NULL DEFAULT 'en',
  check_in_time varchar(16) NOT NULL DEFAULT '14:00',
  check_out_time varchar(16) NOT NULL DEFAULT '11:00',
  booking_policy text,
  guest_id_required boolean NOT NULL DEFAULT true,
  tax_rate numeric(5, 2) NOT NULL DEFAULT 15.00,
  invoice_prefix varchar(16) NOT NULL DEFAULT 'INV',
  accepted_payment_methods text,
  service_config text,
  notification_prefs text,
  system_prefs text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hotel_settings_hotel_id ON hotel_settings(hotel_id);
