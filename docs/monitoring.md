# Monitoring

Internal, config-driven product monitoring that replaced the Evidence.dev static
site. It runs on the existing stack (Postgres + the `@femi/server` worker and a
small dashboard process) instead of a separate BI build, so there is no heavy
dependency tree and nothing is published to the public web.

## How it works

1. **Collection** — the worker (`start:worker`) runs each metric's SQL on its
   configured interval over a **read-only** connection and writes the result to
   the `metric_snapshots` table.
2. **Dashboard** — the `monitoring` process (`start:monitoring`) serves:
   - `GET /api/metrics` — latest snapshot per metric as JSON;
   - `GET /` — a server-rendered HTML dashboard (no client framework).

Metric definitions live in `apps/server/src/monitoring/config.ts` (SQL in
`queries.ts`). See `apps/server/src/monitoring/README.md` for the config format
and how to add a metric.

## Read-only database role

Metric queries should run as a least-privilege, read-only role. Provision it with
the idempotent script (run against an admin connection):

```bash
MONITORING_DB_USER=monitoring_femi_readonly \
MONITORING_DB_PASSWORD='…' \
POSTGRES_DB=femi POSTGRES_USER=femi POSTGRES_PASSWORD='…' \
infrastructure/postgres/create-monitoring-readonly-user.sh
```

It creates/updates the role and grants `SELECT` on the product tables plus
`metric_snapshots`. Run it **after** migrations (it grants on `metric_snapshots`,
which migration `0003` creates) and with `DB_OWNER_ROLE` set to the role that runs
migrations, so the `ALTER DEFAULT PRIVILEGES` clause covers future tables. Then
point the service at it:

```
MONITORING_DATABASE_URL=postgres://monitoring_femi_readonly:…@127.0.0.1:5432/femi
```

If `MONITORING_DATABASE_URL` is unset the service falls back to `DATABASE_URL`.
Either way, the collector runs metric queries with `default_transaction_read_only=on`
at the session level, so a query can never write regardless of the role — the
dedicated read-only role is defense-in-depth.

## Access (internal only)

The dashboard is **not reachable from the public internet**. In
`infrastructure/docker-compose.yml` the `monitoring` service:

- joins only the internal Compose network — it is **not** added to the public
  `edge` network and has **no** Caddy ingress labels (unlike `web`/`server`);
- publishes its port only on the host loopback
  (`127.0.0.1:${MONITORING_PORT:-3002}`), the same pattern as PostgreSQL.

Reach it from your machine via an SSH tunnel to the VPS:

```bash
ssh -L 3002:127.0.0.1:3002 <deploy-user>@<vps-host>
# then open http://localhost:3002
```

Access control is purely network-level: the dashboard has **no application auth**,
so it must stay bound to loopback and off the public ingress. Do not set
`MONITORING_HOST=0.0.0.0` on a host with a public interface unless a firewall or
private network fronts it.

Note: `MONITORING_ENABLED=false` disables **collection in the worker** only; the
dashboard process keeps running and will show the last-collected (increasingly
stale) snapshots. To take the dashboard down, stop/scale its service.

## Environment

| Variable                    | Default        | Purpose                                                               |
| --------------------------- | -------------- | --------------------------------------------------------------------- |
| `MONITORING_ENABLED`        | `true`         | Set `false` to disable collection in the worker                       |
| `MONITORING_DATABASE_URL`   | `DATABASE_URL` | Read-only DSN used to execute metric queries                          |
| `MONITORING_PORT`           | `3002`         | Dashboard port (host loopback + container)                            |
| `MONITORING_HOST`           | `127.0.0.1`    | Dashboard bind address (set `0.0.0.0` in Docker)                      |
| `MONITORING_RETENTION_DAYS` | `30`           | Prune snapshots older than this; the latest per metric is always kept |

## Retention

`metric_snapshots` would otherwise grow forever (one row per metric per run). After
each collection the worker prunes rows older than `MONITORING_RETENTION_DAYS`,
**always keeping the most recent snapshot per metric** (even if older than the
window) so a slow/rarely-collected metric never disappears from the dashboard.
