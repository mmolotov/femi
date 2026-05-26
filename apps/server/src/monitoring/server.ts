import type { Database } from "@femi/db";
import Fastify, { type FastifyInstance } from "fastify";

import { getDashboardMetrics } from "./dashboard.js";
import { renderDashboard } from "./render.js";

// Minimal read-only dashboard server: a JSON API and a server-rendered HTML page,
// both backed by the latest metric snapshots. No mutating routes.
export function buildMonitoringServer(db: Database): FastifyInstance {
  const app = Fastify({ logger: false });

  app.get("/api/metrics", async () => {
    const metrics = await getDashboardMetrics(db);
    return { metrics };
  });

  app.get("/", async (_request, reply) => {
    const metrics = await getDashboardMetrics(db);
    reply.type("text/html; charset=utf-8");
    return renderDashboard(metrics);
  });

  return app;
}
