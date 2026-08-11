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
            const { data: rolesData, error: rolesError } = await supabase_1.supabase
                .from('user_roles')
                .select(`
          roles (
            role_name,
            role_permissions (
              permissions (
                code
              )
            )
          )
        `)
                .eq('user_id', user.user_id);
            if (rolesError) {
                console.error('[SessionService] Error fetching roles/permissions:', rolesError);
            }
            const roles = [];
            const permissions = new Set();
            rolesData?.forEach((ur) => {
                const roleObj = ur.roles;
                if (roleObj) {
                    roles.push(roleObj.role_name || roleObj.name);
                    roleObj.role_permissions?.forEach((rp) => {
                        if (rp.permissions?.code) {
                            permissions.add(rp.permissions.code);
                        }
                    });
                }
            });
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
