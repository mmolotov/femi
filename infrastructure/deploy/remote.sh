#!/usr/bin/env bash
# Production deploy script for the femi host.
# Shipped by .github/workflows/deploy-femi.yml via:
#   ssh ... "bash -s" -- "$DEPLOY_REF" "$DEPLOY_PATH" < infrastructure/deploy/remote.sh
# It writes the actual deploy logic to a temp file on the host first, because
# commands like `docker compose exec -T` would otherwise consume the script
# stream that bash reads from stdin.
# Args: $1 = git ref to deploy, $2 = deploy path on the host.

set -euo pipefail

deploy_ref="$1"
deploy_path="$2"

deploy_script="$(mktemp "${TMPDIR:-/tmp}/femi-deploy.XXXXXX.sh")"
cleanup() {
  rm -f "${deploy_script}"
}
trap cleanup EXIT

cat > "${deploy_script}" <<'REMOTE_SCRIPT'
set -euo pipefail

deploy_ref="$1"
deploy_path="$2"

cd "${deploy_path}"

if [ -n "$(git status --short)" ]; then
  echo "Refusing to deploy from a dirty checkout in ${deploy_path}." >&2
  git status --short >&2
  exit 1
fi

set -a
. ./.env
set +a

compose() {
  docker compose \
    --env-file .env \
    -f infrastructure/docker-compose.yml \
    -f infrastructure/docker-compose.prod.yml \
    "$@"
}

dump_postgres() {
  compose exec -T postgres /bin/sh -lc \
    'pg_dump "postgresql://${POSTGRES_USER:-femi}:${POSTGRES_PASSWORD:-femi}@127.0.0.1:5432/${POSTGRES_DB:-femi}"'
}

upload_backup_from_stdin() {
  local scope="$1"

  compose run --rm --no-deps -T backup /bin/bash -lc '
    set -euo pipefail

    if [ -z "${S3_BACKUP_BUCKET:-}" ]; then
      echo "S3_BACKUP_BUCKET is required for backups" >&2
      exit 1
    fi

    if [ -z "${S3_BACKUP_ENDPOINT:-}" ]; then
      echo "S3_BACKUP_ENDPOINT is required for backups" >&2
      exit 1
    fi

    export AWS_ACCESS_KEY_ID="${S3_BACKUP_ACCESS_KEY:-}"
    export AWS_SECRET_ACCESS_KEY="${S3_BACKUP_SECRET_KEY:-}"
    export AWS_DEFAULT_REGION="${S3_BACKUP_REGION:-us-east-1}"

    scope="$1"
    sanitized_scope="$(printf "%s" "${scope}" | tr -cs "A-Za-z0-9._/-" "-")"
    sanitized_scope="${sanitized_scope#/}"
    sanitized_scope="${sanitized_scope%/}"

    if [ -z "${sanitized_scope}" ]; then
      sanitized_scope="manual"
    fi

    timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
    filename="femi-${timestamp}.sql.gz"
    filepath="/tmp/${filename}"
    object_key="${sanitized_scope}/${filename}"

    trap "rm -f \"${filepath}\"" EXIT

    cat > "${filepath}"

    if [ ! -s "${filepath}" ]; then
      echo "Backup archive was not created or is empty: ${filepath}" >&2
      exit 1
    fi

    echo "Uploading backup ${object_key}"

    aws s3 cp \
      "${filepath}" \
      "s3://${S3_BACKUP_BUCKET}/${object_key}" \
      --endpoint-url "${S3_BACKUP_ENDPOINT}"

    echo "Uploaded backup ${object_key}"
  ' bash "${scope}"
}

predeploy_backup_skipped=0

git fetch --tags --prune origin

if compose ps --status running --services postgres | grep -qx "postgres"; then
  echo "Running pre-deploy backup from the current postgres container..."

  dump_postgres | gzip | upload_backup_from_stdin "predeploy/${deploy_ref}"
else
  echo "Skipping pre-deploy backup because postgres is not running in the current stack."
  predeploy_backup_skipped=1
fi

git checkout --detach "${deploy_ref}"

compose up -d --build

compose up -d

compose ps

if [ "${predeploy_backup_skipped}" = "1" ]; then
  echo "Attempting immediate compensating backup because the pre-deploy backup was skipped..."

  postgres_ready=0
  readiness_attempt=1
  readiness_max_attempts=20

  while [ "${readiness_attempt}" -le "${readiness_max_attempts}" ]; do
    if compose exec -T postgres pg_isready -U "${POSTGRES_USER:-femi}" -d "${POSTGRES_DB:-femi}" > /dev/null 2>&1; then
      postgres_ready=1
      break
    fi

    echo "Waiting for postgres readiness before compensating backup (${readiness_attempt}/${readiness_max_attempts})..."
    readiness_attempt=$((readiness_attempt + 1))
    sleep 3
  done

  if [ "${postgres_ready}" = "1" ]; then
    if dump_postgres | gzip | upload_backup_from_stdin "postdeploy/${deploy_ref}"; then
      echo "Compensating post-deploy backup completed."
    else
      echo "Compensating post-deploy backup failed; continuing because no pre-deploy database instance was available." >&2
    fi
  else
    echo "Skipping compensating post-deploy backup because postgres did not become ready in time." >&2
  fi
fi

attempt=1
max_attempts=20

until curl --fail --silent --show-error "https://${APP_DOMAIN}/api/health" > /dev/null; do
  if [ "${attempt}" -ge "${max_attempts}" ]; then
    echo "Public health check failed after ${max_attempts} attempts." >&2
    exit 1
  fi

  echo "Public health check attempt ${attempt}/${max_attempts} failed; waiting for ingress/TLS to converge..."
  attempt=$((attempt + 1))
  sleep 3
done
REMOTE_SCRIPT

chmod 700 "${deploy_script}"
bash "${deploy_script}" "${deploy_ref}" "${deploy_path}"
