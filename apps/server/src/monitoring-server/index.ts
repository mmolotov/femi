import { createDatabaseConnection } from "@femi/db";

import { getEnv } from "../lib/env.js";
import { createStructuredLogger } from "../lib/structured-log.js";
import { buildMonitoringServer } from "../monitoring/server.js";

const env = getEnv();
// Dashboard only reads snapshots, so the read-only DSN is enough.
const { db, pool } = createDatabaseConnection(env.MONITORING_DATABASE_URL ?? env.DATABASE_URL);
const logger = createStructuredLogger("monitoring", env.LOG_LEVEL);
const app = buildMonitoringServer(db);

const shutdown = async (signal: string) => {
  logger.info("monitoring server shutdown", { signal });
  await app.close();
  await pool.end();
  process.exit(0);
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

try {
  await app.listen({ host: env.MONITORING_HOST, port: env.MONITORING_PORT });
  logger.info("monitoring server listening", {
    host: env.MONITORING_HOST,
    port: env.MONITORING_PORT
  });
} catch (error) {
  logger.error("monitoring server failed to start", { error });
  await pool.end();
  process.exit(1);
}
