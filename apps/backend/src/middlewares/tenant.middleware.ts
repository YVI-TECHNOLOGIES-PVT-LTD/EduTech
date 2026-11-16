import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prismaClient';
import { logger } from '../utils/logger';
import { normalizeRoles } from '../rbac/role-normalization';

export interface TenantRequest extends Request {
  tenantOrgId?: string;
  tenantResolutionSource?: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PLACEHOLDER_TENANT_VALUES = new Set(['', 'undefined', 'null', 'school-main', 'org-main']);

function sanitizeCandidate(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || PLACEHOLDER_TENANT_VALUES.has(trimmed.toLowerCase())) {
    return undefined;
  }
  return trimmed;
}

function getExplicitHeaderTenant(req: Request): string | undefined {
  return (
    sanitizeCandidate(req.headers['x-tenant-id']) ||
    sanitizeCandidate(req.headers['x-school-id']) ||
    sanitizeCandidate(req.headers['x-org-id'])
  );
}

function getExplicitQueryTenant(req: Request): string | undefined {
  return sanitizeCandidate(req.query?.org_id) || sanitizeCandidate(req.query?.school_id);
}

function getExplicitBodyTenant(req: Request): string | undefined {
  if (!req.body || typeof req.body !== 'object') return undefined;
  return sanitizeCandidate(req.body.org_id) || sanitizeCandidate(req.body.school_id);
}

function hasSuperAdminPrivilege(user: { roles?: string[] } | undefined): boolean {
  if (!user?.roles?.length) return false;
  const normalized = normalizeRoles(user.roles);
  return normalized.includes('SUPERADMIN') || normalized.includes('SUPER_ADMIN');
}

async function resolveActiveOrgByIdentifier(identifier: string): Promise<string | null> {
  if (UUID_REGEX.test(identifier)) {
    const org = await prisma.organizations.findFirst({
      where: { org_id: identifier, status: 'active' },
      select: { org_id: true },
    });
    return org?.org_id || null;
  }

  const orgByCode = await prisma.organizations.findFirst({
    where: { org_code: { equals: identifier, mode: 'insensitive' }, status: 'active' },
    select: { org_id: true },
  });
  return orgByCode?.org_id || null;
}

/**
 * Strict Tenant Isolation Middleware for Authenticated Routes.
 *
 * Security invariants:
 * 1. Never falls back to DEFAULT_ORG_ID, DEV_DEFAULT_ORG_ID, or an arbitrary active DB org.
 * 2. Trusted tenant identity originates strictly from verified req.context.user (DB-backed session).
 * 3. Rejects malformed tenant IDs (400) and cross-tenant header/query overrides from non-superadmin callers (403).
 */
export const resolveTenantMiddleware = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.context?.user;
    if (!user?.id) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authenticated user session is required before tenant resolution.',
      });
    }

    const sessionOrgId = sanitizeCandidate(user.org_id || user.school_id);
    if (!sessionOrgId || !UUID_REGEX.test(sessionOrgId)) {
      logger.warn('[TenantMiddleware] Authenticated user lacks a valid organization binding', {
        userId: user.id,
        path: req.originalUrl,
      });
      return res.status(403).json({
        error: 'TENANT_CONTEXT_MISSING',
        message: 'Authenticated account is not bound to a valid active organization.',
      });
    }

    const headerCandidate = getExplicitHeaderTenant(req);
    const queryCandidate = getExplicitQueryTenant(req);
    const isSuperAdmin = hasSuperAdminPrivilege(user);

    for (const candidate of [headerCandidate, queryCandidate]) {
      if (!candidate) continue;
      if (!UUID_REGEX.test(candidate)) {
        return res.status(400).json({
          error: 'INVALID_TENANT_ID',
          message: 'Provided tenant identifier is not a valid UUID.',
        });
      }
      if (candidate !== sessionOrgId && !isSuperAdmin) {
        logger.warn('[TenantMiddleware] Blocked cross-tenant header/query spoofing attempt', {
          userId: user.id,
          sessionOrgId,
          attemptedOrgId: candidate,
          path: req.originalUrl,
        });
        return res.status(403).json({
          error: 'TENANT_MISMATCH',
          message: 'Cross-tenant access denied: tenant override does not match user organization.',
        });
      }
    }

    const targetOrgId =
      isSuperAdmin && (headerCandidate || queryCandidate)
        ? (headerCandidate || queryCandidate)!
        : sessionOrgId;

    const orgExists = await prisma.organizations.findFirst({
      where: { org_id: targetOrgId, status: 'active' },
      select: { org_id: true },
    });

    if (!orgExists) {
      return res.status(403).json({
        error: 'TENANT_INACTIVE_OR_NOT_FOUND',
        message: 'Resolved organization is inactive or does not exist.',
      });
    }

    req.tenantOrgId = targetOrgId;
    req.tenantResolutionSource =
      targetOrgId !== sessionOrgId ? 'super_admin_override' : 'authenticated_session';
    user.org_id = targetOrgId;
    user.school_id = targetOrgId;

    return next();
  } catch (err: any) {
    logger.error('[TenantMiddleware] Tenant resolution error:', err);
    return res.status(500).json({
      error: 'TENANT_RESOLUTION_FAILED',
      message: 'Failed to verify tenant context.',
    });
  }
};

/**
 * Explicit Tenant Resolution Middleware for Public / Optional-Auth Onboarding Routes
 * (e.g., public parent registration, admission enquiries, public chatbot).
 *
 * - If authenticated, enforces identical strict isolation via resolveTenantMiddleware.
 * - If anonymous, requires an explicit org_id / school_id / org_code identifier and
 *   verifies it against active organizations. Zero silent DB/env fallbacks.
 */
export const resolvePublicTenantMiddleware = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.context?.user?.id) {
      return resolveTenantMiddleware(req, res, next);
    }

    const explicitIdentifier =
      getExplicitHeaderTenant(req) || getExplicitQueryTenant(req) || getExplicitBodyTenant(req);

    if (!explicitIdentifier) {
      return res.status(400).json({
        error: 'TENANT_REQUIRED',
        message:
          'Explicit organization identifier (org_id, school_id, or x-tenant-id) is required.',
      });
    }

    const resolvedOrgId = await resolveActiveOrgByIdentifier(explicitIdentifier);
    if (!resolvedOrgId) {
      return res.status(404).json({
        error: 'TENANT_NOT_FOUND',
        message: 'Specified organization was not found or is inactive.',
      });
    }

    req.tenantOrgId = resolvedOrgId;
    req.tenantResolutionSource = 'explicit_public_identifier';
    return next();
  } catch (err: any) {
    logger.error('[TenantMiddleware] Public tenant resolution error:', err);
    return res.status(500).json({
      error: 'TENANT_RESOLUTION_FAILED',
      message: 'Failed to resolve target organization.',
    });
  }
};
