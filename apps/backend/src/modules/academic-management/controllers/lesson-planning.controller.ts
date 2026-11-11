import { Request, Response } from 'express';
import { LessonPlanningService } from '../services/lesson-planning.service';
import {
  getLessonPlanningCurriculumSchema,
  getLessonPlanningUnitsSchema,
  getLessonPlanningOutcomesSchema,
  getLessonPlanningResourcesSchema,
  generateLessonPlanSchema,
  refineLessonPlanSchema,
  validateLessonPlanSchema,
  listLessonPlansSchema,
} from '../dto/request/lesson-planning.dto';
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

export class LessonPlanningController {
  /**
   * GET /v1/academic/lesson-planning/curriculum
   */
  static async getCurriculum(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const parsed = getLessonPlanningCurriculumSchema.safeParse(req.query);
      if (!parsed.success) {
        return ResponseHelper.sendError(
          res,
          'Validation failed for lesson planning curriculum query parameters',
          400,
          'VALIDATION_FAILED',
          parsed.error.format(),
        );
      }

      const result = await LessonPlanningService.getCurriculumPlans(orgId, parsed.data);
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
   * GET /v1/academic/lesson-planning/units
   */
  static async getUnits(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const parsed = getLessonPlanningUnitsSchema.safeParse(req.query);
      if (!parsed.success) {
        return ResponseHelper.sendError(
          res,
          'Validation failed for lesson planning units query parameters',
          400,
          'VALIDATION_FAILED',
          parsed.error.format(),
        );
      }

      const result = await LessonPlanningService.getUnits(orgId, parsed.data.curriculum_plan_id);
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
   * GET /v1/academic/lesson-planning/outcomes
   */
  static async getOutcomes(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const parsed = getLessonPlanningOutcomesSchema.safeParse(req.query);
      if (!parsed.success) {
        return ResponseHelper.sendError(
          res,
          'Validation failed for lesson planning outcomes query parameters',
          400,
          'VALIDATION_FAILED',
          parsed.error.format(),
        );
      }

      const result = await LessonPlanningService.getOutcomes(orgId, parsed.data.curriculum_unit_id);
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
   * GET /v1/academic/lesson-planning/resources
   */
  static async getResources(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const parsed = getLessonPlanningResourcesSchema.safeParse(req.query);
      if (!parsed.success) {
        return ResponseHelper.sendError(
          res,
          'Validation failed for lesson planning resources query parameters',
          400,
          'VALIDATION_FAILED',
          parsed.error.format(),
        );
      }

      const result = await LessonPlanningService.getResources(orgId, parsed.data);
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
   * POST /v1/academic/lesson-planning/generate
   */
  static async generate(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const parsed = generateLessonPlanSchema.safeParse(req.body);
      if (!parsed.success) {
        return ResponseHelper.sendError(
          res,
          'Validation failed for lesson plan generation payload',
          400,
          'VALIDATION_FAILED',
          parsed.error.format(),
        );
      }

      const result = await LessonPlanningService.generateLessonPlan(orgId, parsed.data);
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
   * POST /v1/academic/lesson-planning/refine
   */
  static async refine(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const parsed = refineLessonPlanSchema.safeParse(req.body);
      if (!parsed.success) {
        return ResponseHelper.sendError(
          res,
          'Validation failed for lesson plan refinement payload',
          400,
          'VALIDATION_FAILED',
          parsed.error.format(),
        );
      }

      const result = await LessonPlanningService.refineLessonPlan(orgId, parsed.data);
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
   * POST /v1/academic/lesson-planning/validate
   */
  static async validate(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const parsed = validateLessonPlanSchema.safeParse(req.body);
      if (!parsed.success) {
        return ResponseHelper.sendError(
          res,
          'Validation failed for lesson plan validation payload',
          400,
          'VALIDATION_FAILED',
          parsed.error.format(),
        );
      }

      const result = await LessonPlanningService.validateLessonPlanQuality(orgId, parsed.data);
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
   * GET /v1/academic/lesson-planning/plans
   */
  static async listPlans(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const parsed = listLessonPlansSchema.safeParse(req.query);
      if (!parsed.success) {
        return ResponseHelper.sendError(
          res,
          'Validation failed for saved lesson plans query parameters',
          400,
          'VALIDATION_FAILED',
          parsed.error.format(),
        );
      }

      const user = (req as any).context?.user;
      const requestingUser = user ? { userId: user.id, roles: user.roles || [] } : undefined;
      const result = await LessonPlanningService.listSavedPlans(orgId, parsed.data, requestingUser);
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
   * GET /v1/academic/lesson-planning/plans/:id
   */
  static async getPlanById(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const { id } = req.params;
      const user = (req as any).context?.user;
      const requestingUser = user ? { userId: user.id, roles: user.roles || [] } : undefined;
      const result = await LessonPlanningService.getSavedPlanById(orgId, id, requestingUser);
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

  // ── Guarded 501 Handlers for Unsupported Write Operations ──────────────
  static createPlanUnsupported(req: Request, res: Response) {
    try {
      LessonPlanningService.handlePlanCreateUnsupported();
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

  static updatePlanUnsupported(req: Request, res: Response) {
    try {
      LessonPlanningService.handlePlanUpdateUnsupported();
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

  static deletePlanUnsupported(req: Request, res: Response) {
    try {
      LessonPlanningService.handlePlanDeleteUnsupported();
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

  static submitPlanUnsupported(req: Request, res: Response) {
    try {
      LessonPlanningService.handlePlanSubmitUnsupported();
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

  static approvePlanUnsupported(req: Request, res: Response) {
    try {
      LessonPlanningService.handlePlanApproveUnsupported();
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
