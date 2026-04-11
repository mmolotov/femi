# femi

Telegram Mini App for simple cycle and symptom tracking.

## Docs

- [Disclaimer](./disclaimer.md)
- [Product Roadmap](./product-roadmap.md)
- [Architecture](./architecture.md)

## Current Scope

The current implementation targets `Milestone 1: Core Cycle Tracking MVP`:

- onboarding flow for first-time users
- current cycle summary and next-period prediction
- period start and end logging
- flow intensity logging
- daily check-ins with symptom tags
- calendar and history screens
- Telegram auth bootstrap and browser preview mode
- backend API, PostgreSQL schema, migrations, and worker foundation
- Docker Compose deployment, backups, CI, and CodeQL

## Quality Tooling

- `pnpm lint`
- `pnpm lint:fix`
- `pnpm format`
- `pnpm format:check`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:coverage`
- `pnpm analyze`
- `pnpm validate`

## Local Setup

### Prerequisites

- `Node.js 24`
- `corepack`
- `Docker` with `docker compose`

### 1. Prepare environment

```bash
cp .env.example .env
```

Update `.env` with real values where needed:

- `BOT_TOKEN`
- `TELEGRAM_BOT_SECRET_TOKEN`
- optionally `TELEGRAM_WEBHOOK_URL` if you want to test webhook registration against a public URL

For local development, keep:

- `WEB_APP_URL=http://localhost:5173`
- `DATABASE_URL=postgres://femi:femi@localhost:5432/femi`

If you use the repository Compose file locally, make sure the shared ingress network name
from `EDGE_NETWORK_NAME` exists first. For a default setup, create it once:

```bash
docker network create edge
```

### 2. Enable pnpm and install dependencies

```bash
corepack enable
pnpm install
```

### 3. Start PostgreSQL

```bash
docker compose -f infrastructure/docker-compose.yml up -d postgres
```

This publishes PostgreSQL to `127.0.0.1:5432` for local development only.

### 4. Apply database migrations

```bash
pnpm db:migrate
```

### 5. Start the backend

```bash
pnpm dev:server
```

Optional: run the worker in another terminal:

```bash
pnpm dev:worker
```

### 6. Start the frontend

In another terminal:

```bash
pnpm dev:web
```

### 7. Open the app

- frontend: `http://localhost:5173`
- backend health: `http://localhost:3001/api/health`

Local Vite development now proxies `/api` and `/telegram` to `http://localhost:3001` by default.

If you need a different backend target in local development, set:

```bash
VITE_BACKEND_URL=http://localhost:3001
```

## E2E Notes

`pnpm test:e2e` builds the frontend and starts a local preview server at `http://127.0.0.1:4173`.

Install the browser runtime once on a fresh machine:

```bash
pnpm exec playwright install chromium
```

The Playwright happy-path scenario uses browser demo mode:

- `/?app_demo=1`

This keeps the end-to-end flow testable without a live Telegram session.

## Server Deployment

The server deployment model assumes:

- shared ingress is already running from `/opt/infra`
- the shared Docker network from `infra` already exists, usually `edge`
- `femi` is deployed as its own stack in `/opt/femi`

The `femi` Compose stack no longer publishes ports `80/443` itself. Instead, the `web`
service advertises the public routes to the shared `caddy-docker-proxy`, and requests for
`/api/*` and `/telegram/*` are forwarded to the `server` container across the shared network.

### 1. Prepare environment

```bash
cp .env.example .env
```

Set at least these values in `.env`:

- `APP_DOMAIN`
- `EDGE_NETWORK_NAME`
- `BOT_TOKEN`
- `TELEGRAM_BOT_SECRET_TOKEN`
- `WEB_APP_URL`
- `TELEGRAM_WEBHOOK_URL`

Recommended production values:

```env
APP_DOMAIN=femi.your-domain.example
EDGE_NETWORK_NAME=edge
WEB_APP_URL=https://femi.your-domain.example
TELEGRAM_WEBHOOK_URL=https://femi.your-domain.example/telegram/webhook
```

`EDGE_NETWORK_NAME` must match the external network created by `/opt/infra`.

### 2. Build and start the app stack

```bash
docker compose -f infrastructure/docker-compose.yml up --build
```

The stack starts these services:

- `postgres`
- `migrate`
- `server`
- `worker`
- `web`
- `backup`

The `migrate` service runs once before `server` and `worker`.

### 3. Run in background

```bash
docker compose -f infrastructure/docker-compose.yml up -d --build
```

### 4. Stop the stack

```bash
docker compose -f infrastructure/docker-compose.yml down
```

### 5. Rebuild after dependency or Dockerfile changes

```bash
docker compose -f infrastructure/docker-compose.yml build --no-cache
docker compose -f infrastructure/docker-compose.yml up
```

### 6. Verify through the public domain

```bash
docker compose -f infrastructure/docker-compose.yml ps
docker compose -f infrastructure/docker-compose.yml logs -f server
curl -I https://femi.your-domain.example/
curl -I https://femi.your-domain.example/api/health
```

Expected result:

- `https://femi.your-domain.example/` returns `200`
- `https://femi.your-domain.example/api/health` returns `200`
- server logs show successful startup and, when configured, Telegram webhook registration

## GitHub Deploy Workflow

The repository includes a deployment workflow at
[`deploy-femi.yml`](./.github/workflows/deploy-femi.yml).

It is intentionally scoped only to `/opt/femi`:

- runs `pnpm validate` on GitHub-hosted runners
- connects to the VPS over `SSH`
- updates the checkout in `/opt/femi`
- runs `docker compose -f infrastructure/docker-compose.yml up -d --build`
- checks `https://$APP_DOMAIN/api/health`

It does not deploy or modify `/opt/infra`.

### Required GitHub secrets

- `DEPLOY_HOST` — VPS hostname or IP
- `DEPLOY_USER` — deploy user with access to `/opt/femi` and Docker
- `DEPLOY_SSH_KEY` — private SSH key for that user
- `DEPLOY_KNOWN_HOSTS` — output of `ssh-keyscan` for the VPS
- optional `DEPLOY_SSH_PORT` — custom SSH port, default is `22`

### Required server-side preparation

- `/opt/femi` already exists as a Git checkout of this repository
- `/opt/femi/.env` already exists and contains production values
- the deploy user can run `git` and `docker compose` in `/opt/femi`
- `/opt/infra` and the shared `edge` ingress network are already up
- the `/opt/femi` checkout stays clean between deploys; uncommitted server-side edits will block deployment

### Triggers

- automatic deploy on push to `main`
- manual deploy from `workflow_dispatch`, with an optional `ref` input

### Prepare `DEPLOY_KNOWN_HOSTS`

From a trusted machine, collect the host key:

```bash
ssh-keyscan -H your-server.example.com
```

Store the output as the `DEPLOY_KNOWN_HOSTS` GitHub secret.

## Backup Restore

The repository includes a restore script at `infrastructure/backup/restore-backup.sh`.

Restore is intentionally explicit and requires:

- `DATABASE_URL`
- `S3_BACKUP_BUCKET`
- `S3_BACKUP_ENDPOINT`
- `S3_BACKUP_REGION`
- `S3_BACKUP_ACCESS_KEY`
- `S3_BACKUP_SECRET_KEY`
- `BACKUP_OBJECT_KEY`
- `CONFIRM_RESTORE=restore-femi`

Example:

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

Recommended restore flow:

1. Restore into a separate database, not the live production database.
2. Verify that core tables such as `users`, `user_settings`, and `cycles` exist.
3. Only then promote or copy data as part of an explicit recovery procedure.
