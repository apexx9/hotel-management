import { Provider } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

export const DATABASE = Symbol('DATABASE');
export const PG_POOL = Symbol('PG_POOL');

export const poolProvider: Provider = {
  provide: PG_POOL,

  useFactory: () => {
    const connectionString = process.env.DATABASE_URL ?? '';

    const poolConfig: any = {
      max: Number(process.env.PG_POOL_MAX ?? 10),
      connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT ?? 10000),
      idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT ?? 30000),
    };

    // Handle SSL mode for Aiven databases. Modern pg-connection-string
    // treats `sslmode=require|prefer|verify-ca` as `verify-full`, which
    // rejects self-signed certs despite rejectUnauthorized:false. Strip the
    // sslmode param and pass the ssl object explicitly instead.
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

    pool.on('error', (err) => {
      // pg emits 'error' on idle clients (e.g. server-side disconnect).
      // Without a listener this would crash the process.
      console.error('[db-pool] idle client error:', err.message);
    });

    return pool;
  },
};

export const databaseProvider: Provider = {
  provide: DATABASE,

  inject: [PG_POOL],

  useFactory: (pool: Pool) => {
    return drizzle({
      client: pool,
    });
  },
};
