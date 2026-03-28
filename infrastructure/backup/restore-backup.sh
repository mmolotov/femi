#!/usr/bin/env bash

set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required for restore" >&2
  exit 1
fi

if [ -z "${S3_BACKUP_BUCKET:-}" ]; then
  echo "S3_BACKUP_BUCKET is required for restore" >&2
  exit 1
fi

if [ -z "${BACKUP_OBJECT_KEY:-}" ]; then
  echo "BACKUP_OBJECT_KEY is required for restore" >&2
  exit 1
fi

if [ "${CONFIRM_RESTORE:-}" != "restore-femi" ]; then
  echo "Set CONFIRM_RESTORE=restore-femi to run a restore" >&2
  exit 1
fi

export AWS_ACCESS_KEY_ID="${S3_BACKUP_ACCESS_KEY:-}"
export AWS_SECRET_ACCESS_KEY="${S3_BACKUP_SECRET_KEY:-}"
export AWS_DEFAULT_REGION="${S3_BACKUP_REGION:-us-east-1}"

filepath="/tmp/${BACKUP_OBJECT_KEY##*/}"

aws s3 cp \
  "s3://${S3_BACKUP_BUCKET}/${BACKUP_OBJECT_KEY}" \
  "${filepath}" \
  --endpoint-url "${S3_BACKUP_ENDPOINT}"

gunzip -c "${filepath}" | psql "${DATABASE_URL}"

rm -f "${filepath}"
