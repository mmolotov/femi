#!/usr/bin/env bash

set -euo pipefail

if [ -z "${EVIDENCE_DB_USER:-}" ]; then
  echo "EVIDENCE_DB_USER is required" >&2
  exit 1
fi

if [ -z "${EVIDENCE_DB_PASSWORD:-}" ]; then
  echo "EVIDENCE_DB_PASSWORD is required" >&2
  exit 1
fi

if ! [[ "${EVIDENCE_DB_USER}" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
  echo "EVIDENCE_DB_USER must be a valid PostgreSQL role name using letters, digits, and underscores" >&2
  exit 1
fi

database_name="${POSTGRES_DB:-}"

if [ -z "${database_name}" ]; then
  echo "POSTGRES_DB is required" >&2
  exit 1
fi

db_owner_role="${DB_OWNER_ROLE:-${POSTGRES_USER:-}}"

if [ -z "${db_owner_role}" ]; then
  echo "DB_OWNER_ROLE or POSTGRES_USER is required" >&2
  exit 1
fi

if [ -n "${POSTGRES_ADMIN_URL:-}" ]; then
  psql_target=( "${POSTGRES_ADMIN_URL}" )
else
  if [ -z "${POSTGRES_USER:-}" ] || [ -z "${POSTGRES_PASSWORD:-}" ]; then
    echo "POSTGRES_USER and POSTGRES_PASSWORD are required when POSTGRES_ADMIN_URL is not set" >&2
    exit 1
  fi

  export PGHOST="${POSTGRES_HOST:-127.0.0.1}"
  export PGPORT="${POSTGRES_PORT:-5432}"
  export PGDATABASE="${database_name}"
  export PGUSER="${POSTGRES_USER}"
  export PGPASSWORD="${POSTGRES_PASSWORD}"

  psql_target=()
fi

psql \
  "${psql_target[@]}" \
  -v ON_ERROR_STOP=1 \
  -v evidence_db_user="${EVIDENCE_DB_USER}" \
  -v evidence_db_password="${EVIDENCE_DB_PASSWORD}" \
  -v database_name="${database_name}" \
  -v db_owner_role="${db_owner_role}" \
  -f "$(dirname "$0")/create-evidence-readonly-user.sql"
