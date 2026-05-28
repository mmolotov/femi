#!/usr/bin/env bash
# Start ONLY Postgres in Docker (for running the app outside Docker), wait until
# it is healthy, and apply migrations. Data persists in the 'femi_postgres_data'
# volume across restarts.
set -euo pipefail
# shellcheck source=scripts/_lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

ensure_env

echo "▶  Starting Postgres in Docker and waiting for it to be ready…"
compose up -d --wait postgres

echo "▶  Applying database migrations…"
pnpm db:migrate

echo
echo "✔  Postgres is up on 127.0.0.1:5432 and migrated (volume: femi_postgres_data)."
echo "   Now run the app outside Docker:"
echo "     pnpm dev:all     # server + worker + monitoring  →  http://127.0.0.1:3002/"
echo "     pnpm dev:web     # (optional) web UI"
echo "   Stop the database (keep data): pnpm db:down"
