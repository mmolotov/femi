# femi

Telegram Mini App for simple cycle and symptom tracking.

## Docs

- [Disclaimer](./disclaimer.md)
- [Product Roadmap](./product-roadmap.md)
- [Architecture](./architecture.md)

## Foundation Scope

The current implementation targets `Milestone 0: Foundation`:

- monorepo workspace
- web app shell
- backend API foundation
- Telegram bot webhook integration
- PostgreSQL schema and migrations
- Docker Compose deployment
- Caddy reverse proxy
- backup container scaffold

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

## E2E Notes

`pnpm test:e2e` expects the frontend to be running locally at `http://127.0.0.1:4173`.

## Container Setup

### 1. Prepare environment

```bash
cp .env.example .env
```

Set at least these values in `.env`:

- `BOT_TOKEN`
- `TELEGRAM_BOT_SECRET_TOKEN`
- `WEB_APP_URL`
- `TELEGRAM_WEBHOOK_URL`

For Docker Compose, `WEB_APP_URL` should match the public URL served by Caddy, for example:

```env
WEB_APP_URL=https://your-domain.example
TELEGRAM_WEBHOOK_URL=https://your-domain.example/telegram/webhook
```

### 2. Build and start the full stack

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
- `caddy`

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
