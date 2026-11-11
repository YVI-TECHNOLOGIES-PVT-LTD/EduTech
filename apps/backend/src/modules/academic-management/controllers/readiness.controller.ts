import { Request, Response } from 'express';
import { AcademicReadinessService } from '../services/readiness.service';
import {
  getReadinessFindingsSchema,
  academicYearIdParamSchema,
} from '../dto/request/readiness.dto';
import { AcademicError } from '../errors/academic.errors';
import { ResponseHelper } from '../utils/response.helper';

function extractOrgId(req: Request): string {
  const orgId =
    (req as any).context?.user?.org_id ||
    (req as any).context?.user?.school_id ||
    (req as any).tenantOrgId;
  if (!orgId) {
    throw new AcademicError('Tenant context is required', 401, 'UNAUTHORIZED');
  }
  return orgId;
}

export class AcademicReadinessController {
  /**
   * GET /v1/academic/readiness/overview
   */
  static async getOverview(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const result = await AcademicReadinessService.getTenantOverview(orgId);
      return ResponseHelper.sendSuccess(res, result, undefined, 200);
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

  /**
   * GET /v1/academic/readiness/:academicYearId
   */
  static async getYearReadiness(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const paramCheck = academicYearIdParamSchema.safeParse(req.params);
      if (!paramCheck.success) {
        return ResponseHelper.sendError(
          res,
          'Invalid academic year ID parameter',
          400,
          'VALIDATION_FAILED',
        );
      }

      const report = await AcademicReadinessService.validateAcademicYear(
        orgId,
        paramCheck.data.academicYearId,
      );
      return ResponseHelper.sendSuccess(res, report, undefined, 200);
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

  /**
   * GET /v1/academic/readiness/:academicYearId/categories
   */
  static async getCategories(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const paramCheck = academicYearIdParamSchema.safeParse(req.params);
      if (!paramCheck.success) {
        return ResponseHelper.sendError(
          res,
          'Invalid academic year ID parameter',
          400,
          'VALIDATION_FAILED',
        );
      }

      const categories = await AcademicReadinessService.getCategories(
        orgId,
        paramCheck.data.academicYearId,
      );
      return ResponseHelper.sendSuccess(res, categories, undefined, 200);
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

  /**
   * GET /v1/academic/readiness/:academicYearId/findings
   */
  static async getFindings(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const paramCheck = academicYearIdParamSchema.safeParse(req.params);
      if (!paramCheck.success) {
        return ResponseHelper.sendError(
          res,
          'Invalid academic year ID parameter',
          400,
          'VALIDATION_FAILED',
        );
      }

      const queryCheck = getReadinessFindingsSchema.safeParse(req.query);
      if (!queryCheck.success) {
        return ResponseHelper.sendError(
          res,
          'Invalid query parameters for readiness findings',
          400,
          'VALIDATION_FAILED',
          queryCheck.error.format(),
        );
      }

      const result = await AcademicReadinessService.getFindings(
        orgId,
        paramCheck.data.academicYearId,
        queryCheck.data,
      );
      return ResponseHelper.sendSuccess(
        res,
        result.items,
        {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
        200,
      );
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

  /**
   * POST /v1/academic/readiness/:academicYearId/validate
   * Runs the full validation engine and returns computed results (read-only execution)
   */
  static async validate(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const paramCheck = academicYearIdParamSchema.safeParse(req.params);
      if (!paramCheck.success) {
        return ResponseHelper.sendError(
          res,
          'Invalid academic year ID parameter',
          400,
          'VALIDATION_FAILED',
        );
      }

      const report = await AcademicReadinessService.validateAcademicYear(
        orgId,
        paramCheck.data.academicYearId,
      );
      return ResponseHelper.sendSuccess(res, report, undefined, 200);
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

  /**
   * GET /v1/academic/readiness/:academicYearId/dependencies
   */
  static async getDependencies(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const paramCheck = academicYearIdParamSchema.safeParse(req.params);
      if (!paramCheck.success) {
        return ResponseHelper.sendError(
          res,
          'Invalid academic year ID parameter',
          400,
          'VALIDATION_FAILED',
        );
      }

      const graph = await AcademicReadinessService.getDependencyGraph(
        orgId,
        paramCheck.data.academicYearId,
      );
      return ResponseHelper.sendSuccess(res, graph, undefined, 200);
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

  /**
   * POST /v1/academic/readiness/:academicYearId/publish
   * Guarded endpoint returning HTTP 501 for monolithic setup publishing
   */
  static publishUnsupported(req: Request, res: Response) {
    try {
      AcademicReadinessService.handlePublishUnsupported();
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
