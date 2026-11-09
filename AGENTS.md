<!-- BACKLOG.MD MCP GUIDELINES START -->

<CRITICAL_INSTRUCTION>

## BACKLOG WORKFLOW INSTRUCTIONS

This project uses Backlog.md MCP for all task and project management activities.

**CRITICAL GUIDANCE**

- If your client supports MCP resources, read `backlog://workflow/overview` to understand when and how to use Backlog for this project.
- If your client only supports tools or the above request fails, call `backlog.get_backlog_instructions()` to load the tool-oriented overview. Use the `instruction` selector when you need `task-creation`, `task-execution`, or `task-finalization`.

- **First time working here?** Read the overview resource IMMEDIATELY to learn the workflow
- **Already familiar?** You should have the overview cached ("## Backlog.md Overview (MCP)")
- **When to read it**: BEFORE creating tasks, or when you're unsure whether to track work

These guides cover:

- Decision framework for when to create tasks
- Search-first workflow to avoid duplicates
- Links to detailed guides for task creation, execution, and finalization
- MCP tools reference

You MUST read the overview resource to understand the complete workflow. The information is NOT summarized here.

</CRITICAL_INSTRUCTION>

<!-- BACKLOG.MD MCP GUIDELINES END -->

## Repository map

pnpm workspace monorepo:

- `apps/web` — React 19 + Vite SPA (`@femi/web`); Telegram Mini App with a browser demo mode (`/?app_demo=1`).
- `apps/server` — Fastify API (`@femi/server`); also ships worker (`dev:worker`) and monitoring (`dev:monitoring`) entrypoints.
- `packages/shared` — shared types/validation (zod). Build it first: other packages consume its `dist/`.
- `packages/db` — Drizzle ORM schema + migrations. In docker compose the `migrate` service applies migrations before the server starts.
- `e2e` — Playwright specs. Self-contained: pinned clock (`e2e/fixtures.ts`) + browser demo mode, no backend required.
- `infrastructure` — docker compose (dev + prod), backup image, `deploy/remote.sh` (runs on the production host).
- `scripts` — local stack helpers (`dev.sh`, `stack-up.sh`, `db-up.sh`, …), shellcheck-linted in CI.

## Branches, releases, deploys

- `develop` is the default branch; feature branches merge into it.
- `main` is release-only. Releasing = a PR from `develop` to `main` titled "Release develop to main" (use the `/release` skill).
- **Merging to `main` deploys production automatically** (`.github/workflows/deploy-femi.yml`: pre-deploy DB backup → compose build/up → health check). Never point feature PRs at `main`.

## Local environment

- `pnpm stack:up` / `pnpm stack:down` — full docker stack; `pnpm db:up` / `pnpm db:down` — postgres only.
- `pnpm dev:all` — everything at once; `pnpm dev:web` / `pnpm dev:server` / `pnpm dev:worker` / `pnpm dev:monitoring` — individual watchers. The dev web server runs on https://localhost:5173 (needs local `certs/`) and proxies `/api` to `localhost:3001`.
- `pnpm db:migrate` — apply Drizzle migrations.
- `pnpm test:e2e` — Playwright suite; builds the web app and serves `vite preview` on `127.0.0.1:4173`.

## Pre-commit checks

Run these locally **before every commit** so problems are caught here, not in the CI `Quality` workflow. The list mirrors exactly what CI runs.

Quick path — one command runs the full suite:

```bash
pnpm validate
```

Or run steps individually (same order as CI):

1. `pnpm format:check` — Prettier formatting (auto-fix: `pnpm format`)
2. `pnpm lint` — ESLint (auto-fix: `pnpm lint:fix`)
3. `pnpm lint:styles` — Stylelint for CSS (auto-fix: `pnpm lint:styles:fix`)
4. `pnpm typecheck` — TypeScript across all workspaces
5. `pnpm test:coverage` — Vitest unit tests with coverage
6. `pnpm analyze` — Knip (unused exports / dependencies)
7. `pnpm build` — Full workspace build

CI additionally runs the Playwright e2e suite (`pnpm test:e2e`) — it is not part of `pnpm validate`, so run it locally when you change web flows.

If any step fails, fix it before creating the commit. Do not push and rely on CI to surface issues.
