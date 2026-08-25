# ==============================================================================
# EduTrack Backend API — apps/backend (@edutrack/api)
# ------------------------------------------------------------------------------
# Multi-stage, pnpm + Turborepo aware build for the Express/TypeScript/Prisma
# backend. Debian (bookworm-slim) is used instead of Alpine because:
#   1. Prisma's query engine resolution is most predictable on glibc.
#   2. @edutrack/api declares `puppeteer` as a production dependency, which
#      needs a real Chromium + shared libs that Alpine/musl makes harder to
#      satisfy reliably.
#
# The database is NEVER touched by this build: no `prisma db push`, no
# `prisma migrate`, no seeding. Only `prisma generate` runs, which only reads
# prisma/schema.prisma to emit a client — it never connects to a database.
#
# Build context: repo root (monorepo-aware; needs sibling packages/*).
#   docker build -f apps/backend/Dockerfile -t edutrack-backend .
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage: base — shared Node + pnpm toolchain
# ------------------------------------------------------------------------------
FROM node:20.18.0-bookworm-slim AS base
WORKDIR /app
RUN npm install -g pnpm@9.15.4

# ------------------------------------------------------------------------------
# Stage: pruner — compute the minimal @edutrack/api workspace subset
# ------------------------------------------------------------------------------
FROM base AS pruner
WORKDIR /app
COPY . .
# Prunes to @edutrack/api + only the workspace packages it actually depends on
# (@edutrack/types, @edutrack/validation, @edutrack/config) — apps/mobile_app
# and apps/web_app are excluded from the pruned output entirely.
RUN npx turbo@2.10.8 prune --scope=@edutrack/api --docker

# ------------------------------------------------------------------------------
# Stage: builder — install deps, generate Prisma Client, compile TypeScript
# ------------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

# `puppeteer` is a declared backend dependency; skip its own Chromium
# download during install. The runtime stage installs Chromium via apt
# instead and points PUPPETEER_EXECUTABLE_PATH at it.
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# OpenSSL/ca-certificates are required for `prisma generate` to resolve and
# fetch the correct query engine for this image's OS.
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies for the pruned workspace only — layer-cached on the
# lockfile so source-only changes don't invalidate the install layer.
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile

# Bring in the pruned source tree + root build config.
COPY --from=pruner /app/out/full/ ./
COPY turbo.json ./

# Build via Turbo (not `pnpm --filter … run build` directly) so that
# workspace dependencies are built first per turbo.json's
# `build: { dependsOn: ["^build"] }` — @edutrack/validation, in particular,
# compiles to dist/index.js and is `require()`d at runtime by the backend;
# without building it first, the backend fails at startup with
# MODULE_NOT_FOUND. This also runs @edutrack/api's own `prisma generate &&
# tsc`, generating the Prisma Client against THIS stage's OS (Debian/glibc),
# matching the runner stage below — no cross-OS engine mismatch.
RUN npx turbo@2.10.8 run build --filter=@edutrack/api

# Produce an isolated, production-only dependency bundle for @edutrack/api
# (pnpm's native workspace "deploy" — pulls in only prod deps, no devDeps,
# no other workspace members' node_modules).
RUN pnpm --filter @edutrack/api deploy --prod --no-optional /prod/backend

# `pnpm deploy` follows publish-style file inclusion rules: it materializes
# real (non-symlinked) copies of @edutrack/api's dependencies, but the
# *generated* Prisma Client output (`.prisma/client`, including the query
# engine binary) is not a declared package file — it's a side effect of
# `prisma generate` — so `deploy` does not carry it over. Locate it via the
# @prisma/client symlink's real target (pnpm's content-addressed virtual
# store, e.g. node_modules/.pnpm/@prisma+client@<ver>_prisma@<ver>/node_modules)
# rather than hardcoding a version-specific path, and copy its `.prisma`
# sibling into the deployed bundle's top-level node_modules — which is
# exactly where Node's module resolution for `require('.prisma/client/...')`
# looks from `node_modules/@prisma/client`.
RUN cp -r apps/backend/dist /prod/backend/dist
RUN set -eu; \
    CLIENT_REAL=$(readlink -f apps/backend/node_modules/@prisma/client); \
    PRISMA_STORE_NM=$(dirname "$(dirname "$CLIENT_REAL")"); \
    test -d "$PRISMA_STORE_NM/.prisma/client"; \
    mkdir -p /prod/backend/node_modules/.prisma; \
    cp -r "$PRISMA_STORE_NM/.prisma/." /prod/backend/node_modules/.prisma/; \
    test -f /prod/backend/node_modules/.prisma/client/index.js

# ------------------------------------------------------------------------------
# Stage: runner — minimal production runtime
# ------------------------------------------------------------------------------
FROM node:20.18.0-bookworm-slim AS runner
WORKDIR /app

LABEL org.opencontainers.image.title="EduTrack Backend API"
LABEL org.opencontainers.image.description="EduTrack Enterprise Express API Microservice"
LABEL org.opencontainers.image.authors="EduTrack Platform Team"

# Runtime OS packages:
#   openssl / ca-certificates → required by the Prisma query engine
#   chromium + fonts          → required by the Puppeteer dependency
#   wget                      → used only by HEALTHCHECK below
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    chromium \
    fonts-freefont-ttf \
    wget \
  && rm -rf /var/lib/apt/lists/* \
  && apt-get clean

ENV NODE_ENV=production
ENV PORT=3000
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Only the deployed, production-only bundle is copied in — no source, no
# devDependencies, no .env files, no other workspace members.
COPY --from=builder --chown=node:node /prod/backend ./

USER node
EXPOSE 3000

# Liveness probe only — does not touch the database (matches /health/ready
# being the DB-aware probe, intentionally not used here since container
# health should reflect "process is up", not external DB availability).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:3000/health/live || exit 1

CMD ["node", "dist/server.js"]
