-- HMS core domain tables

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE room_status AS ENUM (
    'available',
    'occupied',
    'cleaning',
    'inspection',
    'maintenance',
    'out_of_service',
    'reserved'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE TYPE stay_status AS ENUM (
    'reserved',
    'pending_arrival',
    'checked_in',
    'checked_out',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE TYPE payment_method AS ENUM (
    'cash',
    'mobile_money',
    'card',
    'bank_transfer'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE TYPE payment_status AS ENUM (
    'paid',
    'partial',
    'pending',
    'overdue',
    'reversed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE TYPE invoice_status AS ENUM (
    'draft',
    'issued',
    'partially_paid',
    'paid',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE TYPE service_charge_status AS ENUM (
    'open',
    'posted',
    'voided'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE TYPE housekeeping_status AS ENUM (
    'cleaning',
    'inspection',
    'ready',
    'maintenance'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE TYPE notification_type AS ENUM (
    'checkout_overdue',
    'payment_outstanding',
    'room_ready',
    'room_unavailable',
    'maintenance_issue',
    'new_booking',
    'guest_arrival',
    'service_charge_added'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS room_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid,
  name varchar(100) NOT NULL UNIQUE,
  description text,
  base_price numeric(12, 2) NOT NULL,
  capacity integer NOT NULL DEFAULT 2,
  bed_configuration varchar(100),
  amenities text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid,
  number varchar(20) NOT NULL UNIQUE,
  floor varchar(20) NOT NULL,
  room_type_id uuid NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  status room_status NOT NULL DEFAULT 'available',
  rate numeric(12, 2) NOT NULL DEFAULT 0,
  capacity integer NOT NULL DEFAULT 2,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid,
  first_name varchar(120) NOT NULL,
  last_name varchar(120) NOT NULL,
  phone varchar(32) NOT NULL,
  email varchar(255),
  nationality varchar(120),
  identification_type varchar(80),
  identification_number varchar(120),
  address text,
  emergency_contact varchar(32),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid,
  reference varchar(32) NOT NULL UNIQUE,
  guest_id uuid NOT NULL REFERENCES guests(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  room_type_id uuid NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  status stay_status NOT NULL DEFAULT 'reserved',
  check_in_at timestamptz,
  expected_checkout_at timestamptz NOT NULL,
  actual_checkout_at timestamptz,
  guests_count integer NOT NULL DEFAULT 1,
  nights integer NOT NULL DEFAULT 1,
  rate numeric(12, 2) NOT NULL DEFAULT 0,
  discount numeric(12, 2) NOT NULL DEFAULT 0,
  taxes numeric(12, 2) NOT NULL DEFAULT 0,
  service_total numeric(12, 2) NOT NULL DEFAULT 0,
  total numeric(12, 2) NOT NULL DEFAULT 0,
  amount_paid numeric(12, 2) NOT NULL DEFAULT 0,
  outstanding_balance numeric(12, 2) NOT NULL DEFAULT 0,
  special_requests text,
  notes text,
  created_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid,
  reference varchar(32) NOT NULL UNIQUE,
  guest_id uuid NOT NULL REFERENCES guests(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  stay_id uuid NOT NULL REFERENCES stays(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  status invoice_status NOT NULL DEFAULT 'draft',
  subtotal numeric(12, 2) NOT NULL DEFAULT 0,
  discount numeric(12, 2) NOT NULL DEFAULT 0,
  taxes numeric(12, 2) NOT NULL DEFAULT 0,
  total numeric(12, 2) NOT NULL DEFAULT 0,
  amount_paid numeric(12, 2) NOT NULL DEFAULT 0,
  outstanding numeric(12, 2) NOT NULL DEFAULT 0,
  issued_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE ON UPDATE CASCADE,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(12, 2) NOT NULL DEFAULT 0,
  total numeric(12, 2) NOT NULL DEFAULT 0,
  item_type varchar(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid,
  name varchar(120) NOT NULL,
  category varchar(120) NOT NULL,
  price numeric(12, 2) NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid,
  guest_id uuid NOT NULL REFERENCES guests(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  stay_id uuid NOT NULL REFERENCES stays(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(12, 2) NOT NULL,
  total numeric(12, 2) NOT NULL,
  staff_id uuid,
  status service_charge_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid,
  reference varchar(32) NOT NULL UNIQUE,
  guest_id uuid NOT NULL REFERENCES guests(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  stay_id uuid NOT NULL REFERENCES stays(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  staff_id uuid,
  method payment_method NOT NULL,
  amount numeric(12, 2) NOT NULL,
  status payment_status NOT NULL DEFAULT 'paid',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS housekeeping_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid,
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  stay_id uuid REFERENCES stays(id) ON DELETE SET NULL ON UPDATE CASCADE,
  status housekeeping_status NOT NULL DEFAULT 'cleaning',
  assigned_to_user_id uuid,
  note text,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid,
  actor_user_id uuid,
  actor_name varchar(255),
  event varchar(255) NOT NULL,
  description text,
  reference_type varchar(64),
  reference_id varchar(64),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid,
  type notification_type NOT NULL,
  title varchar(255) NOT NULL,
  message text NOT NULL,
  reference_type varchar(64),
  reference_id varchar(64),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rooms_room_type_id ON rooms(room_type_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_guests_phone ON guests(phone);
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);
CREATE INDEX IF NOT EXISTS idx_stays_guest_id ON stays(guest_id);
CREATE INDEX IF NOT EXISTS idx_stays_room_id ON stays(room_id);
CREATE INDEX IF NOT EXISTS idx_stays_status ON stays(status);
CREATE INDEX IF NOT EXISTS idx_invoices_stay_id ON invoices(stay_id);
CREATE INDEX IF NOT EXISTS idx_payments_stay_id ON payments(stay_id);
CREATE INDEX IF NOT EXISTS idx_service_charges_stay_id ON service_charges(stay_id);
CREATE INDEX IF NOT EXISTS idx_housekeeping_tasks_room_id ON housekeeping_tasks(room_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
