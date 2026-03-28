import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { schema } from "./schema.js";

export type Database = NodePgDatabase<typeof schema>;

export type DatabaseConnection = {
  db: Database;
  pool: Pool;
};

export function createDatabaseConnection(connectionString: string): DatabaseConnection {
  const pool = new Pool({
    connectionString
  });

  return {
    db: drizzle(pool, { schema }),
    pool
  };
}
