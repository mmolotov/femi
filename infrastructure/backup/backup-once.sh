#!/usr/bin/env bash

set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required for backups" >&2
  exit 1
fi

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

scope="${1:-manual}"
sanitized_scope="$(printf '%s' "${scope}" | tr -cs 'A-Za-z0-9._/-' '-')"
sanitized_scope="${sanitized_scope#/}"
sanitized_scope="${sanitized_scope%/}"

if [ -z "${sanitized_scope}" ]; then
  sanitized_scope="manual"
fi

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
filename="femi-${timestamp}.sql.gz"
filepath="/tmp/${filename}"
object_key="${sanitized_scope}/${filename}"

cleanup() {
  rm -f "${filepath}"
}

trap cleanup EXIT

echo "Creating backup ${object_key}"

pg_dump "${DATABASE_URL}" | gzip > "${filepath}"

aws s3 cp \
  "${filepath}" \
  "s3://${S3_BACKUP_BUCKET}/${object_key}" \
  --endpoint-url "${S3_BACKUP_ENDPOINT}"

echo "Uploaded backup ${object_key}"
