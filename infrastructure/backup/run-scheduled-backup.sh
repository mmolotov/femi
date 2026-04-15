#!/usr/bin/env bash

set -euo pipefail

if [ -f /backup/backup.env ]; then
  # Load scheduler-time secrets and connection settings into the cron job process.
  . /backup/backup.env
fi

exec /backup/backup-once.sh scheduled
