/**
 * EduTrack Enterprise — Prisma Client Singleton
 * ================================================
 * Provides a single shared PrismaClient instance for the entire backend.
 *
 * In development, prevents exhausting database connections due to hot-reload
 * by reusing the same client instance across module reloads (globalThis pattern).
 *
 * Usage:
 *   import prisma from '@/lib/prismaClient';
 *   const records = await prisma.someModel.findMany();
 */

import { PrismaClient } from '@prisma/client';

// ── Type augmentation so TypeScript is aware of the global ──────────────────
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// ── Singleton factory ────────────────────────────────────────────────────────
const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
  });

// Persist across hot-reloads in development only
if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export default prisma;
