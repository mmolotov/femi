FROM postgres:18-alpine

RUN apk add --no-cache bash aws-cli

WORKDIR /backup

COPY infrastructure/backup/backup-loop.sh /backup/backup-loop.sh
COPY infrastructure/backup/restore-backup.sh /backup/restore-backup.sh

RUN chmod +x /backup/backup-loop.sh /backup/restore-backup.sh

CMD ["/backup/backup-loop.sh"]
