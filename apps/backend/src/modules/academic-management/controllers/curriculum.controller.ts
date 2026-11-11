import { Request, Response } from 'express';
import { CurriculumService } from '../services/curriculum.service';
import {
  listCurriculumSchema,
  updateCurriculumStatusSchema,
  updateCurriculumPlanSchema,
} from '../dto/request/curriculum.dto';
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

export class CurriculumController {
  /**
   * GET /v1/academic/curriculum
   * List paginated curriculum plans with filtering
   */
  static async list(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const parsed = listCurriculumSchema.safeParse(req.query);
      if (!parsed.success) {
        return ResponseHelper.sendError(
          res,
          'Validation failed for curriculum query parameters',
          400,
          'VALIDATION_FAILED',
          parsed.error.format(),
        );
      }

      const result = await CurriculumService.listCurriculum(orgId, parsed.data);
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
   * GET /v1/academic/curriculum/:id
   * Get single curriculum plan details with units and outcomes
   */
  static async getById(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const { id } = req.params;
      const result = await CurriculumService.getCurriculumStructure(orgId, id);
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
   * PATCH /v1/academic/curriculum/:id/status
   * Transition curriculum plan status
   */
  static async updateStatus(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const actorId = extractUserId(req);
      const { id } = req.params;

      const parsed = updateCurriculumStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return ResponseHelper.sendError(
          res,
          'Validation failed for status update',
          400,
          'VALIDATION_FAILED',
          parsed.error.format(),
        );
      }

      const result = await CurriculumService.updateStatus(orgId, id, parsed.data, actorId);
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
   * PATCH /v1/academic/curriculum/:id
   * Update draft curriculum plan metadata
   */
  static async updatePlan(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const actorId = extractUserId(req);
      const { id } = req.params;

      const parsed = updateCurriculumPlanSchema.safeParse(req.body);
      if (!parsed.success) {
        return ResponseHelper.sendError(
          res,
          'Validation failed for plan update',
          400,
          'VALIDATION_FAILED',
          parsed.error.format(),
        );
      }

      const result = await CurriculumService.updatePlan(orgId, id, parsed.data, actorId);
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
   * GET /v1/academic/curriculum/overview
   * Consolidated overview of academic planning and curriculum
   */
  static async getOverview(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const result = await CurriculumService.getCurriculumOverview(orgId);
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
