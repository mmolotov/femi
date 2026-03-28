FROM postgres:18-alpine

RUN apk add --no-cache bash aws-cli

WORKDIR /backup

COPY infrastructure/backup/backup-loop.sh /backup/backup-loop.sh

RUN chmod +x /backup/backup-loop.sh

CMD ["/backup/backup-loop.sh"]

