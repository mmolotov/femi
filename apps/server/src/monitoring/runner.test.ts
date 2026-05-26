import type { Database, Pool } from "@femi/db";
import { describe, expect, it, vi } from "vitest";

import type { MetricDefinition } from "./config.js";
import { persistSnapshot, runMetric } from "./runner.js";

const metric: MetricDefinition = {
  id: "m",
  title: "M",
  display: "table",
  everyMinutes: 60,
  sql: "select 1 as x"
};

function fakePool(query: ReturnType<typeof vi.fn>, release = vi.fn()): Pool {
  return {
    connect: vi.fn().mockResolvedValue({ query, release })
  } as unknown as Pool;
}

describe("runMetric", () => {
  it("returns rows and rowCount on success", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ x: 1 }], rowCount: 1 });

    const result = await runMetric(fakePool(query), metric);

    expect(query).toHaveBeenCalledWith(metric.sql);
    expect(result.rows).toEqual([{ x: 1 }]);
    expect(result.rowCount).toBe(1);
    expect(result.error).toBeNull();
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("captures a query error instead of throwing", async () => {
    const query = vi.fn().mockRejectedValue(new Error("boom"));

    const result = await runMetric(fakePool(query), metric);

    expect(result.error).toBe("boom");
    expect(result.rows).toEqual([]);
    expect(result.rowCount).toBe(0);
  });

  it("releases the client even when the query fails", async () => {
    const release = vi.fn();
    const query = vi.fn().mockRejectedValue(new Error("x"));

    await runMetric(fakePool(query, release), metric);

    expect(release).toHaveBeenCalledTimes(1);
  });
});

describe("persistSnapshot", () => {
  it("inserts the run result via drizzle", async () => {
    const values = vi.fn().mockResolvedValue(undefined);
    const insert = vi.fn().mockReturnValue({ values });
    const db = { insert } as unknown as Database;

    await persistSnapshot(db, {
      metricId: "m",
      rows: [{ a: 1 }],
      rowCount: 1,
      durationMs: 5,
      error: null
    });

    expect(insert).toHaveBeenCalledTimes(1);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ metricId: "m", rowCount: 1, error: null })
    );
  });
});
