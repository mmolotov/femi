#!/usr/bin/env bash

set -euo pipefail

cron_file="/etc/crontabs/root"
env_file="/backup/backup.env"
schedule="${BACKUP_CRON_SCHEDULE:-0 3 * * *}"

mkdir -p /etc/crontabs

cat > "${cron_file}" <<'EOF'
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
EOF

required_vars=(
  DATABASE_URL
  S3_BACKUP_BUCKET
  S3_BACKUP_ENDPOINT
)

missing_vars=()

for var_name in "${required_vars[@]}"; do
  if [ -z "${!var_name:-}" ]; then
    missing_vars+=("${var_name}")
  fi
done

if [ "${#missing_vars[@]}" -gt 0 ]; then
  echo "Scheduled backups are disabled because required variables are missing: ${missing_vars[*]}" >&2
  rm -f "${env_file}"
else
  : > "${env_file}"

  backup_env_vars=(
    DATABASE_URL
    S3_BACKUP_BUCKET
    S3_BACKUP_ENDPOINT
    S3_BACKUP_REGION
    S3_BACKUP_ACCESS_KEY
    S3_BACKUP_SECRET_KEY
  )

  for var_name in "${backup_env_vars[@]}"; do
    printf 'export %s=%q\n' "${var_name}" "${!var_name:-}" >> "${env_file}"
  done

  chmod 600 "${env_file}"

  printf '%s /backup/run-scheduled-backup.sh >> /proc/1/fd/1 2>> /proc/1/fd/2\n' "${schedule}" >> "${cron_file}"

  echo "Scheduled backups enabled with cron expression: ${schedule} (container time)." >&2
fi

chmod 600 "${cron_file}"

exec crond -f -l 2
