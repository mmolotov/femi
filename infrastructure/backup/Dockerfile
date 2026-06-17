FROM postgres:18-alpine

RUN apk add --no-cache bash aws-cli

WORKDIR /backup

COPY infrastructure/backup/backup-once.sh /backup/backup-once.sh
COPY infrastructure/backup/backup-cron.sh /backup/backup-cron.sh
COPY infrastructure/backup/run-scheduled-backup.sh /backup/run-scheduled-backup.sh
COPY infrastructure/backup/restore-backup.sh /backup/restore-backup.sh

RUN chmod +x /backup/backup-once.sh /backup/backup-cron.sh /backup/run-scheduled-backup.sh /backup/restore-backup.sh

CMD ["/backup/backup-cron.sh"]
