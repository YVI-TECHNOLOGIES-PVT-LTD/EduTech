"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionService = exports.SessionService = void 0;
const client_1 = require("@prisma/client");
const supabase_1 = require("../config/supabase");
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
            // 3. Fetch Roles & Permissions via database
            const roles = [];
            const permissions = new Set();
            try {
                const { data: rolesData, error: rolesError } = await supabase_1.supabase
                    .from('user_roles')
                    .select(`
            roles (
              id,
              name,
              code
            )
          `)
                    .eq('user_id', user.user_id);
                if (!rolesError && rolesData) {
                    rolesData.forEach((ur) => {
                        const roleObj = ur.roles;
                        if (roleObj) {
                            const rName = roleObj.name || roleObj.role_name || roleObj.code;
                            if (rName)
                                roles.push(rName);
                        }
                    });
                }
            }
            catch (e) {
                // Fallback silently
            }
            // Prisma fallback if Supabase returns 0 roles
            if (roles.length === 0) {
                try {
                    const userRolesPrisma = await prisma.user_roles.findMany({
                        where: { user_id: user.user_id },
                        include: { roles: true },
                    });
                    userRolesPrisma?.forEach((ur) => {
                        if (ur.roles) {
                            const rName = ur.roles.name || ur.roles.role_name || ur.roles.code;
                            if (rName)
                                roles.push(rName);
                        }
                    });
                }
                catch (e) {
                    // Fallback silently
                }
            }
            // Raw SQL query fallback
            if (roles.length === 0) {
                try {
                    const rawRoles = await prisma.$queryRaw `
            SELECT r.name, r.role_name, r.code, r.role_code
            FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.role_id
            WHERE ur.user_id = ${user.user_id}::uuid
          `;
                    rawRoles?.forEach((r) => {
                        const rName = r.name || r.role_name || r.code || r.role_code;
                        if (rName)
                            roles.push(rName);
                    });
                }
                catch (e) {
                    // Fallback silently
                }
            }
            // Default role fallback for registered parents
            if (roles.length === 0) {
                if (decoded.roles && decoded.roles.length > 0) {
                    roles.push(...decoded.roles);
                }
                else {
                    roles.push('PARENT');
                }
            }
            if (roles.includes('PARENT')) {
                permissions.add('admission.view_own');
                permissions.add('admission.create');
                permissions.add('admission.application.view_own');
                permissions.add('admission.application.create');
                permissions.add('admission.application.view');
            }
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
