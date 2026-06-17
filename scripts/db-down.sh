#!/usr/bin/env bash
# Stop the Postgres container. Keeps the container and its data volume, so the
# next `pnpm db:up` brings your data back untouched.
set -euo pipefail
# shellcheck source=scripts/_lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "■  Stopping Postgres (data volume preserved)…"
compose stop postgres

echo
echo "✔  Postgres stopped. Data is safe in 'femi_postgres_data'."
echo "   Start again with: pnpm db:up"
