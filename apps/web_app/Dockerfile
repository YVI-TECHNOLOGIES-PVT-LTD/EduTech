# ==============================================================================
# EduTrack Enterprise ERP — Web Frontend Multi-Stage Production Dockerfile
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Stage (Vite SPA Compilation)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# Copy root monorepo workspace manifests & source files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/web_app ./apps/web_app

# Install monorepo workspace dependencies
RUN pnpm install --frozen-lockfile

# Compile React SPA static bundle (dist/)
RUN pnpm --filter @edutrack/web run build

# ------------------------------------------------------------------------------
# Stage 2: Production Nginx Runtime Stage
# ------------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runner

LABEL org.opencontainers.image.title="EduTrack Web Frontend"
LABEL org.opencontainers.image.description="EduTrack Enterprise React SPA Web Application"
LABEL org.opencontainers.image.version="2.11.0"
LABEL org.opencontainers.image.vendor="EduTrack Enterprise"
LABEL org.opencontainers.image.authors="EduTrack Platform Team"
LABEL org.opencontainers.image.licenses="PROPRIETARY"
LABEL org.opencontainers.image.documentation="https://github.com/YVI-TECHNOLOGIES-PVT-LTD/EduTech"

# Clear default Nginx welcome page files
RUN rm -rf /usr/share/nginx/html/*

# Copy built SPA static dist assets from builder stage
COPY --from=builder /app/apps/web_app/dist /usr/share/nginx/html

# Copy optimized production Nginx server configuration
COPY apps/web_app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Health Check Probe using Nginx root index
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Start Nginx in foreground daemon mode
CMD ["nginx", "-g", "daemon off;"]
