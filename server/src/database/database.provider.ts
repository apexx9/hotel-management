import { Provider } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

export const DATABASE = Symbol('DATABASE');
export const PG_POOL = Symbol('PG_POOL');

export const poolProvider: Provider = {
  provide: PG_POOL,

  useFactory: () => {
    const connectionString = process.env.DATABASE_URL;

    const poolConfig: any = {
      connectionString,
    };

    // Handle SSL mode for Aiven databases
    if (
      connectionString &&
      (connectionString.includes('sslmode=require') ||
        connectionString.includes('aiven'))
    ) {
      poolConfig.ssl = { rejectUnauthorized: false };
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
