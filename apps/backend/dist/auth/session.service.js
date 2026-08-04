"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionService = exports.SessionService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabase_1 = require("../config/supabase");
const env_1 = require("../config/env");
const sessionCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL
class SessionService {
    async validateSession(token) {
        const cached = sessionCache.get(token);
        if (cached && cached.expiresAt > Date.now()) {
            console.log(`[Session Cache] Hit for user: ${cached.profile.email}`);
            return cached.profile;
        }
        try {
            // 1. Verify Auth User (validates JWT)
            const urlMatch = env_1.env.SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase/);
            const projectRef = urlMatch ? urlMatch[1] : 'unknown';
            console.log(`[Session] Attempting JWT validation against Supabase URL: ${env_1.env.SUPABASE_URL} (Ref: ${projectRef})`);
            const { data: authData, error: authError } = await supabase_1.supabase.auth.getUser(token);
            if (authError || !authData.user) {
                console.error(`[Session] Supabase Auth validation failed against ${env_1.env.SUPABASE_URL}. Error:`, authError?.message || 'No user data returned');
                return null;
            }
            console.log(`[Session] Supabase Auth validation succeeded for user: ${authData.user.email} (ID: ${authData.user.id})`);
            const userId = authData.user.id;
            // 2. Fetch Profile directly via Service Role (bypasses RLS)
            console.log(`[Session Diagnostic] Initiating query against public.users for ID: ${userId}`);
            console.log(`- Exact Query: supabase.from('users').select('*').eq('id', '${userId}').single()`);
            console.log(`- Selected Columns: *`);
            console.log(`- Filters: id = ${userId}`);
            const { data: user, error: userError, status: userStatus } = await supabase_1.supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            console.log(`[Session Diagnostic] Query completed with Status Code: ${userStatus}`);
            console.log(`- Returned Data: ${JSON.stringify(user)}`);
            console.log(`- Returned Data Is Null: ${user === null || user === undefined}`);
            console.log(`- Returned Error Object: ${JSON.stringify(userError)}`);
            console.log(`- PostgREST Error Code: ${userError?.code || 'None'}`);
            console.log(`- Error Message: ${userError?.message || 'None'}`);
            console.log(`- Error Details: ${userError?.details || 'None'}`);
            console.log(`- Error Hint: ${userError?.hint || 'None'}`);
            if (userError || !user) {
                console.warn(`[Session] User ${userId} (${authData.user.email}) found in Auth but missing in public.users table.`);
                return null;
            }
            if (user.status !== 'active') {
                console.warn(`[Session] User ${userId} is currently ${user.status}. Access denied.`);
                return null;
            }
            // 3. Fetch Roles & Permissions via recursive joins
            const { data: rolesData, error: rolesError } = await supabase_1.supabase
                .from('user_roles')
                .select(`
                    roles!inner (
                        name,
                        role_permissions (
                            permissions (
                                code
                            )
                        )
                    )
                `)
                .eq('user_id', userId);
            if (rolesError) {
                console.error('[Session] Error fetching roles/permissions:', rolesError);
            }
            const roles = [];
            const permissions = new Set();
            rolesData?.forEach((ur) => {
                const role = ur.roles;
                if (role) {
                    roles.push(role.name);
                    role.role_permissions?.forEach((rp) => {
                        if (rp.permissions?.code) {
                            permissions.add(rp.permissions.code);
                        }
                    });
                }
            });
            const finalProfile = {
                id: user.id,
                email: user.email,
                school_id: user.school_id,
                full_name: user.full_name,
                roles,
                permissions: Array.from(permissions),
                login_status: user.login_status || 'PENDING'
            };
            sessionCache.set(token, {
                profile: finalProfile,
                expiresAt: Date.now() + CACHE_TTL_MS
            });
            console.log(`[Session] Validated ${user.email}. Roles: ${roles.join(',')}. Perms Count: ${permissions.size}`);
            return finalProfile;
        }
        catch (err) {
            console.error('[Session] Unexpected validation error:', err);
            return null;
        }
    }
    getUserClient(token) {
        return (0, supabase_js_1.createClient)(env_1.env.SUPABASE_URL, env_1.env.SUPABASE_KEY, {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        });
    }
}
exports.SessionService = SessionService;
exports.sessionService = new SessionService();
