import {
  boolean,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { hotels } from './hotels.schema';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),

  email: varchar('email', { length: 255 }).notNull().unique(),

  phone: varchar('phone', { length: 32 }),

  passwordHash: varchar('password_hash', {
    length: 255,
  }).notNull(),

  fullName: varchar('full_name', {
    length: 255,
  }).notNull(),

  hotelId: uuid('hotel_id').references(() => hotels.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),

  role: varchar('role', {
    length: 64,
  })
    .notNull()
    .default('staff'),

  isVerified: boolean('is_verified')
    .notNull()
    .default(false),

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
