import { describe, expect, it } from "vitest";

import { displayTypes, loadMetrics, validateMetrics } from "./config.js";

describe("monitoring config", () => {
  it("loads every configured metric with non-empty SQL and valid metadata", () => {
    const metrics = loadMetrics();

    expect(metrics).toHaveLength(9);
    for (const metric of metrics) {
      expect(metric.sql.trim().length).toBeGreaterThan(0);
      expect(displayTypes).toContain(metric.display);
      expect(metric.everyMinutes).toBeGreaterThan(0);
    }
  });

  it("accepts a well-formed definition", () => {
    const metrics = validateMetrics([
      { id: "valid_one", title: "Valid", display: "table", everyMinutes: 30, sql: "select 1" }
    ]);

    expect(metrics).toHaveLength(1);
    expect(metrics[0]?.id).toBe("valid_one");
  });

  it("fails fast on a malformed definition, naming the offending index", () => {
    expect(() =>
      validateMetrics([
        { id: "ok", title: "Ok", display: "value", everyMinutes: 60, sql: "select 1" },
        { id: "Bad-Id", title: "", display: "pie", everyMinutes: 0, sql: "" }
      ])
    ).toThrow(/Invalid monitoring metric at index 1/u);
  });

  it("rejects duplicate metric ids", () => {
    const shared = { title: "X", display: "value", everyMinutes: 60, sql: "select 1" } as const;

    expect(() =>
      validateMetrics([
        { id: "dup", ...shared },
        { id: "dup", ...shared }
      ])
    ).toThrow(/Duplicate monitoring metric id/u);
  });
});
