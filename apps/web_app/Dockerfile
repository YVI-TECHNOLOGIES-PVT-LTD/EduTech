# Stage 1: Build stage
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@9

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages ./packages
COPY apps/web ./apps/web

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @edutrack/web run build

# Stage 2: Production Nginx runtime stage
FROM nginx:1.25-alpine AS runner

LABEL org.opencontainers.image.title="EduTrack Web Frontend"
LABEL org.opencontainers.image.description="EduTrack Enterprise React SPA Web Application"
LABEL org.opencontainers.image.version="2.11.0"
LABEL org.opencontainers.image.authors="EduTrack Platform Team"

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
