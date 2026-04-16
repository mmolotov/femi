# Metabase Integration

This project is designed to be consumed by a Metabase instance running in the
shared infra layer rather than inside the `femi` app stack.

The first phase intentionally uses raw product tables and aggregate queries
directly. Do not add analytics views or materialized views yet.

## Production Contract

- `Metabase` is isolated from `femi` app
- `femi` remains the owner of its own PostgreSQL database and credentials
- Metabase must use a dedicated read-only database user
- `femi` PostgreSQL must not be exposed on a public interface

## Connectivity From Infra To Femi PostgreSQL

`femi` publishes PostgreSQL only on the host loopback interface:

- host: `127.0.0.1`
- port: `${POSTGRES_PORT}`

That means the database is reachable from the VPS itself, but is not publicly
reachable from the Internet.

For an infra-hosted Metabase container, the recommended connection path is:

1. keep `femi` PostgreSQL bound to `127.0.0.1:${POSTGRES_PORT}`
2. in the infra Metabase service, add Docker host-gateway access such as:

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

3. configure the Metabase data source to connect to:
   - host: `host.docker.internal`
   - port: `${POSTGRES_PORT}`
   - database: `${POSTGRES_DB}`
   - username: `${METABASE_DB_USER}`
   - password: `${METABASE_DB_PASSWORD}`

This keeps PostgreSQL private while still allowing a container in the infra
stack to reach it through the local host.

## Create The Read-Only Metabase User

Use the repeatable setup script in
[`infrastructure/postgres/create-metabase-readonly-user.sh`](../infrastructure/postgres/create-metabase-readonly-user.sh).

Example:

```bash
export POSTGRES_HOST=127.0.0.1
export POSTGRES_PORT=5432
export POSTGRES_DB=femi
export POSTGRES_USER=femi
export POSTGRES_PASSWORD=replace-me
export DB_OWNER_ROLE=femi
export METABASE_DB_USER=metabase_femi_readonly
export METABASE_DB_PASSWORD=replace-me

./infrastructure/postgres/create-metabase-readonly-user.sh
```

The script is idempotent and does all of the following:

- creates the Metabase role if it does not exist yet
- rotates the password if the role already exists
- grants `CONNECT` on the `femi` database
- grants `USAGE` on schema `public`
- grants `SELECT` on the current raw tables
- grants default `SELECT` access on future tables created by the application DB owner

## Raw Tables In Scope

The initial Metabase setup should read directly from these raw tables:

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

The first Metabase dashboard should answer these product questions directly from
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

## Notes

- The first phase is intentionally simple: raw tables plus aggregate queries.
- If the Metabase dashboards become slow or the SQL logic starts to drift, the
  next step is to introduce a dedicated `analytics` layer inside PostgreSQL.
