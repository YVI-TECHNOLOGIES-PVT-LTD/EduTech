import { Request, Response } from 'express';
import { BoardService } from '../services/board.service';
import { updateBoardAffiliationSchema } from '../dto/request/update-board-affiliation.dto';
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

function extractUserId(req: Request): string | null {
  return (
    (req as any).context?.user?.id || (req as any).user?.user_id || (req as any).user?.id || null
  );
}

export class BoardController {
  /**
   * GET /v1/academic/boards
   * Returns institutional affiliation, active boards configured across grades, and standard catalog.
   */
  static async getOverview(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const result = await BoardService.getBoardOverview(orgId);
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

  /**
   * PATCH /v1/academic/boards/affiliation
   * Updates the school's institutional board affiliation in the physical organizations table.
   */
  static async updateAffiliation(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const parsed = updateBoardAffiliationSchema.safeParse(req.body);
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
      const result = await BoardService.updateBoardAffiliation(
        orgId,
        parsed.data.board_affiliation,
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

  /**
   * GET /v1/academic/boards/:boardCode/grades
   * Returns all grades for the tenant configured with a specific board code.
   */
  static async getGradesByBoard(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const { boardCode } = req.params;
      const result = await BoardService.getGradesForBoard(orgId, boardCode);
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

  /**
   * Handlers for features classified as UNSUPPORTED BY FINALIZED DATABASE.
   * Return HTTP 501 to prevent unpersisted fake responses or volatile RAM fallback.
   */
  static async handleFrameworksUnsupported(req: Request, res: Response) {
    return res.status(501).json({
      success: false,
      error: 'UNSUPPORTED_BY_FINALIZED_DATABASE',
      message:
        'Educational Frameworks (NEP 2020, Bloom Taxonomy, Competencies, Versions) are unsupported by the frozen Stage-1 physical database. Standalone framework persistence requires a Stage-2 DDL migration.',
      status: 'UNSUPPORTED BY FINALIZED DATABASE',
      inspected_entities: {
        curriculum_frameworks:
          'Missing Stage-1 physical table definition and generated Prisma delegate',
        curriculum_framework_versions:
          'Missing Stage-1 physical table definition and generated Prisma delegate',
      },
    });
  }

  static async handleSubjectsUnsupported(req: Request, res: Response) {
    return res.status(501).json({
      success: false,
      error: 'UNSUPPORTED_BY_FINALIZED_DATABASE',
      message:
        'Subject Master Catalog and Grade-Subject Junction Mappings are unsupported by the frozen Stage-1 physical database. Subject persistence requires a Stage-2 DDL migration.',
      status: 'UNSUPPORTED BY FINALIZED DATABASE',
      inspected_entities: {
        subjects: 'Missing Stage-1 physical table definition and generated Prisma delegate',
        subject_categories:
          'Missing Stage-1 physical table definition and generated Prisma delegate',
        academic_year_grade_subjects:
          'Missing Stage-1 physical table definition and generated Prisma delegate',
      },
    });
  }
}
