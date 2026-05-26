import { type Database, type Pool, metricSnapshots } from "@femi/db";

import type { MetricDefinition } from "./config.js";

type MetricRunResult = {
  metricId: string;
  rows: unknown[];
  rowCount: number;
  durationMs: number;
  error: string | null;
};

// Execute a metric's query on the read-only pool. A failing query does not throw:
// it returns an error result so the failure is recorded as a snapshot and one bad
// metric never blocks the others.
export async function runMetric(
  readPool: Pool,
  metric: MetricDefinition
): Promise<MetricRunResult> {
  const startedAt = Date.now();
  const client = await readPool.connect();

  try {
    const result = await client.query(metric.sql);

    return {
      metricId: metric.id,
      rows: result.rows,
      rowCount: result.rowCount ?? result.rows.length,
      durationMs: Date.now() - startedAt,
      error: null
    };
  } catch (error) {
    return {
      metricId: metric.id,
      rows: [],
      rowCount: 0,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    client.release();
  }
}

// Persist a run as one snapshot row via the writable connection.
export async function persistSnapshot(db: Database, result: MetricRunResult): Promise<void> {
  await db.insert(metricSnapshots).values({
    metricId: result.metricId,
    rows: result.rows,
    rowCount: result.rowCount,
    durationMs: result.durationMs,
    error: result.error
  });
}
