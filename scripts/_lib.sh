# Shared helpers for the femi dev scripts. Source this file; do not run it directly.
# shellcheck shell=bash

# Always operate from the repo root so relative paths (.env, compose file) resolve.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="infrastructure/docker-compose.yml"

# Run docker compose for the local stack. Uses the repo-root .env for ${VAR}
# interpolation when it exists (kept optional so stop/down work without it).
compose() {
  if [ -f .env ]; then
    docker compose -f "$COMPOSE_FILE" --env-file .env "$@"
  else
    docker compose -f "$COMPOSE_FILE" "$@"
  fi
}

# Required before anything that runs the app or migrations.
ensure_env() {
  if [ ! -f .env ]; then
    echo "❌  .env not found. Create it first:" >&2
    echo "      cp .env.example .env" >&2
    exit 1
  fi
}
