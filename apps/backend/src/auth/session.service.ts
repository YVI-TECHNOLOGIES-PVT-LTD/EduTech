import prisma from '../lib/prismaClient';
import { AuthService, TokenPayload } from './auth.service';
import { logger } from '../utils/logger';

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
  /**
   * Deterministic Role Normalization
   * Maps raw database role strings or user-assigned strings to canonical runtime roles.
   */
  public static normalizeRoleName(rawRole?: string | null): string {
    if (!rawRole || typeof rawRole !== 'string') return '';
    const trimmed = rawRole.trim();
    const lower = trimmed.toLowerCase().replace(/[\s\-_]+/g, '');

    if (
      lower === 'frontoffice' ||
      lower === 'receptionist' ||
      lower === 'admissionofficer' ||
      lower === 'admissionsofficer' ||
      lower === 'frontofficeexecutive' ||
      lower === 'frontofficestaff' ||
      lower === 'admissionsdesk'
    ) {
      return 'FRONT_OFFICE';
    }
    if (lower === 'parent' || lower === 'guardian') {
      return 'PARENT';
    }
    if (lower === 'superadmin' || lower === 'superadministrator' || lower === 'super_admin') {
      return 'SUPERADMIN';
    }
    if (
      lower === 'admin' ||
      lower === 'administrator' ||
      lower === 'orgadmin' ||
      lower === 'org_admin'
    ) {
      return 'ADMIN';
    }
    if (lower === 'counselor' || lower === 'counsellor') {
      return 'COUNSELLOR';
    }
    if (lower === 'hoi' || lower === 'headofinstitute' || lower === 'principal') {
      return 'HOI';
    }
    if (lower === 'staff' || lower === 'faculty') {
      return 'STAFF';
    }

    return trimmed.toUpperCase().replace(/\s+/g, '_');
  }

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

      // 3. Fetch Roles & Permissions via Prisma ORM using exact schema columns (role_id, role_name, is_active)
      const roles: string[] = [];
      const permissions = new Set<string>();

      try {
        const userRolesPrisma = await prisma.user_roles.findMany({
          where: { user_id: user.user_id },
          include: { roles: true },
        });

        for (const ur of userRolesPrisma) {
          if (ur.roles && ur.roles.is_active !== false) {
            const canonical = SessionService.normalizeRoleName(ur.roles.role_name);
            if (canonical && !roles.includes(canonical)) {
              roles.push(canonical);
            }
          }
        }
      } catch (e) {
        logger.warn(`[SessionService] Error loading user_roles for user ${user.user_id}`, {
          error: (e as Error)?.message || String(e),
        });
      }

      // 4. Fallback to JWT claims if DB user_roles returns empty
      if (roles.length === 0 && decoded.roles && Array.isArray(decoded.roles)) {
        for (const r of decoded.roles) {
          const canonical = SessionService.normalizeRoleName(r);
          if (canonical && !roles.includes(canonical)) {
            roles.push(canonical);
          }
        }
      }

      // 5. Fallback to parent record check (Verifies user is a registered Parent)
      if (roles.length === 0) {
        const parentRecord = await prisma.parents.findUnique({
          where: { user_id: user.user_id },
        });
        if (parentRecord) {
          roles.push('PARENT');
        }
      }

      // 6. FAIL-CLOSED RULE: If user has no valid active role, reject session!
      // (DO NOT silently default unknown staff/admin users to PARENT)
      if (roles.length === 0) {
        logger.warn(
          `[SessionService] Fail-closed: User ${user.user_id} (${user.email}) has no valid active roles. Session rejected.`,
        );
        return null;
      }

      // 7. Inject Stage-1 Persona Permissions
      if (roles.includes('PARENT')) {
        permissions.add('admission.view_own');
        permissions.add('admission.create');
        permissions.add('admission.application.view_own');
        permissions.add('admission.application.create');
        permissions.add('admission.application.view');
      }

      if (
        roles.some((r) =>
          [
            'SUPERADMIN',
            'SUPER_ADMIN',
            'ADMIN',
            'ORG_ADMIN',
            'FRONT_OFFICE',
            'RECEPTIONIST',
            'ADMISSION_OFFICER',
            'ADMISSIONS_OFFICER',
            'COUNSELLOR',
            'COUNSELOR',
            'STAFF',
            'FACULTY',
            'HOI',
            'HEAD_OF_INSTITUTE',
            'PRINCIPAL',
          ].includes(r),
        )
      ) {
        permissions.add('admission.create');
        permissions.add('admission.view_all');
        permissions.add('admission.review');
        permissions.add('admission.document.view');
        permissions.add('admission.document.verify');
        permissions.add('admission.application.view');
        permissions.add('admission.application.create');
        permissions.add('admission.application.update');
        permissions.add('admission.application.delete');
        permissions.add('admission.enquiry.view');
        permissions.add('admission.enquiry.create');
        permissions.add('admission.leads.manage');
        permissions.add('admission.visitors.manage');
        permissions.add('admin.dashboard.view');
        permissions.add('fees.view');
        permissions.add('fees.payment.collect');
        permissions.add('fees.receipt.generate');
        permissions.add('fees.payment.view');
        permissions.add('fees.structure.view');
        permissions.add('admission.fees.initialize');
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
      logger.error('[SessionService] Session validation failed', {
        error: (err as Error)?.message || String(err),
      });
      return null;
    }
  }
}

export const sessionService = new SessionService();
