# Stage 1: Build stage
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@9

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @edutrack/api run build

# Stage 2: Production runtime stage
FROM node:20-alpine AS runner
WORKDIR /app

LABEL org.opencontainers.image.title="EduTrack Backend API"
LABEL org.opencontainers.image.description="EduTrack Enterprise Express API Microservice"
LABEL org.opencontainers.image.version="2.11.0"
LABEL org.opencontainers.image.authors="EduTrack Platform Team"

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/api/package.json ./apps/api/
COPY apps/api/dist ./apps/api/dist

RUN npm install -g pnpm@9
RUN pnpm install --prod --frozen-lockfile

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health/live || exit 1

CMD ["node", "apps/api/dist/server.js"]
