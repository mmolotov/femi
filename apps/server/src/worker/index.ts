import { createDatabaseConnection } from "@femi/db";

import { getEnv } from "../lib/env.js";
import { createStructuredLogger } from "../lib/structured-log.js";

const env = getEnv();
const { pool } = createDatabaseConnection(env.DATABASE_URL);
const logger = createStructuredLogger("worker", env.LOG_LEVEL);

const tick = async () => {
  const client = await pool.connect();

  try {
    await client.query("select 1");
    logger.info("worker heartbeat", {
      workerTickMs: env.WORKER_TICK_MS
    });
  } finally {
    client.release();
  }
};

await tick().catch((error: unknown) => {
  logger.error("initial worker tick failed", {
    error
  });
});

const timer = setInterval(() => {
  void tick().catch((error: unknown) => {
    logger.error("worker tick failed", {
      error
    });
  });
}, env.WORKER_TICK_MS);

const shutdown = async (signal: string) => {
  clearInterval(timer);
  logger.info("worker shutdown", {
    signal
  });
  await pool.end();
  process.exit(0);
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
