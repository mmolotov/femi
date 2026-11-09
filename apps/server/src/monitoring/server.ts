import type { Database, Pool } from "@femi/db";
import Fastify, { type FastifyInstance } from "fastify";

import { loadMetrics } from "./config.js";
import { getDashboardMetrics } from "./dashboard.js";
import { runMonitoringTick } from "./index.js";
import { renderDashboard } from "./render.js";

// Successive manual refreshes within this window are rejected so the dashboard
// button cannot hammer the metric queries.
const MANUAL_REFRESH_COOLDOWN_MS = 30_000;

type MonitoringServerDeps = {
  // Writable connection: reads the latest snapshots and persists manual-refresh
  // snapshots. Metric SQL never runs here.
  db: Database;
  // Read-only pool for the metric queries themselves, mirroring the worker's
  // split so monitoring can never mutate product data.
  readPool: Pool;
  refreshCooldownMs?: number;
};

// Dashboard server: a JSON API and a server-rendered HTML page, both backed by
// the latest metric snapshots. The one mutating route is POST /refresh, which
// force-runs every metric and persists fresh snapshots.
export function buildMonitoringServer(deps: MonitoringServerDeps): FastifyInstance {
  const { db, readPool, refreshCooldownMs = MANUAL_REFRESH_COOLDOWN_MS } = deps;
  const app = Fastify({ logger: false });
  let lastManualRefreshAt = 0;

  // The refresh button is a plain HTML form, so the browser posts an (empty)
  // urlencoded body. Fastify has no parser for that type out of the box and
  // would reject the POST with 415; accept and discard the body instead.
  app.addContentTypeParser(
    "application/x-www-form-urlencoded",
    { parseAs: "buffer" },
    (_request, _body, done) => {
      done(null, undefined);
    }
  );

  app.get("/api/metrics", async () => {
    const metrics = await getDashboardMetrics(db);
    return { metrics };
  });

  app.get("/", async (_request, reply) => {
    const metrics = await getDashboardMetrics(db);
    reply.type("text/html; charset=utf-8");
    return renderDashboard(metrics);
  });

  app.post("/refresh", async (_request, reply) => {
    const now = Date.now();
    const waitMs = lastManualRefreshAt + refreshCooldownMs - now;

    if (waitMs > 0) {
      const waitSeconds = Math.ceil(waitMs / 1000);
      reply.header("retry-after", String(waitSeconds));
      return reply
        .code(429)
        .type("text/plain; charset=utf-8")
        .send(`Metrics were just recalculated. Try again in ${waitSeconds}s.`);
    }

    // Stamp before running so concurrent submits are throttled, not doubled.
    lastManualRefreshAt = now;
    await runMonitoringTick(db, readPool, new Date(), loadMetrics(), true);

    // 303 turns the form POST into a GET of the dashboard with fresh snapshots.
    // Failed metrics are persisted as error snapshots and surface on the page.
    return reply.code(303).header("location", "/").send();
  });

  return app;
}
