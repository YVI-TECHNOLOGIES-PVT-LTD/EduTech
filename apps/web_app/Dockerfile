# ==============================================================================
# EduTrack Enterprise Monorepo — Production Web Frontend Dockerfile (@edutrack/web)
# Architecture: Official Turborepo Docker Pruning Multi-Stage Build Strategy
# Base OS: Debian Bookworm Slim (Node 22 LTS) -> Nginx 1.25 Alpine Runner
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
# Prune monorepo strictly to @edutrack/web and its dependent shared packages
RUN npx turbo prune --scope=@edutrack/web --docker

# ------------------------------------------------------------------------------
# Stage 3: Dependency Installer & Vite SPA Builder Stage
# ------------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

# Build-time environment variables for Vite SPA bundle
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL
ARG VITE_API_BASE_URL

ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

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

# Build Vite SPA application bundle
RUN pnpm --filter @edutrack/web run build

# ------------------------------------------------------------------------------
# Stage 4: Production Nginx Runtime Stage
# ------------------------------------------------------------------------------
FROM nginx:1.25-alpine AS runner

LABEL org.opencontainers.image.title="EduTrack Web Frontend"
LABEL org.opencontainers.image.description="EduTrack Enterprise React SPA Web Application"
LABEL org.opencontainers.image.version="2.11.0"
LABEL org.opencontainers.image.authors="EduTrack Platform Team"
LABEL org.opencontainers.image.source="https://github.com/edutrack/edutech"

# Copy compiled SPA static assets and custom Nginx configuration
COPY --from=builder /app/apps/web_app/dist /usr/share/nginx/html
COPY apps/web_app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
