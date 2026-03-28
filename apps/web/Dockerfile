FROM node:25-alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json

RUN pnpm install --filter @femi/web --frozen-lockfile

COPY apps/web apps/web

RUN pnpm --filter @femi/web build

CMD ["pnpm", "--filter", "@femi/web", "preview"]
