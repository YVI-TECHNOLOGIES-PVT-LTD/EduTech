import { Request, Response } from 'express';
import { SectionService } from '../services/section.service';
import { createSectionSchema } from '../dto/request/create-section.dto';
import { updateSectionSchema } from '../dto/request/update-section.dto';
import { assignClassTeacherSchema } from '../dto/request/assign-class-teacher.dto';
import { listSectionsSchema } from '../dto/request/search-academic.dto';
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

export class SectionController {
  static async create(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const parsed = createSectionSchema.safeParse(req.body);
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
      const result = await SectionService.createSection(orgId, parsed.data, userId);
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
      const result = await SectionService.getSectionById(orgId, id);
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
      const queryParsed = listSectionsSchema.safeParse(req.query);
      const query = queryParsed.success ? queryParsed.data : ({} as any);

      const result = await SectionService.getAllSections(orgId, {
        academic_year_id: query.academic_year_id,
        academic_year_grade_id: query.academic_year_grade_id,
        grade_id: query.grade_id,
        search: query.search,
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
      const parsed = updateSectionSchema.safeParse(req.body);
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
      const result = await SectionService.updateSection(orgId, id, parsed.data, userId);
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

  static async assignClassTeacher(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const { id } = req.params;
      const parsed = assignClassTeacherSchema.safeParse(req.body);
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
      const staffId = parsed.data.staff_id !== undefined ? parsed.data.staff_id : null;
      const result = await SectionService.assignClassTeacher(orgId, id, staffId, userId);
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

  static async getByAcademicYearGrade(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const { academicYearGradeId } = req.params;
      const result = await SectionService.getSectionsByAcademicYearGrade(
        orgId,
        academicYearGradeId,
      );
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

  static async delete(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const { id } = req.params;
      await SectionService.deleteSection(orgId, id);
      return ResponseHelper.sendSuccess(res, { message: 'Section deleted successfully' });
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
