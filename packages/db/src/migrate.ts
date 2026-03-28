import { config } from "dotenv";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import { createDatabaseConnection } from "./client.js";

config({
  path: new URL("../../../.env", import.meta.url),
  quiet: true
});

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run migrations.");
}

const { db, pool } = createDatabaseConnection(databaseUrl);

await migrate(db, {
  migrationsFolder: new URL("../migrations", import.meta.url).pathname
});

await pool.end();
