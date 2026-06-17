import type { Database } from "@femi/db";
import { describe, expect, it, vi } from "vitest";

import { buildMonitoringServer } from "./server.js";

function dbReturning(rows: unknown[]): Database {
  return { execute: vi.fn().mockResolvedValue({ rows }) } as unknown as Database;
}

describe("monitoring server", () => {
  it("serves the latest snapshot per metric as JSON with metadata", async () => {
    const db = dbReturning([
      {
        metric_id: "overview_totals",
        generated_at: new Date("2026-05-25T12:00:00Z"),
        rows: [{ total_users: 5 }],
        row_count: 1,
        error: null
      }
    ]);
    const app = buildMonitoringServer(db);

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
    const app = buildMonitoringServer(dbReturning([]));

    const response = await app.inject({ method: "GET", url: "/" });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.body).toContain("femi monitoring");
    expect(response.body).toContain("Overview totals");

    await app.close();
  });
});
