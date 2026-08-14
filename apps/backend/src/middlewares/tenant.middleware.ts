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
  try {
    const host = req.headers.host || '';
    let resolvedOrgId: string | null = null;

    // 1. Check authenticated user context if present
    if (req.context?.user?.org_id || req.context?.user?.school_id) {
      resolvedOrgId = req.context.user.org_id || req.context.user.school_id;
    }

    // 2. Resolve via Host / Domain mapping if host is provided
    if (!resolvedOrgId && host) {
      const hostname = host.split(':')[0].toLowerCase();
      // Look up organization matching custom domain or org_code
      const subdomain = hostname.split('.')[0];
      if (subdomain && subdomain !== 'localhost' && subdomain !== '127' && subdomain !== 'edutrack') {
        const org = await prisma.organizations.findFirst({
          where: {
            OR: [{ org_code: { equals: subdomain, mode: 'insensitive' } }, { website: { contains: hostname, mode: 'insensitive' } }],
            status: 'active',
          },
          select: { org_id: true },
        });
        if (org) {
          resolvedOrgId = org.org_id;
        }
      }
    }

    // 3. Environment-based resolution
    const isProduction = process.env.NODE_ENV === 'production';

    if (!resolvedOrgId) {
      // In development / testing, check configured DEV_DEFAULT_ORG_ID or explicit query params
      const queryOrg = (req.query.school_id || req.query.org_id || req.headers['x-tenant-id']) as string;
      if (queryOrg) {
        const validOrg = await prisma.organizations.findUnique({
          where: { org_id: queryOrg },
          select: { org_id: true },
        });
        if (validOrg) {
          resolvedOrgId = validOrg.org_id;
        }
      }

      if (!resolvedOrgId && process.env.DEV_DEFAULT_ORG_ID) {
        resolvedOrgId = process.env.DEV_DEFAULT_ORG_ID;
      }

      if (!resolvedOrgId && !isProduction) {
        // Controlled development fallback
        const devOrg = await prisma.organizations.findFirst({
          where: { status: 'active' },
          select: { org_id: true },
        });
        if (devOrg) {
          resolvedOrgId = devOrg.org_id;
          console.warn(`[DEV TENANT WARNING] Using active organization fallback: ${resolvedOrgId}`);
        }
      }
    }

    if (!resolvedOrgId) {
      res.status(400).json({
        error: 'Tenant Context Resolution Failed',
        message: 'Could not resolve a valid tenant organization for this domain.',
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
    console.error('[Tenant Middleware Error]:', error);
    res.status(500).json({ error: 'Tenant resolution error', message: error.message });
  }
};
