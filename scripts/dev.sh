#!/usr/bin/env bash
# Run the app OUTSIDE Docker: server + worker (metric collector) + monitoring
# dashboard, all with hot reload. Expects the database to be up (`pnpm db:up`).
# Press Ctrl+C to stop all three.
set -euo pipefail
# shellcheck source=scripts/_lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

ensure_env

echo "▶  Building workspace deps (shared, db)…"
pnpm --filter @femi/shared build
pnpm --filter @femi/db build

echo "▶  Starting server + worker + monitoring (Ctrl+C stops all)…"
echo "   • Monitoring dashboard: http://127.0.0.1:3002/"
echo "   • Reminder: the database must be running — 'pnpm db:up' if it isn't."
echo

# Kill the whole process group on exit so Ctrl+C tears down every child.
trap 'kill 0' EXIT

pnpm --filter @femi/server dev &
pnpm --filter @femi/server dev:worker &
pnpm --filter @femi/server dev:monitoring &
wait
