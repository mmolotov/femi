import type { Database, Pool } from "@femi/db";
import type { FastifyInstance } from "fastify";
import { describe, expect, it, vi } from "vitest";

import { loadMetrics } from "./config.js";
import { buildMonitoringServer } from "./server.js";

// Mirror a real browser form submit: urlencoded content type, empty body.
function postRefresh(app: FastifyInstance) {
  return app.inject({
    body: "",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST",
    url: "/refresh"
  });
}

// db.execute serves the dashboard's latest-snapshot read; insert().values()
// captures snapshot writes from the manual refresh endpoint.
function fakeDeps(snapshotRows: unknown[] = []) {
  const snapshotWrite = vi.fn().mockResolvedValue(undefined);
  const metricQuery = vi.fn().mockResolvedValue({ rows: [{ x: 1 }], rowCount: 1 });
  const db = {
    execute: vi.fn().mockResolvedValue({ rows: snapshotRows }),
    insert: vi.fn().mockReturnValue({ values: snapshotWrite })
  } as unknown as Database;
  const readPool = {
    connect: vi.fn().mockResolvedValue({ query: metricQuery, release: vi.fn() })
  } as unknown as Pool;

  return { db, readPool, metricQuery, snapshotWrite };
}

describe("monitoring server", () => {
  it("serves the latest snapshot per metric as JSON with metadata", async () => {
    const { db, readPool } = fakeDeps([
      {
        metric_id: "overview_totals",
        generated_at: new Date("2026-05-25T12:00:00Z"),
        rows: [{ total_users: 5 }],
        row_count: 1,
        error: null
      }
    ]);
    const app = buildMonitoringServer({ db, readPool });

    const response = await app.inject({ method: "GET", url: "/api/metrics" });

    expect(response.statusCode).toBe(200);
    const body = response.json() as {
      metrics: Array<{
        id: string;
        title: string;
        display: string;
        generatedAt: string | null;
        rowCount: number;
      }>;
    };

    // Every configured metric is present, even those not collected yet.
    expect(body.metrics.length).toBeGreaterThanOrEqual(9);

    const overview = body.metrics.find((entry) => entry.id === "overview_totals");
    expect(overview?.generatedAt).not.toBeNull();
    expect(overview?.rowCount).toBe(1);
    expect(overview?.display).toBe("value");

    const notCollected = body.metrics.find((entry) => entry.id === "tracking_mix");
    expect(notCollected?.generatedAt).toBeNull();

    await app.close();
  });

  it("serves the dashboard as HTML", async () => {
    const { db, readPool } = fakeDeps();
    const app = buildMonitoringServer({ db, readPool });

    const response = await app.inject({ method: "GET", url: "/" });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.body).toContain("femi monitoring");
    expect(response.body).toContain("Overview totals");

    await app.close();
  });

  it("recalculates every metric on demand and redirects back to the dashboard", async () => {
    const { db, readPool, metricQuery, snapshotWrite } = fakeDeps();
    const app = buildMonitoringServer({ db, readPool });

    const response = await postRefresh(app);

    expect(response.statusCode).toBe(303);
    expect(response.headers.location).toBe("/");
    // All configured metrics ran (none skipped by interval) and each run
    // persisted one snapshot.
    expect(metricQuery).toHaveBeenCalledTimes(loadMetrics().length);
    expect(snapshotWrite).toHaveBeenCalledTimes(loadMetrics().length);

    await app.close();
  });

  it("throttles a second refresh within the cooldown window", async () => {
    const { db, readPool, metricQuery } = fakeDeps();
    const app = buildMonitoringServer({ db, readPool });

    const first = await postRefresh(app);
    expect(first.statusCode).toBe(303);
    const runsAfterFirst = metricQuery.mock.calls.length;

    const second = await postRefresh(app);

    expect(second.statusCode).toBe(429);
    expect(Number(second.headers["retry-after"])).toBeGreaterThan(0);
    // The throttled request must not re-run any metric queries.
    expect(metricQuery).toHaveBeenCalledTimes(runsAfterFirst);

    await app.close();
  });

  it("allows another refresh once the cooldown has elapsed", async () => {
    const { db, readPool } = fakeDeps();
    const app = buildMonitoringServer({ db, readPool, refreshCooldownMs: 0 });

    const first = await postRefresh(app);
    const second = await postRefresh(app);

    expect(first.statusCode).toBe(303);
    expect(second.statusCode).toBe(303);

    await app.close();
  });

  it("still redirects when a metric query fails, persisting the error snapshot", async () => {
    const { db, readPool, metricQuery, snapshotWrite } = fakeDeps();
    metricQuery.mockRejectedValueOnce(new Error("boom"));
    const app = buildMonitoringServer({ db, readPool });

    const response = await postRefresh(app);

    expect(response.statusCode).toBe(303);
    // The failing metric is recorded as a snapshot too, so the page can show it.
    expect(snapshotWrite).toHaveBeenCalledTimes(loadMetrics().length);

    await app.close();
  });
});
