import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { schema } from "./schema.js";

export type { Pool } from "pg";

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

// Standalone read-only pool for the monitoring scheduler: metric queries run on
// this connection so they can never mutate product data. Point it at a read-only
// database role in production.
export function createReadOnlyPool(connectionString: string): Pool {
  return new Pool({
    connectionString
  });
}
