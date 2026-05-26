import { describe, expect, it } from "vitest";

import type { DashboardMetric } from "./dashboard.js";
import { renderDashboard } from "./render.js";

function metric(overrides: Partial<DashboardMetric> = {}): DashboardMetric {
  return {
    id: "m",
    title: "Metric",
    display: "table",
    generatedAt: "2026-05-25T12:00:00.000Z",
    rowCount: 1,
    rows: [{ a: 1, b: "x" }],
    error: null,
    ...overrides
  };
}

describe("renderDashboard", () => {
  it("renders an empty page when no metrics are configured", () => {
    const html = renderDashboard([]);
    expect(html).toContain("femi monitoring");
    expect(html).toContain("No metrics configured");
  });

  it("renders the title and updated time for each metric", () => {
    const html = renderDashboard([metric({ title: "Overview totals" })]);
    expect(html).toContain("Overview totals");
    expect(html).toContain("2026-05-25T12:00:00.000Z");
  });

  it("renders value metrics as stat cards with humanized labels", () => {
    const html = renderDashboard([
      metric({
        display: "value",
        rows: [{ total_users: 42, onboarding_completion_rate_pct: 80 }]
      })
    ]);
    expect(html).toContain("stat-value");
    expect(html).toContain("42");
    expect(html).toContain("Total users");
    expect(html).toContain("%");
  });

  it("renders bar metrics as proportional bars", () => {
    const html = renderDashboard([
      metric({
        display: "bar",
        rows: [
          { segment: "A", count: 10 },
          { segment: "B", count: 5 }
        ]
      })
    ]);
    expect(html).toContain("bar-fill");
    expect(html).toContain("A");
  });

  it("renders line metrics as an svg sparkline", () => {
    const html = renderDashboard([
      metric({
        display: "line",
        rows: [
          { day: "2026-05-01", n: 1 },
          { day: "2026-05-02", n: 4 }
        ]
      })
    ]);
    expect(html).toContain("<svg");
    expect(html).toContain("polyline");
  });

  it("renders table metrics as an html table", () => {
    const html = renderDashboard([metric({ display: "table", rows: [{ status: "ok", n: 3 }] })]);
    expect(html).toContain("<table");
    expect(html).toContain("Status");
  });

  it("renders null values as an em dash rather than the string 'null'", () => {
    const html = renderDashboard([metric({ display: "value", rows: [{ completion_rate: null }] })]);
    expect(html).toContain("—");
    expect(html).not.toContain(">null<");
  });

  it("shows a not-collected state when there is no snapshot", () => {
    const html = renderDashboard([metric({ generatedAt: null, rowCount: 0, rows: [] })]);
    expect(html).toContain("Not collected yet");
  });

  it("shows a no-data state when only placeholder rows exist", () => {
    const html = renderDashboard([metric({ display: "value", rows: [{ is_placeholder: true }] })]);
    expect(html).toContain("No data yet");
  });

  it("surfaces a query error", () => {
    const html = renderDashboard([metric({ error: "boom" })]);
    expect(html).toContain("Query failed");
    expect(html).toContain("boom");
  });

  it("escapes html in titles", () => {
    const html = renderDashboard([metric({ title: "<script>alert(1)</script>" })]);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
