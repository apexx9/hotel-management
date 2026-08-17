import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';

export const refresh_tokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  token_hash: varchar('token_hash', { length: 255 }).notNull(),
  user_id: uuid('user_id').notNull(),
  expires_at: timestamp('expires_at').notNull(),
  revoked: boolean('revoked').notNull().default(false),
});
