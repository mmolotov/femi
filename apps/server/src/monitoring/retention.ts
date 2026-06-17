import type { Database } from "@femi/db";
import { sql } from "drizzle-orm";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function retentionCutoff(now: Date, retentionDays: number): Date {
  return new Date(now.getTime() - retentionDays * MS_PER_DAY);
}

// Delete snapshots older than the retention window, but always keep the latest
// snapshot per metric (the `distinct on` set) so the dashboard never goes empty
// for a slow/rarely-collected metric. Returns the number of rows deleted; a no-op
// (nothing eligible / empty table) simply returns 0. Uses the writable connection.
export async function pruneSnapshots(
  db: Database,
  retentionDays: number,
  now: Date = new Date()
): Promise<number> {
  const cutoff = retentionCutoff(now, retentionDays);

  const result = await db.execute(sql`
    delete from metric_snapshots
    where generated_at < ${cutoff.toISOString()}::timestamptz
      and id not in (
        select distinct on (metric_id) id
        from metric_snapshots
        order by metric_id, generated_at desc
      )
  `);

  return result.rowCount ?? 0;
}
