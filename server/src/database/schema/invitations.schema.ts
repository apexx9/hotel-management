import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  token: varchar('token', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  hotel_id: uuid('hotel_id').notNull(),
  role: varchar('role', { length: 64 }).notNull(),
  expires_at: varchar('expires_at', { length: 64 }),
  accepted: varchar('accepted', { length: 16 }).notNull().default('pending'),
});
