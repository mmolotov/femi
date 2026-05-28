import { describe, expect, it } from "vitest";

import type { MetricDefinition } from "./config.js";
import { isMetricDue } from "./scheduler.js";

const metric: MetricDefinition = {
  id: "m",
  title: "M",
  display: "value",
  everyMinutes: 60,
  sql: "select 1"
};

describe("isMetricDue", () => {
  const now = new Date("2026-05-25T12:00:00Z");

  it("is due when it has never run", () => {
    expect(isMetricDue(metric, null, now)).toBe(true);
  });

  it("is not due before the interval elapses", () => {
    const last = new Date(now.getTime() - 59 * 60_000);
    expect(isMetricDue(metric, last, now)).toBe(false);
  });

  it("is due once the interval has elapsed", () => {
    const last = new Date(now.getTime() - 60 * 60_000);
    expect(isMetricDue(metric, last, now)).toBe(true);
  });
});
