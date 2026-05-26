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
`metric_snapshots`. Then point the service at it:

```
MONITORING_DATABASE_URL=postgres://monitoring_femi_readonly:…@127.0.0.1:5432/femi
```

If `MONITORING_DATABASE_URL` is unset the service falls back to `DATABASE_URL`
(fine for local dev).

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

## Environment

| Variable                  | Default        | Purpose                                          |
| ------------------------- | -------------- | ------------------------------------------------ |
| `MONITORING_ENABLED`      | `true`         | Set `false` to disable collection in the worker  |
| `MONITORING_DATABASE_URL` | `DATABASE_URL` | Read-only DSN used to execute metric queries     |
| `MONITORING_PORT`         | `3002`         | Dashboard port (host loopback + container)       |
| `MONITORING_HOST`         | `127.0.0.1`    | Dashboard bind address (set `0.0.0.0` in Docker) |
