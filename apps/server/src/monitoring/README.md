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

## Dashboard

A separate, read-only Fastify process (`src/monitoring-server`, run with
`pnpm --filter @femi/server start:monitoring`) serves the dashboard from the
latest snapshots — it never runs SQL on request:

- `GET /api/metrics` — JSON: every configured metric with `title`, `display`,
  `generatedAt`, `rowCount`, and `rows` (the latest snapshot, or `null`/empty if
  not collected yet).
- `GET /` — a server-rendered HTML page (inline CSS, no client framework or chart
  library). Each metric renders by its `display` type: `value` → stat cards,
  `bar` → proportional bars, `line` → an inline SVG sparkline, `table` → a table.
  Empty, not-yet-collected, and query-error states are shown explicitly.

Because the page is driven entirely by the config + snapshots, **adding a metric
to `config.ts` makes it appear on the dashboard with no UI code changes.**

It binds to `127.0.0.1` by default; keeping it off the public internet is wired
up in TASK-36.3.

## Database access

Metric queries run on a **read-only** connection (`MONITORING_DATABASE_URL`,
falling back to `DATABASE_URL` in local dev) so monitoring can never mutate
product data. Only the snapshot insert uses the writable connection.

## Environment

| Variable                    | Default        | Purpose                                                          |
| --------------------------- | -------------- | ---------------------------------------------------------------- |
| `MONITORING_ENABLED`        | `true`         | Set `false` to disable collection in the worker                  |
| `MONITORING_DATABASE_URL`   | `DATABASE_URL` | Read-only DSN used to execute metric queries                     |
| `MONITORING_PORT`           | `3002`         | Port the dashboard server listens on                             |
| `MONITORING_HOST`           | `127.0.0.1`    | Bind address (localhost-only by default)                         |
| `MONITORING_RETENTION_DAYS` | `30`           | Worker prunes snapshots older than this (latest per metric kept) |

The worker prunes `metric_snapshots` older than `MONITORING_RETENTION_DAYS` after
each collection, always keeping the latest snapshot per metric.
