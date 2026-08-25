import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prismaClient';

export interface TenantRequest extends Request {
  tenantOrgId?: string;
}

export const resolveTenantMiddleware = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const requestId = (req.headers['x-request-id'] ||
    req.headers['x-correlation-id'] ||
    crypto.randomUUID()) as string;

  try {
    const host = req.headers.host || '';
    let resolvedOrgId: string | null = null;
    let resolutionSource: string = 'none';

    // 1. Check authenticated user context if present (from authenticate / authenticateOptional)
    if (req.context?.user?.org_id || req.context?.user?.school_id) {
      resolvedOrgId = req.context.user.org_id || req.context.user.school_id;
      resolutionSource = 'user_context';
    }

    // 2. Check explicit request headers or query/body parameters
    if (!resolvedOrgId) {
      const explicitOrg = (req.headers['x-tenant-id'] ||
        req.headers['x-school-id'] ||
        req.headers['x-org-id'] ||
        req.query.school_id ||
        req.query.org_id ||
        (req.body && (req.body.school_id || req.body.org_id))) as string;

      if (explicitOrg && typeof explicitOrg === 'string') {
        const validOrg = await prisma.organizations.findFirst({
          where: {
            OR: [
              { org_id: explicitOrg },
              { org_code: { equals: explicitOrg, mode: 'insensitive' } },
            ],
          },
          select: { org_id: true },
        });
        if (validOrg) {
          resolvedOrgId = validOrg.org_id;
          resolutionSource = 'explicit_header_or_param';
        }
      }
    }

    // 3. Resolve via Host / Domain mapping if host is provided
    if (!resolvedOrgId && host) {
      const hostname = host.split(':')[0].toLowerCase();
      const subdomain = hostname.split('.')[0];
      // Skip generic cloud host subdomains (e.g. render, onrender, netlify, localhost, vercel)
      const isCloudOrLocal =
        subdomain === 'localhost' ||
        subdomain === '127' ||
        subdomain === 'edutrack' ||
        hostname.includes('onrender.com') ||
        hostname.includes('netlify.app') ||
        hostname.includes('vercel.app');

      if (subdomain && !isCloudOrLocal) {
        const org = await prisma.organizations.findFirst({
          where: {
            OR: [
              { org_code: { equals: subdomain, mode: 'insensitive' } },
              { website: { contains: hostname, mode: 'insensitive' } },
            ],
            status: 'active',
          },
          select: { org_id: true },
        });
        if (org) {
          resolvedOrgId = org.org_id;
          resolutionSource = 'subdomain_match';
        }
      }
    }

    // 4. Environment-configured default fallback
    if (!resolvedOrgId) {
      if (process.env.DEFAULT_ORG_ID) {
        resolvedOrgId = process.env.DEFAULT_ORG_ID;
        resolutionSource = 'env_DEFAULT_ORG_ID';
      } else if (process.env.DEV_DEFAULT_ORG_ID) {
        resolvedOrgId = process.env.DEV_DEFAULT_ORG_ID;
        resolutionSource = 'env_DEV_DEFAULT_ORG_ID';
      }
    }

    // 5. Active database organization fallback (ensures public forms work on cloud hosting platforms)
    if (!resolvedOrgId) {
      const activeOrg =
        (await prisma.organizations.findFirst({
          where: { status: 'active' },
          select: { org_id: true },
        })) ||
        (await prisma.organizations.findFirst({
          select: { org_id: true },
        }));

      if (activeOrg) {
        resolvedOrgId = activeOrg.org_id;
        resolutionSource = 'active_db_fallback';
      }
    }

    console.log('[TENANT-RESOLVE-AUDIT]', {
      requestId,
      resolvedOrgId,
      resolutionSource,
      hasAuthUser: !!req.context?.user,
      authUserId: req.context?.user?.id || 'anonymous',
      path: req.path,
      host,
    });

    if (!resolvedOrgId) {
      console.error('[TENANT-RESOLVE-FAILED-400]', {
        requestId,
        path: req.path,
        host,
      });
      res.status(400).json({
        error: 'Tenant Context Resolution Failed',
        message: 'Could not resolve a valid tenant organization for this domain.',
        requestId,
      });
      return;
    }

    req.tenantOrgId = resolvedOrgId;
    (req as any).context = {
      ...(req.context || {}),
      school_id: resolvedOrgId,
      org_id: resolvedOrgId,
    };

    next();
  } catch (error: any) {
    console.error('[Tenant Middleware Error]:', {
      requestId,
      error: error?.message || error,
      stack: error?.stack,
    });
    res.status(500).json({ error: 'Tenant resolution error', message: error.message, requestId });
  }
};
