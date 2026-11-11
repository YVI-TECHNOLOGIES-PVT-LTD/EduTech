import { Request, Response } from 'express';
import { SuperAdminRepository } from '../repositories/super-admin.repository';
import { ResponseHelper } from '../utils/response.helper';
import { AcademicError } from '../errors/academic.errors';

function extractOrgId(req: Request): string {
  const user = (req as any).context?.user;
  const orgId = user?.org_id || user?.school_id || (req as any).tenantOrgId;
  if (!orgId) {
    throw new AcademicError('Tenant context is required', 401, 'UNAUTHORIZED');
  }
  return orgId;
}

export class SuperAdminController {
  /**
   * GET /v1/academic/superadmin/overview
   */
  static async getAcademicOverview(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const user = (req as any).context?.user;
      const roles: string[] = user?.roles || [];

      const isSuperAdmin = roles.some((r) => ['SUPERADMIN', 'SUPER_ADMIN'].includes(r));
      if (!isSuperAdmin) {
        throw new AcademicError(
          'Forbidden: Only Super Administrator can access cross-organizational academic oversight.',
          403,
          'FORBIDDEN',
        );
      }

      const overview = await SuperAdminRepository.getAcademicOverview(orgId);
      return ResponseHelper.sendSuccess(res, overview, undefined, 200);
    } catch (error: any) {
      if (error instanceof AcademicError) {
        return ResponseHelper.sendError(
          res,
          error.message,
          error.statusCode,
          error.code,
          error.details,
        );
      }
      return ResponseHelper.sendError(
        res,
        error.message || 'Internal server error',
        500,
        'INTERNAL_ERROR',
      );
    }
  }
}
