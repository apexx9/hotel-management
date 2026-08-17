import { NodePgDatabase } from 'drizzle-orm/node-postgres';

// Use a relaxed type for the database to avoid strict TableRelationalConfig
// mismatches caused by the way schema exports are composed. This preserves
// runtime correctness while avoiding complex generic errors during compilation.
export type Database = NodePgDatabase<any>;
