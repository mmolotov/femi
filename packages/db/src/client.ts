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
// this connection so they can never mutate product data. Read-only is enforced at
// the session level (default_transaction_read_only), so writes fail even if the
// DSN points at a writable role; pointing it at a dedicated read-only role in
// production is recommended defense-in-depth.
export function createReadOnlyPool(connectionString: string): Pool {
  return new Pool({
    connectionString,
    options: "-c default_transaction_read_only=on"
  });
}
