import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { env } from '../config/env';

export interface UserProfile {
    id: string;
    email: string;
    school_id: string;
    full_name: string;
    roles: string[];
    permissions: string[];
    login_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';
}

interface CachedSession {
    profile: UserProfile;
    expiresAt: number;
}

const sessionCache = new Map<string, CachedSession>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

export class SessionService {
    async validateSession(token: string): Promise<UserProfile | null> {
        const cached = sessionCache.get(token);
        if (cached && cached.expiresAt > Date.now()) {
            console.log(`[Session Cache] Hit for user: ${cached.profile.email}`);
            return cached.profile;
        }

        try {
            // 1. Verify Auth User (validates JWT)
            const urlMatch = env.SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase/);
            const projectRef = urlMatch ? urlMatch[1] : 'unknown';
            console.log(`[Session] Attempting JWT validation against Supabase URL: ${env.SUPABASE_URL} (Ref: ${projectRef})`);

            const { data: authData, error: authError } = await supabase.auth.getUser(token);
            if (authError || !authData.user) {
                console.error(`[Session] Supabase Auth validation failed against ${env.SUPABASE_URL}. Error:`, authError?.message || 'No user data returned');
                return null;
            }

            console.log(`[Session] Supabase Auth validation succeeded for user: ${authData.user.email} (ID: ${authData.user.id})`);

            const userId = authData.user.id;

            // 2. Fetch Profile directly via Service Role (bypasses RLS)
            console.log(`[Session Diagnostic] Initiating query against public.users for ID: ${userId}`);
            console.log(`- Exact Query: supabase.from('users').select('*').eq('id', '${userId}').single()`);
            console.log(`- Selected Columns: *`);
            console.log(`- Filters: id = ${userId}`);

            const { data: user, error: userError, status: userStatus } = await supabase
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
            const { data: rolesData, error: rolesError } = await supabase
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

            const roles: string[] = [];
            const permissions = new Set<string>();

            rolesData?.forEach((ur: any) => {
                const role = ur.roles;
                if (role) {
                    roles.push(role.name);
                    role.role_permissions?.forEach((rp: any) => {
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

        } catch (err) {
            console.error('[Session] Unexpected validation error:', err);
            return null;
        }
    }

    getUserClient(token: string): SupabaseClient {
        return createClient(env.SUPABASE_URL, env.SUPABASE_KEY, {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        });
    }
}

export const sessionService = new SessionService();
