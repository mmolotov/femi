#!/usr/bin/env bash

set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required for backups" >&2
  exit 1
fi

if [ -z "${S3_BACKUP_BUCKET:-}" ]; then
  echo "S3_BACKUP_BUCKET is not configured, backup container will idle." >&2
  sleep infinity
fi

export AWS_ACCESS_KEY_ID="${S3_BACKUP_ACCESS_KEY:-}"
export AWS_SECRET_ACCESS_KEY="${S3_BACKUP_SECRET_KEY:-}"
export AWS_DEFAULT_REGION="${S3_BACKUP_REGION:-us-east-1}"

INTERVAL="${BACKUP_INTERVAL_SECONDS:-86400}"

while true; do
  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  filename="femi-${timestamp}.sql.gz"
  filepath="/tmp/${filename}"

  pg_dump "${DATABASE_URL}" | gzip > "${filepath}"

  aws s3 cp \
    "${filepath}" \
    "s3://${S3_BACKUP_BUCKET}/${filename}" \
    --endpoint-url "${S3_BACKUP_ENDPOINT}"

  rm -f "${filepath}"

  sleep "${INTERVAL}"
done

