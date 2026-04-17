# Evidence Integration

`femi` now keeps its Evidence source code in this repository under
[`evidence/`](../evidence/). Evidence is used here as a static site generator
for product analytics, while the shared infra layer serves only the generated
files from `/opt/infra/site/evidence/femi`.

The first phase intentionally reads raw product tables directly. Do not add
analytics views or materialized views until the KPI set stabilizes.

## Source Layout

The repository-side layout is:

- `evidence/package.json` — Evidence package and scripts
- `evidence/evidence.config.yaml` — Evidence config and plugin wiring
- `evidence/pages/*.md` — report pages
- `evidence/sources/femi/connection.template.yaml` — committed datasource template
- `evidence/sources/femi/connection.yaml` — generated local datasource config
- `evidence/sources/femi/*.sql` — reusable metric queries

Build artifacts are intentionally excluded from git:

- `evidence/build`
- `evidence/node_modules`
- `evidence/.evidence/template`
- `evidence/.evidence/meta`
- `evidence/static/data`

## Local Development

Install dependencies from the repository root:

```bash
PATH="$HOME/.nvm/versions/node/v24.14.0/bin:$PATH" pnpm install
```

Use Node 24 for local Evidence work. The site is built and deployed with Node 24,
and the current dependency graph is not validated on Node 25.

Set the Evidence connection variables:

```bash
export EVIDENCE_DB_HOST=127.0.0.1
export EVIDENCE_DB_PORT=5432
export EVIDENCE_DB_NAME=femi
export EVIDENCE_DB_USER=evidence_femi_readonly
export EVIDENCE_DB_PASSWORD=replace-me
export EVIDENCE_DB_SSL=false
```

Then refresh sources and run the local preview:

```bash
pnpm evidence:sources
pnpm evidence:dev
```

To produce the static output locally:

```bash
pnpm evidence:build
```

The generated site will be written to `evidence/build`.

## Datasource Contract

Evidence connects to PostgreSQL through a generated datasource file. The
committed template lives in
[`evidence/sources/femi/connection.template.yaml`](../evidence/sources/femi/connection.template.yaml),
and [`evidence/scripts/write-connection-options.mjs`](../evidence/scripts/write-connection-options.mjs)
renders the runtime `connection.yaml` before `sources`, `dev`, and `build`.

Supported environment variables are:

- `EVIDENCE_DB_HOST`
- `EVIDENCE_DB_PORT`
- `EVIDENCE_DB_NAME`
- `EVIDENCE_DB_USER`
- `EVIDENCE_DB_PASSWORD`
- optional `EVIDENCE_DB_SSL`
  - `false` for local plain Postgres
  - `true` for verified TLS
  - `no-verify` for TLS without certificate verification

For local work this will usually point at your local `femi` PostgreSQL instance.
For GitHub Actions deploys, the workflow opens an SSH tunnel to the VPS-local
PostgreSQL port and injects these values for the build step.

The published site is served from a dedicated hostname, so the Evidence config
does not use a SvelteKit `basePath`.

## Read-Only Database User

Use the repeatable setup script in
[`infrastructure/postgres/create-evidence-readonly-user.sh`](../infrastructure/postgres/create-evidence-readonly-user.sh).

Example:

```bash
export POSTGRES_HOST=127.0.0.1
export POSTGRES_PORT=5432
export POSTGRES_DB=femi
export POSTGRES_USER=femi
export POSTGRES_PASSWORD=replace-me
export DB_OWNER_ROLE=femi
export EVIDENCE_DB_USER=evidence_femi_readonly
export EVIDENCE_DB_PASSWORD=replace-me

./infrastructure/postgres/create-evidence-readonly-user.sh
```

The script is idempotent and:

- creates the Evidence role if missing
- rotates the password if the role already exists
- grants `CONNECT` on the `femi` database
- grants `USAGE` on schema `public`
- grants `SELECT` on current raw tables
- grants default `SELECT` access on future tables owned by the app role

## Starter Metrics

The current starter pages are:

- `pages/index.md` — product overview
- `pages/activity.md` — activity and adoption
- `pages/tracking.md` — tracking quality

The corresponding SQL metric files currently cover:

- `overview_totals.sql`
- `new_users_by_day.sql`
- `new_users_by_week.sql`
- `activity_windows.sql`
- `activity_by_day.sql`
- `tracking_mix.sql`
- `daily_checkin_field_completion.sql`
- `top_symptoms_30d.sql`
- `notification_job_statuses.sql`

These are grounded only in tables that exist in the application schema:

- `users`
- `user_settings`
- `period_logs`
- `daily_checkins`
- `symptom_logs`
- `notes`
- `reminders`
- `notification_jobs`
- `contraception_logs`

## GitHub Actions Flows

Two workflows are involved:

- [`deploy-evidence-femi.yml`](../.github/workflows/deploy-evidence-femi.yml)
  This is the user-facing workflow for manual and scheduled Evidence deploys.
- [`publish-evidence-femi.yml`](../.github/workflows/publish-evidence-femi.yml)
  This is the reusable workflow that performs the actual build and publish work.

The main app deploy workflow
[`deploy-femi.yml`](../.github/workflows/deploy-femi.yml) calls the same
reusable Evidence workflow after a successful application deploy.

### Manual and Scheduled Publish

`deploy-evidence-femi.yml` supports:

- `workflow_dispatch` with an optional `ref`
- a daily `schedule` at `30 4 * * *` UTC

### Publish Flow

The reusable workflow:

1. checks out the requested ref
2. installs dependencies on the GitHub runner
3. opens an SSH tunnel to the VPS-local PostgreSQL port
4. builds the Evidence site from the `evidence/` source tree
5. uploads the static output to a temporary directory on the VPS
6. atomically swaps that release into `/opt/infra/site/evidence/femi`

This keeps the site from being left half-synced during repeated runs.

## Required GitHub Secrets

The publish flow reuses the existing deploy SSH secrets:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_KNOWN_HOSTS`
- optional `DEPLOY_SSH_PORT`

It also requires one Evidence-specific secret:

- `EVIDENCE_DB_PASSWORD`

The database user name is read from `/opt/femi/.env` as `EVIDENCE_DB_USER`
(defaulting to `evidence_femi_readonly` if omitted).

## Required Server-Side State

Before Evidence publish works on the VPS:

- `/opt/femi` must exist as a clean checkout of this repository
- `/opt/femi/.env` must contain valid PostgreSQL settings
- `/opt/femi/.env` should contain `EVIDENCE_DB_USER`
- the read-only user password configured on PostgreSQL must match the
  `EVIDENCE_DB_PASSWORD` GitHub secret
- `/opt/infra/site/evidence` must exist and be writable by the deploy user

## Current Gaps

The first Evidence iteration does not implement:

- retention cohorts based on sessions, because there is no session/event table
- subscription or revenue reporting, because the schema has no billing tables
- funnel analysis for onboarding step drop-off, because only the final onboarding
  completion state is stored
