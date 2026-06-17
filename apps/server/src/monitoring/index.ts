import { type Database, type Pool, metricSnapshots } from "@femi/db";
import { sql } from "drizzle-orm";

import { loadMetrics, type MetricDefinition } from "./config.js";
import { persistSnapshot, runMetric } from "./runner.js";
import { isMetricDue } from "./scheduler.js";

type MonitoringTickResult = {
  ran: string[];
  skipped: string[];
  failed: string[];
  errors: { metricId: string; message: string }[];
};

// Latest snapshot time per metric, so the scheduler knows what is due.
async function lastGeneratedByMetric(db: Database): Promise<Map<string, Date>> {
  const rows = await db
    .select({
      metricId: metricSnapshots.metricId,
      // Drizzle applies its timestamp→Date column mapping only to direct column
      // selects, not to a raw `max(...)` aggregate, so node-postgres returns this
      // as a string (e.g. "2026-05-27 13:57:28.64+00"). Coerce it below, otherwise
      // isMetricDue throws "lastGeneratedAt.getTime is not a function".
      lastGeneratedAt: sql<string>`max(${metricSnapshots.generatedAt})`
    })
    .from(metricSnapshots)
    .groupBy(metricSnapshots.metricId);

  return new Map(rows.map((row) => [row.metricId, new Date(row.lastGeneratedAt)]));
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
  const errors: { metricId: string; message: string }[] = [];

  for (const metric of metrics) {
    if (!isMetricDue(metric, lastByMetric.get(metric.id) ?? null, now)) {
      skipped.push(metric.id);
      continue;
    }

    // Isolate each metric: a failed snapshot write must not abort the rest of the tick.
    try {
      const result = await runMetric(readPool, metric);
      await persistSnapshot(db, result);

      if (result.error) {
        failed.push(metric.id);
        errors.push({ metricId: metric.id, message: result.error });
      } else {
        ran.push(metric.id);
      }
    } catch (error) {
      failed.push(metric.id);
      errors.push({
        metricId: metric.id,
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return { ran, skipped, failed, errors };
}
