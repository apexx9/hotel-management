import { Provider } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

export const DATABASE = Symbol('DATABASE');
export const PG_POOL = Symbol('PG_POOL');

export const poolProvider: Provider = {
  provide: PG_POOL,

  useFactory: () => {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
    });
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
