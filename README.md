# femi

Telegram Mini App for simple cycle and symptom tracking.

Current functionality:

- onboarding for first-time users
- current cycle summary and next-period prediction
- period start/end and flow-intensity logging
- daily check-ins with symptom tags
- calendar and history screens
- Telegram auth bootstrap and browser preview mode
- backend API, PostgreSQL schema, migrations, and worker
- Docker Compose deployment, backups, CI, and CodeQL

See [disclaimer.md](./disclaimer.md) for the non-medical product and data-handling notice.

## Prerequisites

- `Node.js 24`
- `corepack` (run `corepack enable` once)
- `Docker` with `docker compose`

## Quality tooling

`pnpm validate` runs the full pre-commit suite (the same checks as CI, in order):
`format:check` → `lint` → `lint:styles` → `typecheck` → `test:coverage` → `analyze` → `build`.
Auto-fixers: `pnpm format`, `pnpm lint:fix`, `pnpm lint:styles:fix`.

## Local development

### 1. Environment

```bash
cp .env.example .env
```

Set `BOT_TOKEN` and `TELEGRAM_BOT_SECRET_TOKEN`; optionally `TELEGRAM_WEBHOOK_URL` to test
webhook registration against a public URL. Keep the local defaults
`WEB_APP_URL=http://localhost:5173` and `DATABASE_URL=postgres://femi:femi@localhost:5432/femi`.

### 2. Install

```bash
corepack enable
pnpm install
```

### 3. Run

Two workflows. Both keep data in the `femi_postgres_data` volume — stopping never passes
`-v`, so data survives restarts; wipe it only by removing the volume by hand.

**Everything in Docker** (db, migrate, server, worker, monitoring, web; migrations run automatically):

```bash
pnpm stack:up     # build + start the whole stack
pnpm stack:down   # stop, keeping the data volume
```

**Database in Docker, app with hot reload** (for active development):

```bash
pnpm db:up        # start Postgres, wait until healthy, run migrations
pnpm dev:all      # server + worker + monitoring (Ctrl+C stops all)
pnpm dev:web      # frontend, in another terminal
pnpm db:down      # stop Postgres when done, keeping data
```

### Endpoints

- frontend: `http://localhost:5173` — served over **HTTPS** when local dev certs exist at `apps/web/certs/femi.local.*`
- backend health: `http://localhost:3001/api/health`
- monitoring dashboard: `http://127.0.0.1:3002/` (loopback only)

Vite proxies `/api` and `/telegram` to `http://localhost:3001` by default; override with
`VITE_BACKEND_URL` if the backend runs elsewhere.

## E2E tests

`pnpm test:e2e` builds the frontend and serves a preview at `http://127.0.0.1:4173`. The
happy-path scenario uses browser demo mode (`/?app_demo=1`), so no live Telegram session is
needed. Install the browser once on a fresh machine:

```bash
pnpm exec playwright install chromium
```

## Deployment

`femi` runs as its own Compose stack in `/opt/femi` behind the shared Caddy ingress from
`/opt/infra`. The stack does not publish `80/443` itself: the `web` service advertises its
public routes to the shared `caddy-docker-proxy`, and `/api/*` and `/telegram/*` are forwarded
to `server` over the shared `edge` network. Use `docker-compose.prod.yml` only where that
ingress layer already exists.

### 1. Environment

```bash
cp .env.example .env
```

Set at least:

```env
APP_DOMAIN=femi.your-domain.example
EDGE_NETWORK_NAME=edge                    # must match the external network from /opt/infra
POSTGRES_VOLUME_NAME=femi-postgres-data   # pre-created external volume (see step 2)
BOT_TOKEN=...
TELEGRAM_BOT_SECRET_TOKEN=...
WEB_APP_URL=https://femi.your-domain.example
TELEGRAM_WEBHOOK_URL=https://femi.your-domain.example/telegram/webhook
```

### 2. Create the production Postgres volume once

```bash
docker volume create femi-postgres-data
```

The prod override treats this volume as external, so an accidental `down -v` on the app stack
will not delete production data.

### 3. Start the stack

```bash
docker compose -f infrastructure/docker-compose.yml -f infrastructure/docker-compose.prod.yml up -d --build
```

This starts `postgres`, `migrate` (once, before the rest), `server`, `worker`, `monitoring`,
`web`, and `backup`. The same `-f … -f …` prefix applies to the other operations:

- status / logs: `docker compose -f … -f … ps` / `logs -f server`
- rebuild after dependency or Dockerfile changes: `… build --no-cache` then `… up -d`
- stop: `… down` — **never** `down -v` in production (that deletes data)

### 4. Verify through the public domain

```bash
curl -I https://femi.your-domain.example/           # expect 200
curl -I https://femi.your-domain.example/api/health # expect 200
```

### GitHub deploy workflow

[`deploy-femi.yml`](./.github/workflows/deploy-femi.yml) deploys only `/opt/femi`: it runs
`pnpm validate`, connects over SSH, takes a one-shot pre-deploy database backup to object
storage, updates the checkout, runs the prod Compose command above, and checks `/api/health`.
It never touches shared ingress in `/opt/infra`.

Triggers: push to `main`, or manual `workflow_dispatch` with an optional `ref`.

Required GitHub secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`
(output of `ssh-keyscan -H <host>`); optional `DEPLOY_SSH_PORT` (default `22`).

Server-side prerequisites: `/opt/femi` is a clean Git checkout with a populated `.env`; the
deploy user can run `git` and `docker compose` there; `/opt/infra` and the shared `edge`
network are up. The pre-deploy backup needs valid `S3_BACKUP_*` values in `.env`.

## Backups

The always-on `backup` service runs a cron scheduler (`BACKUP_CRON_SCHEDULE`, default
`"0 3 * * *"`) that invokes `infrastructure/backup/backup-once.sh` with the `scheduled` scope.
Deploy-time pre-deploy and compensating post-deploy backups use the same primitive and do not
depend on the scheduler.

### Restore

`infrastructure/backup/restore-backup.sh` is intentionally explicit and requires
`DATABASE_URL`, `S3_BACKUP_*`, `BACKUP_OBJECT_KEY`, and `CONFIRM_RESTORE=restore-femi`:

```bash
export DATABASE_URL=postgres://femi:femi@localhost:5432/femi_restore
export S3_BACKUP_ENDPOINT=https://your-s3-endpoint.example
export S3_BACKUP_BUCKET=femi-backups
export S3_BACKUP_REGION=us-east-1
export S3_BACKUP_ACCESS_KEY=replace-me
export S3_BACKUP_SECRET_KEY=replace-me
export BACKUP_OBJECT_KEY=femi-20260328T040000Z.sql.gz
export CONFIRM_RESTORE=restore-femi

./infrastructure/backup/restore-backup.sh
```

Restore into a separate database (not live production), verify core tables (`users`,
`user_settings`, `cycles`) exist, and only then promote the data.

## Monitoring

Lightweight, config-driven internal monitoring on the existing stack — no BI dependency tree,
nothing on the public web:

- **Collection** — the worker runs each metric's SQL on its interval over a **read-only**
  connection and writes the result to the `metric_snapshots` table.
- **Dashboard** — a separate `monitoring` process serves `GET /api/metrics` (latest snapshot
  per metric, as JSON) and `GET /` (a server-rendered HTML dashboard). It never runs SQL on
  request.

### Adding a metric

Metrics live in [`apps/server/src/monitoring/config.ts`](./apps/server/src/monitoring/config.ts)
(SQL in `queries.ts`). Add the SQL as an exported constant, then append an entry to
`metricDefinitions`:

| Field          | Meaning                                             |
| -------------- | --------------------------------------------------- |
| `id`           | stable, unique snake_case key (used as `metric_id`) |
| `title`        | label shown in the UI                               |
| `display`      | `value` \| `bar` \| `line` \| `table`               |
| `everyMinutes` | re-run interval                                     |
| `sql`          | the read-only query (from `queries.ts`)             |

The config is validated on load — malformed or duplicate entries fail fast at worker startup.
A new metric then flows through the scheduler, snapshots, API, and dashboard with no other
code changes.

### Read-only database role

Metric queries should run as a least-privilege role. Provision it with the idempotent script
(run after migrations, against an admin connection):

```bash
MONITORING_DB_USER=monitoring_femi_readonly \
MONITORING_DB_PASSWORD='…' \
POSTGRES_DB=femi POSTGRES_USER=femi POSTGRES_PASSWORD='…' \
infrastructure/postgres/create-monitoring-readonly-user.sh
```

It grants `SELECT` on the product tables plus `metric_snapshots` (created by migration `0003`,
so run it afterwards). `DB_OWNER_ROLE` defaults to `POSTGRES_USER` and must be the role that
runs migrations, so `ALTER DEFAULT PRIVILEGES` covers future tables. Point the service at the
role with `MONITORING_DATABASE_URL` (falls back to `DATABASE_URL` if unset). Either way the
collector forces `default_transaction_read_only=on` per session, so a query can never write —
the dedicated role is defense-in-depth.

### Access (internal only)

The dashboard has **no application auth**; access is network-level only. The `monitoring`
service joins only the internal Compose network (never the public `edge`/Caddy ingress) and
binds to host loopback (`127.0.0.1:${MONITORING_PORT:-3002}`), like PostgreSQL. Reach it over
an SSH tunnel — do not bind it to a public interface:

```bash
ssh -L 3002:127.0.0.1:3002 <deploy-user>@<vps-host>
# then open http://localhost:3002
```

`MONITORING_ENABLED=false` disables **collection** only; the dashboard keeps serving the
last-collected (increasingly stale) snapshots until its service is stopped.

### Environment

| Variable                    | Default        | Purpose                                                               |
| --------------------------- | -------------- | --------------------------------------------------------------------- |
| `MONITORING_ENABLED`        | `true`         | Set `false` to disable collection in the worker                       |
| `MONITORING_DATABASE_URL`   | `DATABASE_URL` | Read-only DSN used to execute metric queries                          |
| `MONITORING_PORT`           | `3002`         | Dashboard port (host loopback + container)                            |
| `MONITORING_HOST`           | `127.0.0.1`    | Dashboard bind address (set `0.0.0.0` in Docker)                      |
| `MONITORING_RETENTION_DAYS` | `30`           | Prune snapshots older than this; the latest per metric is always kept |

After each collection the worker prunes `metric_snapshots` older than
`MONITORING_RETENTION_DAYS`, always keeping the most recent snapshot per metric so a
rarely-collected metric never disappears from the dashboard.
