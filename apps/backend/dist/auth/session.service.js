"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionService = exports.SessionService = void 0;
const client_1 = require("@prisma/client");
const auth_service_1 = require("./auth.service");
const prisma = new client_1.PrismaClient();
const sessionCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL
class SessionService {
    async validateSession(token) {
        const cached = sessionCache.get(token);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.profile;
        }
        try {
            // 1. Verify Internal JWT Token
            const decoded = auth_service_1.AuthService.verifyToken(token);
            if (!decoded || !decoded.userId)
                return null;
            // 2. Fetch User Profile from public.users via Prisma ORM
            const user = await prisma.users.findUnique({
                where: { user_id: decoded.userId },
            });
            if (!user || user.status !== 'active') {
                return null;
            }
            // 3. Fetch User Roles via Prisma ORM
            const userRolesData = await prisma.user_roles.findMany({
                where: { user_id: user.user_id },
                include: {
                    roles: true,
                },
            });
            const roles = userRolesData
                .map((ur) => ur.roles?.role_name)
                .filter((r) => Boolean(r));
            const permissions = [];
            const profile = {
                id: user.user_id,
                email: user.email,
                org_id: user.org_id,
                school_id: user.org_id,
                full_name: `${user.first_name} ${user.last_name || ''}`.trim(),
                roles,
                permissions: Array.from(permissions),
                login_status: 'APPROVED',
            };
            sessionCache.set(token, {
                profile,
                expiresAt: Date.now() + CACHE_TTL_MS,
            });
            return profile;
        }
        catch (err) {
            return null;
        }
    }
}
exports.SessionService = SessionService;
exports.sessionService = new SessionService();
