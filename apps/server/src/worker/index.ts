import { createDatabaseConnection, createReadOnlyPool } from "@femi/db";

import { getEnv } from "../lib/env.js";
import { createStructuredLogger } from "../lib/structured-log.js";
import { runMonitoringTick } from "../monitoring/index.js";

const env = getEnv();
const { db, pool } = createDatabaseConnection(env.DATABASE_URL);
// Metric queries run on a read-only connection so monitoring can never mutate
// product data; snapshot writes use the writable `db` above. Only opened when
// monitoring is enabled.
const readPool = env.MONITORING_ENABLED
  ? createReadOnlyPool(env.MONITORING_DATABASE_URL ?? env.DATABASE_URL)
  : null;
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

  if (readPool) {
    const result = await runMonitoringTick(db, readPool);
    if (result.ran.length > 0 || result.failed.length > 0) {
      logger.info("monitoring tick", {
        ran: result.ran,
        failed: result.failed,
        skipped: result.skipped.length
      });
    }
    if (result.errors.length > 0) {
      logger.error("monitoring metrics failed", {
        errors: result.errors
      });
    }
  }
};

await tick().catch((error: unknown) => {
  logger.error("initial worker tick failed", {
    error
  });
});

// Guard against overlapping ticks: if one is still running when the interval
// fires (slow query / DB stall), skip rather than double-run metrics.
let ticking = false;
const timer = setInterval(() => {
  if (ticking) {
    logger.warn("worker tick still running; skipping this interval");
    return;
  }

  ticking = true;
  void tick()
    .catch((error: unknown) => {
      logger.error("worker tick failed", {
        error
      });
    })
    .finally(() => {
      ticking = false;
    });
}, env.WORKER_TICK_MS);

const shutdown = async (signal: string) => {
  clearInterval(timer);
  logger.info("worker shutdown", {
    signal
  });
  const closing = [pool.end()];
  if (readPool) {
    closing.push(readPool.end());
  }
  await Promise.allSettled(closing);
  process.exit(0);
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
