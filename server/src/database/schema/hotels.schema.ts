import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

export const hotels = pgTable('hotels', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
});
