import { Request, Response } from 'express';
import { GradeService } from '../services/grade.service';
import { createGradeSchema } from '../dto/request/create-grade.dto';
import { updateGradeSchema } from '../dto/request/update-grade.dto';
import { listGradesSchema } from '../dto/request/search-academic.dto';
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

function extractUserId(req: Request): string | null {
  return req.context?.user?.id || (req as any).user?.user_id || (req as any).user?.id || null;
}

export class GradeController {
  static async create(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const parsed = createGradeSchema.safeParse(req.body);
      if (!parsed.success) {
        return ResponseHelper.sendError(
          res,
          'Validation failed',
          400,
          'VALIDATION_FAILED',
          parsed.error.format(),
        );
      }

      const userId = extractUserId(req);
      const result = await GradeService.createGrade(
        orgId,
        { ...parsed.data, org_id: orgId },
        userId,
      );
      return ResponseHelper.sendSuccess(res, result, undefined, 201);
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

  static async getById(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const { id } = req.params;
      const result = await GradeService.getGradeById(orgId, id);
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

  static async getAll(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const queryParsed = listGradesSchema.safeParse(req.query);
      const query = queryParsed.success ? queryParsed.data : ({} as any);

      const result = await GradeService.getAllGrades(orgId, {
        search: query.search,
        board: query.board,
        is_active: query.is_active,
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

      return ResponseHelper.sendSuccess(res, result.items, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
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

  static async update(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const { id } = req.params;
      const parsed = updateGradeSchema.safeParse(req.body);
      if (!parsed.success) {
        return ResponseHelper.sendError(
          res,
          'Validation failed',
          400,
          'VALIDATION_FAILED',
          parsed.error.format(),
        );
      }

      const userId = extractUserId(req);
      const result = await GradeService.updateGrade(orgId, id, parsed.data, userId);
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
