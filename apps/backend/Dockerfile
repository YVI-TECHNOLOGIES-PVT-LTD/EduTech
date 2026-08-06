# ==============================================================================
# EduTrack Enterprise ERP — Backend API Multi-Stage Production Dockerfile
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Dependency Installation & Workspace Pruning
# ------------------------------------------------------------------------------
FROM node:22-alpine AS pruner
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# Copy root monorepo workspace manifests & source files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/backend ./apps/backend

# Install full dependency tree (including devDependencies for build & Prisma)
RUN pnpm install --frozen-lockfile

# ------------------------------------------------------------------------------
# Stage 2: Build & Prisma Client Compilation
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

COPY --from=pruner /app ./

# Generate Prisma Client inside Alpine (builds linux-musl engine binaries)
RUN pnpm --filter @edutrack/api run db:generate

# Compile TypeScript source code to production JavaScript (dist/)
RUN pnpm --filter @edutrack/api run build

# Extract production-only workspace dependencies
RUN pnpm --filter @edutrack/api deploy --prod /app/pruned

# Ensure generated Prisma client engine is preserved in pruned node_modules
RUN cp -r node_modules/.prisma /app/pruned/node_modules/.prisma 2>/dev/null || true

# ------------------------------------------------------------------------------
# Stage 3: Production Minimal Runtime Runner
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

LABEL org.opencontainers.image.title="EduTrack Backend API"
LABEL org.opencontainers.image.description="EduTrack Enterprise Express API Microservice"
LABEL org.opencontainers.image.version="2.11.0"
LABEL org.opencontainers.image.vendor="EduTrack Enterprise"
LABEL org.opencontainers.image.authors="EduTrack Platform Team"
LABEL org.opencontainers.image.licenses="PROPRIETARY"
LABEL org.opencontainers.image.documentation="https://github.com/YVI-TECHNOLOGIES-PVT-LTD/EduTech"

ENV NODE_ENV=production
ENV PORT=3000

# Security: Run as unprivileged non-root node user
USER node

# Copy compiled JavaScript dist, pruned production dependencies, and schema with non-root ownership
COPY --from=builder --chown=node:node /app/apps/backend/dist /app/dist
COPY --from=builder --chown=node:node /app/pruned/node_modules /app/node_modules
COPY --from=builder --chown=node:node /app/apps/backend/package.json /app/package.json
COPY --from=builder --chown=node:node /app/apps/backend/prisma /app/prisma

EXPOSE 3000

# Health Check Probe using existing Liveness endpoint
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health/live || exit 1

# Production Entrypoint
CMD ["node", "dist/server.js"]
