import { PrismaClient } from '@prisma/client';
import { supabase } from '../config/supabase';
import { AuthService, TokenPayload } from './auth.service';

const prisma = new PrismaClient();

export interface UserProfile {
  id: string;
  email: string;
  org_id: string;
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
      return cached.profile;
    }

    try {
      // 1. Verify Internal JWT Token
      const decoded: TokenPayload = AuthService.verifyToken(token);
      if (!decoded || !decoded.userId) return null;

      // 2. Fetch User Profile from public.users via Prisma ORM
      const user = await prisma.users.findUnique({
        where: { user_id: decoded.userId },
      });

      if (!user || user.status !== 'active') {
        return null;
      }

      // 3. Fetch Roles & Permissions via database
      const roles: string[] = [];
      const permissions = new Set<string>();

      try {
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select(
            `
            roles (
              id,
              name,
              code
            )
          `,
          )
          .eq('user_id', user.user_id);

        if (!rolesError && rolesData) {
          rolesData.forEach((ur: any) => {
            const roleObj = ur.roles;
            if (roleObj) {
              const rName = roleObj.name || roleObj.role_name || roleObj.code;
              if (rName) roles.push(rName);
            }
          });
        }
      } catch (e) {
        // Fallback silently
      }

      // Prisma fallback if Supabase returns 0 roles
      if (roles.length === 0) {
        try {
          const userRolesPrisma: any = await (prisma as any).user_roles.findMany({
            where: { user_id: user.user_id },
            include: { roles: true },
          });

          userRolesPrisma?.forEach((ur: any) => {
            if (ur.roles) {
              const rName = ur.roles.name || ur.roles.role_name || ur.roles.code;
              if (rName) roles.push(rName);
            }
          });
        } catch (e) {
          // Fallback silently
        }
      }

      // Raw SQL query fallback
      if (roles.length === 0) {
        try {
          const rawRoles: any[] = await prisma.$queryRaw`
            SELECT r.name, r.role_name, r.code, r.role_code
            FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.role_id
            WHERE ur.user_id = ${user.user_id}::uuid
          `;
          rawRoles?.forEach((r: any) => {
            const rName = r.name || r.role_name || r.code || r.role_code;
            if (rName) roles.push(rName);
          });
        } catch (e) {
          // Fallback silently
        }
      }

      // Default role fallback for registered parents
      if (roles.length === 0) {
        if (decoded.roles && decoded.roles.length > 0) {
          roles.push(...decoded.roles);
        } else {
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

      const profile: UserProfile = {
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
    } catch (err) {
      return null;
    }
  }
}

export const sessionService = new SessionService();
