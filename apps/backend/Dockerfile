# EduTrack API — multi-stage image (turbo prune, pnpm, non-root runtime).
# Build context is the repository root.

FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

FROM base AS pruner
RUN npm install -g turbo@2.3.4
COPY . .
RUN turbo prune @edutrack/api --docker

FROM base AS builder
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV HUSKY=0
# prisma generate reads these from the schema. They are build-time placeholders,
# not a connection, and they are not copied into the runtime stage.
ENV DATABASE_URL="postgresql://edutrack:edutrack@localhost:5432/edutrack"
ENV DIRECT_URL="postgresql://edutrack:edutrack@localhost:5432/edutrack"

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ ./
COPY turbo.json ./
RUN pnpm exec turbo run build --filter=@edutrack/api
RUN pnpm --filter @edutrack/api deploy --prod /prod/backend \
  && cp -a apps/backend/dist /prod/backend/dist \
  && rm -rf /prod/backend/prisma \
  && cp -a apps/backend/prisma /prod/backend/prisma \
  && cd /prod/backend \
  && ./node_modules/.bin/prisma generate --schema=prisma/schema.prisma

FROM node:20-bookworm-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

COPY --from=builder --chown=node:node /prod/backend ./
COPY --chown=node:node docker/backend/entrypoint.sh /app/entrypoint.sh
RUN chmod 755 /app/entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000
ENV PUPPETEER_SKIP_DOWNLOAD=true

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./entrypoint.sh"]
