import { Request, Response } from 'express';
import { AcademicAnalyticsService } from '../services/academic.analytics.service';
import { AcademicError } from '../errors/academic.errors';
import { ResponseHelper } from '../utils/response.helper';

function extractOrgId(req: Request): string {
  const orgId =
    req.context?.user?.org_id || req.context?.user?.school_id || (req as any).tenantOrgId;
  if (!orgId) {
    throw new AcademicError('Tenant context is required', 401, 'UNAUTHORIZED');
  }
  return orgId;
}

export class AcademicDashboardController {
  static async getOverview(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const result = await AcademicAnalyticsService.getOverview(orgId);
      return ResponseHelper.sendSuccess(res, result);
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

  static async getDashboard(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const result = await AcademicAnalyticsService.getDashboardMetrics(orgId);
      return ResponseHelper.sendSuccess(res, result);
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

  static async getStructureTree(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const { id } = req.params;
      const result = await AcademicAnalyticsService.getStructureTree(orgId, id);
      return ResponseHelper.sendSuccess(res, result);
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
