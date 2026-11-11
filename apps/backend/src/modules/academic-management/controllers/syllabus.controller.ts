import { Request, Response } from 'express';
import { SyllabusService } from '../services/syllabus.service';
import { listCurriculumSchema } from '../dto/request/curriculum.dto';
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

export class SyllabusController {
  /**
   * GET /v1/academic/syllabus
   * List syllabi with subject and grade filters
   */
  static async list(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const parsed = listCurriculumSchema.safeParse(req.query);
      if (!parsed.success) {
        return ResponseHelper.sendError(
          res,
          'Validation failed for syllabus query parameters',
          400,
          'VALIDATION_FAILED',
          parsed.error.format(),
        );
      }

      const result = await SyllabusService.listSyllabus(orgId, parsed.data);
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
   * GET /v1/academic/syllabus/:id
   * Get full hierarchical syllabus tree (units, sequence, duration, learning outcomes, Bloom level)
   */
  static async getById(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const { id } = req.params;
      const result = await SyllabusService.getSyllabusDetails(orgId, id);
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
   * GET /v1/academic/syllabus/:id/coverage
   * Get derived read-only syllabus coverage progression
   */
  static async getCoverage(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const { id } = req.params;
      const result = await SyllabusService.getSyllabusCoverage(orgId, id);
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
   * POST /v1/academic/syllabus/:id/coverage
   * Explicit 501 handler for write-based coverage tracking
   */
  static logCoverageUnsupported(req: Request, res: Response) {
    try {
      SyllabusService.handleCoverageLogUnsupported();
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
