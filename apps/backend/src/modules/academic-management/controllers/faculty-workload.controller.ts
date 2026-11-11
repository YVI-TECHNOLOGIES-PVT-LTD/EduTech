import { Request, Response } from 'express';
import { FacultyWorkloadService } from '../services/faculty-workload.service';
import { listFacultyWorkloadSchema } from '../dto/request/timetable.dto';
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

export class FacultyWorkloadController {
  /**
   * GET /v1/academic/faculty-workload
   */
  static async list(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const parsed = listFacultyWorkloadSchema.safeParse(req.query);
      if (!parsed.success) {
        return ResponseHelper.sendError(
          res,
          'Validation failed for faculty workload query parameters',
          400,
          'VALIDATION_FAILED',
          parsed.error.format(),
        );
      }

      const result = await FacultyWorkloadService.getWorkloadList(orgId, parsed.data);
      return ResponseHelper.sendSuccess(res, result.items, result.meta, 200);
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
   * GET /v1/academic/faculty-workload/:id
   */
  static async getById(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const { id } = req.params;
      const { academic_year_id } = req.query;

      const result = await FacultyWorkloadService.getWorkloadById(
        orgId,
        id,
        typeof academic_year_id === 'string' ? academic_year_id : undefined,
      );
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
}
