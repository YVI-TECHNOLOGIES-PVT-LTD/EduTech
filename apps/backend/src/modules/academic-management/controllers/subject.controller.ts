import { Request, Response } from 'express';
import { SubjectService } from '../services/subject.service';
import { listSubjectsSchema } from '../dto/request/subject.dto';
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

export class SubjectController {
  /**
   * GET /v1/academic/subjects
   * List paginated subjects with search and category filter
   */
  static async list(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const parsed = listSubjectsSchema.safeParse(req.query);
      if (!parsed.success) {
        return ResponseHelper.sendError(
          res,
          'Validation failed for subject query parameters',
          400,
          'VALIDATION_FAILED',
          parsed.error.format(),
        );
      }

      const result = await SubjectService.listSubjects(orgId, parsed.data);
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
   * GET /v1/academic/subjects/categories
   * List subject categories for the tenant
   */
  static async listCategories(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const result = await SubjectService.listCategories(orgId);
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
   * GET /v1/academic/subjects/:id
   * Get single subject details
   */
  static async getById(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const { id } = req.params;
      const result = await SubjectService.getSubjectById(orgId, id);
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
   * GET /v1/academic/classes/:id/subjects
   * List subjects offered for an academic year grade
   */
  static async getGradeSubjects(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const { id } = req.params;
      const result = await SubjectService.getGradeSubjects(orgId, id);
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
   * GET /v1/academic/subjects/:id/resources
   * List digital resources mapped to a subject
   */
  static async getResources(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const { id } = req.params;
      const result = await SubjectService.getSubjectResources(orgId, id);
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
   * POST /v1/academic/subjects
   * Explicit 501 handler for unsupported writes
   */
  static createUnsupported(req: Request, res: Response) {
    try {
      SubjectService.handleSubjectCreateUnsupported();
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
