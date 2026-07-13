import { createDatabaseConnection, createReadOnlyPool } from "@femi/db";

import { getEnv } from "../lib/env.js";
import { createStructuredLogger } from "../lib/structured-log.js";
import { buildMonitoringServer } from "../monitoring/server.js";

const env = getEnv();
// Same split as the worker: snapshot reads/writes (dashboard + manual refresh)
// use the writable DSN, while metric SQL runs on the read-only pool so
// monitoring can never mutate product data.
const { db, pool } = createDatabaseConnection(env.DATABASE_URL);
const readPool = createReadOnlyPool(env.MONITORING_DATABASE_URL ?? env.DATABASE_URL);
const logger = createStructuredLogger("monitoring", env.LOG_LEVEL);
const app = buildMonitoringServer({ db, readPool });

const shutdown = async (signal: string) => {
  logger.info("monitoring server shutdown", { signal });
  await app.close();
  await Promise.allSettled([pool.end(), readPool.end()]);
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
  await Promise.allSettled([pool.end(), readPool.end()]);
  process.exit(1);
}
