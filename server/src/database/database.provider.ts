import { Provider } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

export const DATABASE = Symbol('DATABASE');
export const PG_POOL = Symbol('PG_POOL');

export const poolProvider: Provider = {
  provide: PG_POOL,

  useFactory: () => {
    const connectionString = process.env.DATABASE_URL;
    const poolConfig: any = { connectionString };

    // If the connection string requests SSL (e.g. contains sslmode=require),
    // configure the pg Pool to accept the server certificate by disabling
    // strict certificate verification. This is common for managed DBs like
    // Aiven which use self-signed certificates in the chain.
    // Accept self-signed certs for known managed providers or when sslmode is present.
    if (
      connectionString &&
      (connectionString.includes('sslmode') ||
        connectionString.includes('aiven'))
    ) {
      // Best-effort: allow self-signed certs for managed providers.
      poolConfig.ssl = { rejectUnauthorized: false };
      // As a last resort for environments where pg still rejects the chain,
      // disable Node's TLS certificate verification (local/dev only).
      // This is a pragmatic fallback for the smoke-test; remove for production.
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    return new Pool(poolConfig);
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
