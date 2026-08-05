# ==============================================================================
# EduTrack Enterprise Monorepo — Production Backend Dockerfile (@edutrack/api)
# Architecture: Official Turborepo Docker Pruning Multi-Stage Build Strategy
# Base OS: Debian Bookworm Slim (Node 22 LTS)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Base Image Setup
# ------------------------------------------------------------------------------
FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@9

# ------------------------------------------------------------------------------
# Stage 2: Turborepo Workspace Pruner Stage
# ------------------------------------------------------------------------------
FROM base AS pruner
WORKDIR /app
COPY . .
# Prune monorepo strictly to @edutrack/api and its dependent shared packages
RUN npx turbo prune --scope=@edutrack/api --docker

# ------------------------------------------------------------------------------
# Stage 3: Dependency Installer & TypeScript Builder Stage
# ------------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Install OpenSSL for Prisma engine compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy pruned workspace manifests first to leverage Docker layer caching
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Install dependencies for pruned workspace only (excludes apps/mobile_app)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Copy pruned source code files and root workspace config
COPY --from=pruner /app/out/full/ ./
COPY turbo.json ./
COPY tsconfig.json ./

# Generate Prisma Client for PostgreSQL schema (Path relative to apps/backend)
RUN pnpm --filter @edutrack/api exec prisma generate --schema=prisma/schema.prisma

# Build TypeScript output
RUN pnpm --filter @edutrack/api run build

# Deploy isolated production workspace bundle for @edutrack/api
RUN pnpm --filter=@edutrack/api deploy --prod /prod/backend
RUN cp -r apps/backend/dist /prod/backend/dist && \
    (cp -r node_modules/.prisma /prod/backend/node_modules/.prisma 2>/dev/null || true) && \
    (cp -r apps/backend/node_modules/.prisma /prod/backend/node_modules/.prisma 2>/dev/null || true)

# ------------------------------------------------------------------------------
# Stage 4: Production Runtime Stage
# ------------------------------------------------------------------------------
FROM node:22-bookworm-slim AS runner
WORKDIR /app

LABEL org.opencontainers.image.title="EduTrack Backend API"
LABEL org.opencontainers.image.description="EduTrack Enterprise Express API Microservice"
LABEL org.opencontainers.image.version="2.11.0"
LABEL org.opencontainers.image.authors="EduTrack Platform Team"
LABEL org.opencontainers.image.source="https://github.com/edutrack/edutech"

# Install runtime system packages for Prisma (OpenSSL) & Puppeteer (Chromium)
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    chromium \
    fonts-freefont-ttf \
    wget \
  && rm -rf /var/lib/apt/lists/*

# Production Environment Configuration
ENV NODE_ENV=production
ENV PORT=3000
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Copy isolated production bundle from builder stage
COPY --from=builder --chown=node:node /prod/backend ./

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:3000/health/live || exit 1

CMD ["node", "dist/server.js"]
