FROM node:24-alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/server/package.json apps/server/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --filter @femi/server... --frozen-lockfile

COPY apps/server apps/server
COPY packages/db packages/db
COPY packages/shared packages/shared

RUN pnpm --filter @femi/shared build \
  && pnpm --filter @femi/db build \
  && pnpm --filter @femi/server build

CMD ["pnpm", "--filter", "@femi/server", "start"]
