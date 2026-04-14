#!/usr/bin/env bash

set -eu

if [ -z "${S3_BACKUP_BUCKET:-}" ]; then
  echo "S3_BACKUP_BUCKET is not configured, backup container will idle." >&2
  sleep infinity
fi

INTERVAL="${BACKUP_INTERVAL_SECONDS:-86400}"

while true; do
  sleep "${INTERVAL}"
  /backup/backup-once.sh scheduled
done
