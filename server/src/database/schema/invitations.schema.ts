import {
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { hotels } from './hotels.schema';

export const invitationStatusEnum = pgEnum('invitation_status', [
  'pending',
  'accepted',
  'expired',
  'revoked',
]);

export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    token: varchar('token', {
      length: 255,
    }).notNull(),

    email: varchar('email', {
      length: 255,
    }).notNull(),

    hotelId: uuid('hotel_id')
      .notNull()
      .references(() => hotels.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    role: varchar('role', {
      length: 64,
    })
      .notNull()
      .default('staff'),

    expiresAt: timestamp('expires_at', {
      withTimezone: true,
    }).notNull(),

    status: invitationStatusEnum('status')
      .notNull()
      .default('pending'),

    acceptedAt: timestamp('accepted_at', {
      withTimezone: true,
    }),

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
  },
  (table) => ({
    tokenUnique: uniqueIndex('invitations_token_unique').on(
      table.token,
    ),
  }),
);
