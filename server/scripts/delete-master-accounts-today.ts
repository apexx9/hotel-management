/**
 * One-off cleanup script — delete all master (hotel) accounts created today.
 *
 * Usage:
 *   pnpm tsx scripts/delete-master-accounts-today.ts            # dry run: list matches
 *   pnpm tsx scripts/delete-master-accounts-today.ts --commit   # actually delete
 *
 * Optionally narrow the window with --since=hours (default: local midnight).
 * "Today" is the server-local midnight → next midnight.
 *
 * Deletion order mirrors auth.service.deleteAccount: invitations →
 * hotel users (tokens cascade) → hotels (rooms/guests/stays/invoices/
 * payments/bookings/notifications/activity/settings cascade).
 */
import 'dotenv/config';
import { Pool } from 'pg';
import { and, gte, lt, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { hotels } from '../src/database/schema/hotels.schema';
import { users } from '../src/database/schema/users.schema';
import { invitations } from '../src/database/schema/invitations.schema';

const connectionString = process.env.DATABASE_URL ?? '';
if (!connectionString) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const commit = process.argv.includes('--commit');
if (commit) {
  console.log('WARNING: --commit passed. This will PERMANENTLY delete data.');
}

// Build the pool the same way the NestJS provider does (Aiven/SSL handling).
const poolConfig: any = {
  max: Number(process.env.PG_POOL_MAX ?? 10),
  connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT ?? 10000),
  idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT ?? 30000),
};
if (
  connectionString &&
  (connectionString.includes('sslmode=require') ||
    connectionString.includes('aiven'))
) {
  poolConfig.connectionString = connectionString
    .replace(/[?&]sslmode=[^&]*/i, '')
    .replace(/&$/, '');
  poolConfig.ssl = { rejectUnauthorized: false };
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
} else {
  poolConfig.connectionString = connectionString;
}

const pool = new Pool(poolConfig);
const db = drizzle({ client: pool });

// Compute "today" window (local midnight → next local midnight).
const now = new Date();
const sinceArg = process.argv.find((a) => a.startsWith('--since='));
let start: Date;
if (sinceArg) {
  const hours = Number(sinceArg.split('=')[1]);
  if (Number.isNaN(hours)) {
    console.error('Invalid --since value. Use --since=24 for the last 24h.');
    process.exit(1);
  }
  start = new Date(now.getTime() - hours * 60 * 60 * 1000);
} else {
  start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

const fmt = (d: Date) => d.toISOString();

async function run() {
  const todayHotels = await db
    .select({
      id: hotels.id,
      name: hotels.name,
      email: hotels.email,
      createdAt: hotels.createdAt,
    })
    .from(hotels)
    .where(and(gte(hotels.createdAt, start), lt(hotels.createdAt, end)));

  console.log(
    `Window: ${fmt(start)} → ${fmt(end)} (${fmt(start)}..${fmt(end)})`,
  );
  console.log(`Found ${todayHotels.length} master account(s) created today.\n`);

  if (todayHotels.length === 0) {
    console.log('Nothing to delete.');
    await pool.end();
    return;
  }

  const ids = todayHotels.map((h) => h.id);

  const userRows = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      hotelId: users.hotelId,
    })
    .from(users)
    .where(inArray(users.hotelId, ids));
  const inviteRows = await db
    .select({ id: invitations.id, email: invitations.email })
    .from(invitations)
    .where(inArray(invitations.hotelId, ids));

  for (const h of todayHotels) {
    const userCount = userRows.filter((u) => u.hotelId === h.id).length;
    console.log(
      `- ${h.name} (${h.email ?? 'no email'}) created ${h.createdAt.toISOString()} — ${userCount} user(s)`,
    );
  }

  console.log(
    `\nTotals: ${todayHotels.length} hotel(s), ${userRows.length} user(s), ${inviteRows.length} invitation(s) will be deleted.`,
  );

  if (!commit) {
    console.log('\nDry run — nothing deleted. Re-run with --commit to delete.');
    await pool.end();
    return;
  }

  await db.transaction(async (tx) => {
    if (inviteRows.length > 0) {
      await tx
        .delete(invitations)
        .where(inArray(invitations.hotelId, ids));
    }

    const userIds = userRows.map((u) => u.id);
    if (userIds.length > 0) {
      await tx.delete(users).where(inArray(users.id, userIds));
    }

    await tx.delete(hotels).where(inArray(hotels.id, ids));
  });

  console.log('\nDone. Master accounts deleted.');
  await pool.end();
}

run().catch(async (err) => {
  console.error('Failed:', err);
  await pool.end();
  process.exit(1);
});