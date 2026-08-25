# ==============================================================================
# EduTrack Web Frontend — apps/web_app (@edutrack/web)
# ------------------------------------------------------------------------------
# Multi-stage build: Node/pnpm/Turbo compile the Vite SPA, then a plain Nginx
# image serves the static output. No Node runtime exists in the final image.
#
# VITE_* variables are Vite build-time variables — they get compiled directly
# into the JS bundle and CANNOT be changed after the image is built. Pass them
# as `--build-arg` (or docker-compose `build.args`) at build time. See the
# ARG list below for the exact set this app reads (apps/web_app/.env.example).
#
# Build context: repo root (monorepo-aware; needs sibling packages/*).
#   docker build -f apps/web_app/Dockerfile \
#     --build-arg VITE_API_URL=http://localhost:3000/api \
#     -t edutrack-web .
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage: base — shared Node + pnpm toolchain
# ------------------------------------------------------------------------------
FROM node:20.18.0-bookworm-slim AS base
WORKDIR /app
RUN npm install -g pnpm@9.15.4

# ------------------------------------------------------------------------------
# Stage: pruner — compute the minimal @edutrack/web workspace subset
# ------------------------------------------------------------------------------
FROM base AS pruner
WORKDIR /app
COPY . .
# Prunes to @edutrack/web + only the workspace packages it depends on
# (@edutrack/types, @edutrack/ui, @edutrack/validation, @edutrack/config).
RUN npx turbo@2.10.8 prune --scope=@edutrack/web --docker

# ------------------------------------------------------------------------------
# Stage: builder — install deps, build the Vite SPA
# ------------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

# --- Build-time Vite variables (apps/web_app/.env.example) -------------------
# Every VITE_* var the app reads via import.meta.env must be listed here as
# an ARG, or it silently falls back to the in-code default (see env.ts /
# api-client.ts). None of these are secrets that grant backend/database
# access on their own (VITE_SUPABASE_ANON_KEY is Supabase's public anon key,
# designed for client-side exposure) — but none are hardcoded with real
# values in this Dockerfile; they must be supplied at build time.
ARG VITE_API_URL
ARG VITE_APP_TITLE
ARG VITE_DEFAULT_TENANT_ID
ARG VITE_ENABLE_MOCK_API
ARG VITE_SESSION_TIMEOUT_MINS
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_TRANSLATION_API_URL
ARG VITE_TRANSLATION_API_KEY

ENV VITE_API_URL=${VITE_API_URL} \
    VITE_APP_TITLE=${VITE_APP_TITLE} \
    VITE_DEFAULT_TENANT_ID=${VITE_DEFAULT_TENANT_ID} \
    VITE_ENABLE_MOCK_API=${VITE_ENABLE_MOCK_API} \
    VITE_SESSION_TIMEOUT_MINS=${VITE_SESSION_TIMEOUT_MINS} \
    VITE_SUPABASE_URL=${VITE_SUPABASE_URL} \
    VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY} \
    VITE_TRANSLATION_API_URL=${VITE_TRANSLATION_API_URL} \
    VITE_TRANSLATION_API_KEY=${VITE_TRANSLATION_API_KEY}

# Install dependencies for the pruned workspace only.
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile

# Bring in the pruned source tree + root build config.
COPY --from=pruner /app/out/full/ ./
COPY turbo.json ./

# Build via Turbo (not `pnpm --filter … run build` directly) so that
# workspace dependencies are built first per turbo.json's
# `build: { dependsOn: ["^build"] }` — @edutrack/web depends on @edutrack/ui
# and @edutrack/validation, both of which must be compiled before Vite can
# resolve/bundle them (same reasoning as apps/backend/Dockerfile).
# `@edutrack/web`'s own build script is `tsc && vite build` → apps/web_app/dist
RUN npx turbo@2.10.8 run build --filter=@edutrack/web

# ------------------------------------------------------------------------------
# Stage: runner — static Nginx runtime (no Node)
# ------------------------------------------------------------------------------
FROM nginx:1.25-alpine AS runner

LABEL org.opencontainers.image.title="EduTrack Web Frontend"
LABEL org.opencontainers.image.description="EduTrack Enterprise React SPA Web Application"
LABEL org.opencontainers.image.authors="EduTrack Platform Team"

# Only the compiled static assets + the existing nginx.conf are copied in —
# no source, no node_modules, no .env files.
COPY --from=builder /app/apps/web_app/dist /usr/share/nginx/html
COPY apps/web_app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
