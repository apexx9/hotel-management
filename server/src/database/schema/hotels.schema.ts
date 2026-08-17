import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

export const hotels = pgTable('hotels', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 64 }),
  address: varchar('address', { length: 500 }),
});
