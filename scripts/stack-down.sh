#!/usr/bin/env bash
# Stop the whole femi stack. Removes the containers but KEEPS the database volume,
# so data survives until the next start. (Never uses `-v`, which would wipe data.)
set -euo pipefail
# shellcheck source=scripts/_lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

echo "■  Stopping the femi stack (containers removed, data volume kept)…"
compose down

echo
echo "✔  Stopped. The 'femi_postgres_data' volume is preserved — your data is safe."
echo "   Start again with: pnpm stack:up"
