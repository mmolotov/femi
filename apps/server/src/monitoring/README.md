# Monitoring

Lightweight, config-driven internal monitoring that replaces the Evidence
dashboard. The worker runs each configured SQL query on its own interval and
stores the result as a snapshot row in `metric_snapshots`; the dashboard (TASK
36.2) reads the latest snapshot per metric — it never runs SQL on request.

## Pieces

- `config.ts` — the metric config (definitions + validation). **This is the file you edit.**
- `queries.ts` — the SQL, one exported string constant per metric (inlined so the
  `tsc` build needs no asset-copy step).
- `runner.ts` — runs a metric's query on the read-only pool and writes a snapshot.
- `scheduler.ts` — `isMetricDue`: when has an interval elapsed since the last run.
- `index.ts` — `runMonitoringTick`: one scheduling pass, called from the worker.

## Config format

Each entry in `metricDefinitions` (`config.ts`) is one metric:

| Field          | Type                                    | Meaning                                              |
| -------------- | --------------------------------------- | ---------------------------------------------------- |
| `id`           | `string` (snake_case)                   | Stable, unique key; used as `metric_id` in snapshots |
| `title`        | `string`                                | Human label shown in the UI                          |
| `display`      | `"value" \| "bar" \| "line" \| "table"` | How the UI renders the latest snapshot               |
| `everyMinutes` | positive `int`                          | Re-run when this many minutes have elapsed           |
| `sql`          | `string`                                | The read-only query (referenced from `queries.ts`)   |

The config is validated on load (`loadMetrics`): malformed entries and duplicate
ids throw immediately, so a bad config fails fast at worker startup.

> Scheduling is interval-based today (`everyMinutes`). Cron-string schedules are a
> planned extension; the config shape is designed to grow a `cron` field later.

## Adding a metric

1. Add the SQL as a new exported string constant in `queries.ts`.
2. Append an entry to `metricDefinitions` in `config.ts` that references it.

It then flows through the scheduler, snapshots, API, and UI with no other code
changes.

## Database access

Metric queries run on a **read-only** connection (`MONITORING_DATABASE_URL`,
falling back to `DATABASE_URL` in local dev) so monitoring can never mutate
product data. Only the snapshot insert uses the writable connection.

## Environment

| Variable                  | Default        | Purpose                                         |
| ------------------------- | -------------- | ----------------------------------------------- |
| `MONITORING_ENABLED`      | `true`         | Set `false` to disable collection in the worker |
| `MONITORING_DATABASE_URL` | `DATABASE_URL` | Read-only DSN used to execute metric queries    |
