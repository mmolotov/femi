import type { Database } from "@femi/db";
import { sql } from "drizzle-orm";

import { loadMetrics, type MetricDefinition } from "./config.js";

export type DashboardMetric = {
  id: string;
  title: string;
  display: MetricDefinition["display"];
  generatedAt: string | null;
  rowCount: number;
  rows: unknown[];
  error: string | null;
};

type LatestSnapshotRow = {
  metric_id: string;
  generated_at: Date;
  rows: unknown;
  row_count: number;
  error: string | null;
};

// Latest snapshot per metric, joined onto the configured metric metadata. Metrics
// the scheduler hasn't run yet come back with generatedAt=null and no rows so the
// UI can show an explicit "no data yet" state.
export async function getDashboardMetrics(
  db: Database,
  metrics: MetricDefinition[] = loadMetrics()
): Promise<DashboardMetric[]> {
  const result = await db.execute(sql`
    select distinct on (metric_id) metric_id, generated_at, rows, row_count, error
    from metric_snapshots
    order by metric_id, generated_at desc
  `);

  const latest = new Map<string, LatestSnapshotRow>();
  for (const row of result.rows as unknown as LatestSnapshotRow[]) {
    latest.set(row.metric_id, row);
  }

  return metrics.map((metric) => {
    const snapshot = latest.get(metric.id);

    return {
      id: metric.id,
      title: metric.title,
      display: metric.display,
      generatedAt: snapshot ? new Date(snapshot.generated_at).toISOString() : null,
      rowCount: snapshot?.row_count ?? 0,
      rows: Array.isArray(snapshot?.rows) ? snapshot.rows : [],
      error: snapshot?.error ?? null
    };
  });
}
