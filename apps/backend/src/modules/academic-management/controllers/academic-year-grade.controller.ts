import { Request, Response } from 'express';
import { AcademicYearGradeService } from '../services/academic-year-grade.service';
import { createAcademicYearGradeSchema } from '../dto/request/create-academic-year-grade.dto';
import { updateAcademicYearGradeSchema } from '../dto/request/update-academic-year-grade.dto';
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

export class AcademicYearGradeController {
  static async create(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const academicYearIdFromParam = req.params.academicYearId;

      const payload = {
        ...req.body,
        ...(academicYearIdFromParam ? { academic_year_id: academicYearIdFromParam } : {}),
      };

      const parsed = createAcademicYearGradeSchema.safeParse(payload);
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
      const result = await AcademicYearGradeService.createAcademicYearGrade(
        orgId,
        parsed.data,
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
      const result = await AcademicYearGradeService.getAcademicYearGradeById(orgId, id);
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

  static async update(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const { id } = req.params;
      const parsed = updateAcademicYearGradeSchema.safeParse(req.body);
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
      const result = await AcademicYearGradeService.updateAcademicYearGrade(
        orgId,
        id,
        parsed.data,
        userId,
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

  static async getByAcademicYear(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const academicYearId = req.params.academicYearId || req.params.id;
      const result = await AcademicYearGradeService.getAcademicYearGradesByYear(
        orgId,
        academicYearId,
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
      await AcademicYearGradeService.deleteAcademicYearGrade(orgId, id);
      return ResponseHelper.sendSuccess(res, { message: 'Grade offering removed successfully' });
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
