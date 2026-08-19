"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
// ── Singleton factory ────────────────────────────────────────────────────────
const prisma = globalThis.__prisma ??
    new client_1.PrismaClient({
        log: ['warn', 'error'],
    });
// Persist across hot-reloads in development only
if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma = prisma;
}
exports.default = prisma;
