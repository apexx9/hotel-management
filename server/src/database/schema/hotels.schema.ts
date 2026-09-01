import {
  pgTable,
  timestamp,
  uuid,
  varchar,
  text,
} from 'drizzle-orm/pg-core';

export const hotels = pgTable('hotels', {
  id: uuid('id').primaryKey().defaultRandom(),

  name: varchar('name', { length: 255 }).notNull(),

  email: varchar('email', { length: 255 }),

  phone: varchar('phone', { length: 64 }),

  address: text('address'),

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
