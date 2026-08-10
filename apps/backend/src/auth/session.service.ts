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

      // 3. Fetch User Roles via Prisma ORM
      const userRolesData = await prisma.user_roles.findMany({
        where: { user_id: user.user_id },
        include: {
          roles: true,
        },
      });

      const roles: string[] = userRolesData
        .map((ur) => ur.roles?.role_name)
        .filter((r): r is string => Boolean(r));

      const permissions: string[] = [];

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
