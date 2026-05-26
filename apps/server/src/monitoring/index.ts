import { type Database, type Pool, metricSnapshots } from "@femi/db";
import { sql } from "drizzle-orm";

import { loadMetrics, type MetricDefinition } from "./config.js";
import { persistSnapshot, runMetric } from "./runner.js";
import { isMetricDue } from "./scheduler.js";

type MonitoringTickResult = {
  ran: string[];
  skipped: string[];
  failed: string[];
};

// Latest snapshot time per metric, so the scheduler knows what is due.
async function lastGeneratedByMetric(db: Database): Promise<Map<string, Date>> {
  const rows = await db
    .select({
      metricId: metricSnapshots.metricId,
      lastGeneratedAt: sql<Date>`max(${metricSnapshots.generatedAt})`
    })
    .from(metricSnapshots)
    .groupBy(metricSnapshots.metricId);

  return new Map(rows.map((row) => [row.metricId, row.lastGeneratedAt]));
}

// One scheduling pass: run every metric whose interval has elapsed and persist a
// snapshot for each. Reads run on the read-only pool; snapshots are written via
// the writable `db`. Safe to call on every worker tick — non-due metrics are skipped.
export async function runMonitoringTick(
  db: Database,
  readPool: Pool,
  now: Date = new Date(),
  metrics: MetricDefinition[] = loadMetrics()
): Promise<MonitoringTickResult> {
  const lastByMetric = await lastGeneratedByMetric(db);
  const ran: string[] = [];
  const skipped: string[] = [];
  const failed: string[] = [];

  for (const metric of metrics) {
    if (!isMetricDue(metric, lastByMetric.get(metric.id) ?? null, now)) {
      skipped.push(metric.id);
      continue;
    }

    const result = await runMetric(readPool, metric);
    await persistSnapshot(db, result);

    if (result.error) {
      failed.push(metric.id);
    } else {
      ran.push(metric.id);
    }
  }

  return { ran, skipped, failed };
}
