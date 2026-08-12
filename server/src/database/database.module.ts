import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';

import { databaseProvider, PG_POOL } from './database.provider';

import { poolProvider } from './database.provider';
import { Pool } from 'pg';

@Global()
@Module({
  providers: [poolProvider, databaseProvider],

  exports: [databaseProvider],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(
    @Inject(PG_POOL)
    private readonly pool: Pool,
  ) {}

  async onApplicationShutdown() {
    await this.pool.end();
  }
}
