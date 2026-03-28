# Architecture

## Purpose

This document defines the target architecture for the `femi` Telegram Mini App MVP

## Decision Summary

We will start with a single VPS deployment and keep the architecture intentionally boring:

- one server
- Docker Compose for service orchestration
- Caddy for HTTPS and reverse proxy
- one Node.js backend codebase, split into `server` and `worker` processes
- PostgreSQL as the primary database
- React + Vite for the Telegram Mini App frontend
- shared TypeScript types and validation schemas across the stack

This setup minimizes recurring cost while keeping a clean migration path to a future `2 VPS` layout where PostgreSQL can be moved to a dedicated host.

## Version Baseline

Version baseline as of **2026-03-28**:

### Infrastructure Stack

| Component       | Version Policy                                                            | Chosen Version                          |
| --------------- | ------------------------------------------------------------------------- | --------------------------------------- |
| OS              | latest Ubuntu LTS                                                         | `Ubuntu Server 24.04 LTS`               |
| Node.js runtime | latest Node.js LTS                                                        | `Node.js 24.x Active LTS`               |
| Database        | latest supported stable major, since PostgreSQL does not use LTS branding | `PostgreSQL 18`                         |
| Reverse proxy   | current stable major                                                      | `Caddy 2`                               |
| Containers      | current stable release line supported on Ubuntu 24.04                     | `Docker Engine + Docker Compose plugin` |
| Package manager | current stable major                                                      | `pnpm workspaces`                       |

### Application Stack

| Layer           | Chosen Stack                                                                       |
| --------------- | ---------------------------------------------------------------------------------- |
| Frontend        | `React 19`, `TypeScript 5.9`, `Vite 7`, `React Router`, `@telegram-apps/sdk-react` |
| Backend API     | `Fastify 5`, `TypeScript 5.9`, `Zod`                                               |
| Telegram bot    | `grammY 1.x`                                                                       |
| Database access | `Drizzle ORM` + `node-postgres`                                                    |
| Testing         | `Vitest 4`, `Playwright 1.58`                                                      |
| Styling         | plain CSS for the foundation phase                                                 |

Notes:

- Use the latest patch release inside each selected major line.
- Where a component has no LTS model, pin the current stable major and update patches regularly.
- Keep `Node.js`, `PostgreSQL`, and Ubuntu on supported release lines only.

## High-Level Architecture

```text
Telegram Client
    |
    v
Telegram Mini App WebView
    |
    v
Caddy :443
    |-- /          -> web
    |-- /api/*     -> server
    |-- /telegram/*-> server
    |
    v
Docker network
    |-- web
    |-- server
    |-- worker
    `-- postgres
```

## Deployment Model

All services run on one VPS via Docker Compose.

### Publicly reachable

- `caddy` on ports `80` and `443`

### Internal only

- `web` static container
- `server` container
- `worker` container
- `postgres` container

## Infrastructure Stack

### VPS

Any low-cost VPS provider, this is enough for the MVP.

### Containers

Use a single `docker-compose.yml` with these services:

- `caddy`
- `web`
- `server`
- `worker`
- `postgres`
- optional `backup` job container

### Reverse Proxy

Use `Caddy 2` for:

- automatic HTTPS
- reverse proxying `/api` and Telegram webhook routes to `server`
- serving or proxying the frontend
- simple config and low operational overhead

### Persistent Storage

Persist these volumes:

- PostgreSQL data directory
- Caddy data and config
- export files if temporary local generation is needed

Do not rely on local disk as the only backup location.

## Application Stack

### Frontend

`apps/web`

- `React 19`
- `TypeScript 5.9`
- `Vite 7`
- `React Router`
- `@telegram-apps/sdk-react`
- plain CSS for the foundation phase

Frontend responsibilities:

- render the Telegram Mini App UI
- read Telegram launch parameters
- call backend APIs
- manage local UI state
- support a fast daily check-in flow

The frontend remains a client-rendered SPA. SSR is intentionally not part of the MVP.

### Backend

`apps/server`

- `Node.js 24 LTS`
- `Fastify 5`
- `Zod`
- `Drizzle ORM`
- `grammY`

Backend responsibilities:

- validate Telegram `initData`
- expose REST API for app data
- receive Telegram bot webhook events
- apply business rules
- write to PostgreSQL
- generate exports

### Worker

`apps/server` with a separate process entrypoint

Worker responsibilities:

- reminder scheduling and delivery
- periodic checks for due notifications
- cleanup tasks
- non-request background jobs

The `server` and `worker` use the same codebase and shared database layer, but run as separate processes for operational clarity.

### Database

`packages/db`

- `PostgreSQL 18`
- `Drizzle ORM`
- SQL migrations generated and tracked in-repo

Why PostgreSQL:

- relational model fits cycles, logs, reminders, and notes
- strong consistency and transactions
- easy future scale-up
- avoids an early SQLite-to-Postgres migration

## Repository Layout

```text
/apps
  /web
  /server
/packages
  /db
  /shared
/infrastructure
  docker-compose.yml
  Caddyfile
  /backup
```

### Directory Responsibilities

- `apps/web`: Telegram Mini App frontend
- `apps/server`: API, webhook handling, background worker entrypoints
- `packages/db`: Drizzle schema, migrations, database bootstrap
- `packages/shared`: shared DTOs, Zod schemas, enums, constants
- `infrastructure`: deployment and runtime config

## Service Responsibilities

### `web`

- built as static assets by Vite
- served behind Caddy
- no direct secrets

### `server`

- Fastify HTTP server
- API routes under `/api`
- Telegram webhook routes under `/telegram`
- health endpoint for container monitoring

### `worker`

- scheduled polling loop
- reminder dispatch
- export generation jobs

### `postgres`

- primary relational datastore
- internal Docker network only
- regular dumps to object storage

## Core Data Model

Initial PostgreSQL entities:

- `users`
- `cycles`
- `period_logs`
- `daily_checkins`
- `symptom_logs`
- `notes`
- `reminders`
- `notification_jobs`
- `contraception_logs`

Common column conventions:

- `id` as `uuid`
- `created_at`
- `updated_at`
- nullable fields only where actually needed
- explicit foreign keys
- database constraints for data integrity

## API Design

Use a simple REST API for MVP.

Suggested route groups:

- `/api/auth/*`
- `/api/profile/*`
- `/api/cycles/*`
- `/api/checkins/*`
- `/api/symptoms/*`
- `/api/notes/*`
- `/api/reminders/*`
- `/api/exports/*`

Telegram-specific routes:

- `/telegram/webhook`

## Security Baseline

### Network

- expose only `80`, `443`, and `22`
- keep PostgreSQL private
- enforce host firewall rules

### Secrets

Store secrets only in environment variables or deployment secrets:

- `BOT_TOKEN`
- `DATABASE_URL`
- `TELEGRAM_BOT_SECRET_TOKEN`
- `TELEGRAM_INIT_DATA_SIGNING_SECRET`
- `S3_BACKUP_ACCESS_KEY`
- `S3_BACKUP_SECRET_KEY`

### Application

- validate Telegram `initData` on the server
- never trust Telegram user identity from the frontend alone
- avoid logging health data payloads
- redact tokens and sensitive identifiers in logs

## Backups and Recovery

Backups are mandatory even on a single VPS.

Required backup policy:

- nightly `pg_dump`
- upload to S3-compatible object storage
- retain at least `7-14` daily backups
- create a VPS snapshot before risky releases or database migrations

Recovery requirement:

- document the exact restore procedure
- test restore on a non-production environment before launch

## Observability

MVP observability baseline:

- `/health` endpoint on `server`
- structured application logs
- container restart policy
- alert on failed backups
- alert on repeated worker failures

Do not add a full observability stack at MVP stage unless a real need appears.

## What We Intentionally Exclude

Not part of the initial architecture:

- Kubernetes
- microservices
- Redis
- message brokers
- GraphQL
- SSR
- separate managed database
- separate queue infrastructure
- event sourcing

These would increase complexity faster than they would increase product value.

## Growth Path

This design should evolve in the following order if the project grows:

1. Move `PostgreSQL` to a separate server or managed database.
2. Move `worker` to a separate host if reminder traffic grows.
3. Add object storage for generated exports and files.
4. Add monitoring and alerting beyond logs and health checks.
5. Add read replicas or caching only if measured load requires it.

## Final Recommendation

For the MVP, the fixed stack is:

- Infrastructure: `Ubuntu 24.04 LTS`, `Docker Compose`, `Caddy 2`, `PostgreSQL 18`, `Node.js 24 LTS`
- Application: `React 19`, `TypeScript 5.9`, `Vite 7`, `React Router`, `@telegram-apps/sdk-react`, `Fastify 5`, `grammY 1.x`, `Drizzle ORM`, `Zod`, `Vitest 4`, `Playwright 1.58`

This gives the project a low-cost deployment model, a clean TypeScript-first codebase, and a straightforward path for future separation of services without a rewrite.
