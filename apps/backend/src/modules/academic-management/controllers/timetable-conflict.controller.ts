import { Request, Response } from 'express';
import { TimetableConflictService } from '../services/timetable-conflict.service';
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

export class TimetableConflictController {
  /**
   * GET /v1/academic/timetables/:id/conflicts
   */
  static async getConflicts(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const { id } = req.params;

      const result = await TimetableConflictService.detectConflicts(orgId, id);
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
