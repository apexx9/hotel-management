import {
  boolean,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { hotels } from './hotels.schema';

export const hotelSettings = pgTable('hotel_settings', {
  id: uuid('id').primaryKey().defaultRandom(),

  hotelId: uuid('hotel_id')
    .notNull()
    .unique()
    .references(() => hotels.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),

  name: varchar('name', {
    length: 255,
  }),

  email: varchar('email', {
    length: 255,
  }),

  phone: varchar('phone', {
    length: 64,
  }),

  address: text('address'),

  logoUrl: text('logo_url'),

  timezone: varchar('timezone', {
    length: 64,
  })
    .notNull()
    .default('UTC'),

  currency: varchar('currency', {
    length: 16,
  })
    .notNull()
    .default('GHS'),

  language: varchar('language', {
    length: 16,
  })
    .notNull()
    .default('en'),

  checkInTime: varchar('check_in_time', {
    length: 16,
  })
    .notNull()
    .default('14:00'),

  checkOutTime: varchar('check_out_time', {
    length: 16,
  })
    .notNull()
    .default('11:00'),

  bookingPolicy: text('booking_policy'),

  guestIdRequired: boolean('guest_id_required')
    .notNull()
    .default(true),

  taxRate: numeric('tax_rate', {
    precision: 5,
    scale: 2,
  })
    .notNull()
    .default('15.00'),

  invoicePrefix: varchar('invoice_prefix', {
    length: 16,
  })
    .notNull()
    .default('INV'),

  acceptedPaymentMethods: text(
    'accepted_payment_methods',
  ),

  serviceConfig: text('service_config'),

  notificationPrefs: text('notification_prefs'),

  systemPrefs: text('system_prefs'),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});
