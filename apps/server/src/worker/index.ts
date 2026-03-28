import { createDatabaseConnection } from "@femi/db";

import { getEnv } from "../lib/env.js";

const env = getEnv();
const { pool } = createDatabaseConnection(env.DATABASE_URL);

const tick = async () => {
  const client = await pool.connect();

  try {
    await client.query("select 1");
    console.log(
      JSON.stringify({
        level: "info",
        msg: "worker heartbeat",
        timestamp: new Date().toISOString()
      })
    );
  } finally {
    client.release();
  }
};

await tick();

const timer = setInterval(() => {
  void tick();
}, env.WORKER_TICK_MS);

const shutdown = async (signal: string) => {
  clearInterval(timer);
  console.log(
    JSON.stringify({
      level: "info",
      msg: "worker shutdown",
      signal,
      timestamp: new Date().toISOString()
    })
  );
  await pool.end();
  process.exit(0);
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
