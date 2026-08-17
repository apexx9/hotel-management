import { pgTable, uuid, varchar, boolean } from 'drizzle-orm/pg-core';

export const auth_tokens = pgTable('auth_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  token: varchar('token', { length: 255 }).notNull(),
  user_id: uuid('user_id').notNull(),
  type: varchar('type', { length: 64 }).notNull(), // e.g., verify, password_reset
  expires_at: varchar('expires_at', { length: 64 }),
  used: boolean('used').notNull().default(false),
});
