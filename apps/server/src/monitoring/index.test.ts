import type { Database, Pool } from "@femi/db";
import { describe, expect, it, vi } from "vitest";

import type { MetricDefinition } from "./config.js";
import { runMonitoringTick } from "./index.js";

const now = new Date("2026-05-26T12:00:00Z");

function metric(id: string, everyMinutes = 60): MetricDefinition {
  return { id, title: id, display: "value", everyMinutes, sql: `select 1 as ${id}` };
}

function fakeReadPool(): Pool {
  const query = vi.fn().mockResolvedValue({ rows: [{ x: 1 }], rowCount: 1 });
  return { connect: vi.fn().mockResolvedValue({ query, release: vi.fn() }) } as unknown as Pool;
}

function fakeDb(
  latest: Array<{ metricId: string; lastGeneratedAt: Date }>,
  values = vi.fn().mockResolvedValue(undefined)
): Database {
  // lastGeneratedByMetric uses db.select(...).from(...).groupBy(...)
  const groupBy = vi.fn().mockResolvedValue(latest);
  const from = vi.fn().mockReturnValue({ groupBy });
  const select = vi.fn().mockReturnValue({ from });

  return {
    select,
    insert: vi.fn().mockReturnValue({ values })
  } as unknown as Database;
}

describe("runMonitoringTick", () => {
  it("runs due metrics and skips ones still within their interval", async () => {
    const db = fakeDb([{ metricId: "recent", lastGeneratedAt: now }]);

    const result = await runMonitoringTick(db, fakeReadPool(), now, [
      metric("fresh"),
      metric("recent")
    ]);

    expect(result.ran).toEqual(["fresh"]);
    expect(result.skipped).toEqual(["recent"]);
    expect(result.failed).toEqual([]);
  });

  it("isolates a metric whose snapshot write fails so the rest still run", async () => {
    const values = vi
      .fn()
      .mockRejectedValueOnce(new Error("write failed"))
      .mockResolvedValue(undefined);
    const db = fakeDb([], values);

    const result = await runMonitoringTick(db, fakeReadPool(), now, [
      metric("first"),
      metric("second")
    ]);

    // Both processed despite the first write throwing.
    expect(result.failed).toContain("first");
    expect(result.ran).toContain("second");
    expect(result.ran.length + result.failed.length).toBe(2);
    // The failure reason is captured (not swallowed).
    expect(result.errors).toContainEqual({ metricId: "first", message: "write failed" });
  });
});
