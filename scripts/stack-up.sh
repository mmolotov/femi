#!/usr/bin/env bash
# Start the WHOLE femi stack in Docker (postgres, migrate, server, worker,
# monitoring, web, backup). Migrations run automatically via the `migrate` service.
set -euo pipefail
# shellcheck source=scripts/_lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

ensure_env

echo "▶  Building and starting the full femi stack in Docker…"
compose up -d --build

echo
echo "✔  Stack is up. Data persists in the 'femi_postgres_data' volume."
echo "   • Monitoring dashboard : http://127.0.0.1:3002/   (loopback only; MONITORING_PORT)"
echo "   • Postgres             : 127.0.0.1:5432            (POSTGRES_PORT)"
echo "   • Follow logs          : docker compose -f $COMPOSE_FILE logs -f"
echo "   • Stop (keep data)     : pnpm stack:down"
