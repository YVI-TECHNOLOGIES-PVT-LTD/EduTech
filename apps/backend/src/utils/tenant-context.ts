import { Request } from 'express';

/**
 * Extracts verified organization ID exclusively from trusted server-side middleware/session context.
 * Never reads unverified req.query.org_id, req.headers['x-tenant-id'], or hardcoded defaults.
 */
export function getAuthenticatedOrgId(req: Request): string | undefined {
  const anyReq = req as Request & {
    tenantOrgId?: string;
    context?: { user?: { org_id?: string | null; school_id?: string | null } };
    user?: { org_id?: string | null; school_id?: string | null };
  };

  const orgId =
    anyReq.tenantOrgId ||
    anyReq.context?.user?.org_id ||
    anyReq.context?.user?.school_id ||
    anyReq.user?.org_id ||
    anyReq.user?.school_id ||
    undefined;

  return typeof orgId === 'string' && orgId.trim() !== '' ? orgId.trim() : undefined;
}

export function requireAuthenticatedOrgId(req: Request): string {
  const orgId = getAuthenticatedOrgId(req);
  if (!orgId) {
    const err = new Error('Authenticated tenant organization context is required.');
    (err as Error & { statusCode?: number; code?: string }).statusCode = 403;
    (err as Error & { statusCode?: number; code?: string }).code = 'TENANT_CONTEXT_MISSING';
    throw err;
  }
  return orgId;
}
