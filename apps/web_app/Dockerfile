# EduTrack web app — Vite build, then nginx as a non-root user on port 8080.
# Build context is the repository root.
# VITE_* values are inlined into the static bundle. Defaults are placeholders.

FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

FROM base AS pruner
RUN npm install -g turbo@2.3.4
COPY . .
RUN turbo prune @edutrack/web --docker

FROM base AS builder
ENV HUSKY=0

ARG VITE_API_URL=http://127.0.0.1:3000/api
ARG VITE_SUPABASE_URL=https://placeholder.supabase.co
ARG VITE_SUPABASE_ANON_KEY=placeholder-anon-key
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ ./
COPY turbo.json ./
RUN pnpm exec turbo run build --filter=@edutrack/web

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runner

USER root
RUN apk add --no-cache wget
COPY --from=builder --chown=nginx:nginx /app/apps/web_app/dist /usr/share/nginx/html
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
