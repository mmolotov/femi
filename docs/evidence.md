# Evidence Integration

This project is designed to feed an Evidence analytics app running in the
shared infra layer rather than embedding analytics into the `femi` app stack.

The first phase intentionally uses raw product tables and aggregate queries
directly. Do not add analytics views or materialized views yet.

Evidence is a code-driven analytics app rather than a shared self-service BI
runtime. For that reason, the recommended default is:

- one Evidence app per product
- shared infra patterns across products
- separate Evidence content/codebases for `femi`, `pina`, and future apps

## Recommended Architecture

For `femi`, the recommended topology is:

1. `femi` stays deployed in `/opt/femi`
2. an Evidence analytics app for `femi` lives in the shared infra layer
3. the Evidence app connects to `femi` PostgreSQL with a dedicated read-only user
4. Evidence builds dashboards from SQL and markdown, then serves the generated site

This keeps:

- product lifecycle separate from analytics lifecycle
- analytics changes out of the user-facing app deployment
- dashboard code scoped to one product instead of mixing `femi` and `pina` logic

## Multi-App Guidance

Although a single Evidence app can technically query multiple data sources, the
recommended default for this codebase is **not** one shared monolithic Evidence
site for every product.

Prefer this layout:

- `evidence-femi`
- `evidence-pina`
- optional shared analytics landing page in infra that links to each app

Why:

- each product keeps its own dashboard logic, SQL, and release cadence
- one product's analytics changes do not risk another product's dashboards
- the single developer/analyst workflow stays simpler and more explicit

Use one shared multi-product Evidence app only if there is a strong reason to
build a unified cross-product analytics portal.

## Connectivity From Infra To Femi PostgreSQL

`femi` publishes PostgreSQL only on the host loopback interface:

- host: `127.0.0.1`
- port: `${POSTGRES_PORT}`

That means the database is reachable from the VPS itself, but is not publicly
reachable from the Internet.

For an infra-hosted Evidence app, the recommended connection path is:

1. keep `femi` PostgreSQL bound to `127.0.0.1:${POSTGRES_PORT}`
2. if the Evidence build/runtime runs in a container, add Docker host-gateway access:

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

3. connect to PostgreSQL with:
   - host: `host.docker.internal` from a containerized Evidence build/runtime
   - host: `127.0.0.1` if Evidence build runs directly on the VPS host
   - port: `${POSTGRES_PORT}`
   - database: `${POSTGRES_DB}`
   - username: `${EVIDENCE_DB_USER}`
   - password: `${EVIDENCE_DB_PASSWORD}`

This keeps PostgreSQL private while still allowing an infra-hosted analytics app
to query it.

## Create The Read-Only Evidence User

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

The script is idempotent and does all of the following:

- creates the Evidence role if it does not exist yet
- rotates the password if the role already exists
- grants `CONNECT` on the `femi` database
- grants `USAGE` on schema `public`
- grants `SELECT` on the current raw tables
- grants default `SELECT` access on future tables created by the application DB owner

## Raw Tables In Scope

The initial Evidence setup should read directly from these raw tables:

- `users`
- `user_settings`
- `cycles`
- `period_logs`
- `daily_checkins`
- `symptom_logs`
- `notes`
- `reminders`
- `notification_jobs`
- `contraception_logs`

## First Dashboard Questions

The first Evidence dashboard should answer these product questions directly from
raw data and aggregate queries:

- total registered users
- new users by day and by week
- onboarding completion rate
- users with at least one `period_log`
- users with at least one `daily_checkin`
- users active today / 7d / 30d
- users who track only periods versus users who also fill richer data
- daily check-in field fill rates for:
  - `mood`
  - `energy`
  - `pain_level`
  - `sleep_quality`
  - `discharge`
  - `note`
- reminder adoption:
  - users with reminders enabled
  - notification jobs by status

## First-Phase Delivery Plan

The recommended first phase is:

1. create the dedicated read-only DB user for Evidence
2. stand up a separate infra-hosted `evidence-femi` app
3. connect it to raw `femi` PostgreSQL tables
4. implement the first KPI/report pages with aggregate SQL
5. only after the questions stabilize, consider adding an `analytics` layer

At the data-access level, this still uses the same core primitives:

- private PostgreSQL connectivity
- a dedicated read-only database user
- raw-table aggregate queries in the first phase

At the app architecture level, Evidence should usually be treated as a product-
specific analytics codebase, not a single shared BI service with many apps
plugged into it.
