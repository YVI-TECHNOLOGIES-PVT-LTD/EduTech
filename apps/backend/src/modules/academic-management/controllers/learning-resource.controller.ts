import { Request, Response } from 'express';
import { LearningResourceService } from '../services/learning-resource.service';
import { createResourceSchema } from '../dto/request/create-resource.dto';
import { updateResourceSchema } from '../dto/request/update-resource.dto';
import { listResourcesSchema } from '../dto/request/search-resource.dto';
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

export class LearningResourceController {
  /**
   * GET /v1/academic/resources
   * Lists paginated resources with filtering and sorting
   */
  static async list(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const queryParsed = listResourcesSchema.safeParse(req.query);
      if (!queryParsed.success) {
        return ResponseHelper.sendError(
          res,
          'Validation failed for resource query parameters',
          400,
          'VALIDATION_FAILED',
          queryParsed.error.format(),
        );
      }

      const result = await LearningResourceService.listResources(orgId, queryParsed.data);
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
   * GET /v1/academic/resources/categories
   * Returns active resource categories for the tenant
   */
  static async listCategories(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const categories = await LearningResourceService.listCategories(orgId);
      return ResponseHelper.sendSuccess(res, categories);
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
   * GET /v1/academic/resources/:id
   * Retrieves single resource details by ID
   */
  static async getById(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const { id } = req.params;
      const resource = await LearningResourceService.getResourceById(orgId, id);
      return ResponseHelper.sendSuccess(res, resource);
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
   * POST /v1/academic/resources
   * Creates or uploads a new learning resource
   */
  static async create(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const parsed = createResourceSchema.safeParse(req.body);
      if (!parsed.success) {
        return ResponseHelper.sendError(
          res,
          'Validation failed for resource creation',
          400,
          'VALIDATION_FAILED',
          parsed.error.format(),
        );
      }

      const userId = extractUserId(req);
      const resource = await LearningResourceService.createResource(
        orgId,
        parsed.data,
        req.file,
        userId,
      );
      return ResponseHelper.sendSuccess(res, resource, undefined, 201);
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
   * PATCH /v1/academic/resources/:id
   * Updates resource metadata and grade mappings
   */
  static async update(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const { id } = req.params;
      const parsed = updateResourceSchema.safeParse(req.body);
      if (!parsed.success) {
        return ResponseHelper.sendError(
          res,
          'Validation failed for resource update',
          400,
          'VALIDATION_FAILED',
          parsed.error.format(),
        );
      }

      const userId = extractUserId(req);
      const updated = await LearningResourceService.updateResource(orgId, id, parsed.data, userId);
      return ResponseHelper.sendSuccess(res, updated);
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
   * POST /v1/academic/resources/:id/archive
   * Archives a resource
   */
  static async archive(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const { id } = req.params;
      const userId = extractUserId(req);
      const archived = await LearningResourceService.archiveResource(orgId, id, userId);
      return ResponseHelper.sendSuccess(res, archived);
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
   * DELETE /v1/academic/resources/:id
   * Deletes a draft resource and its storage object
   */
  static async delete(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const { id } = req.params;
      const result = await LearningResourceService.deleteResource(orgId, id);
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
   * GET /v1/academic/resources/:id/preview
   * Returns short-lived signed preview URL
   */
  static async preview(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const { id } = req.params;
      const result = await LearningResourceService.getPreviewUrl(orgId, id);
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
   * GET /v1/academic/resources/:id/download
   * Returns short-lived signed download URL
   */
  static async download(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const { id } = req.params;
      const result = await LearningResourceService.getDownloadUrl(orgId, id);
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
   * Handlers for features classified as UNSUPPORTED BY FINALIZED DATABASE
   */
  static async handleSubjectMappingUnsupported(req: Request, res: Response) {
    return res.status(501).json({
      success: false,
      error: 'UNSUPPORTED_BY_FINALIZED_DATABASE',
      message:
        'Subject-Resource Junction Mappings are unsupported by the frozen Stage-1 physical database. Standalone subjects table lacks Stage-1 baseline and Prisma delegates.',
      status: 'UNSUPPORTED BY FINALIZED DATABASE',
      inspected_entities: {
        learning_resource_subjects: 'Requires Stage-2 subjects migration to link to subjects table',
        subjects: 'Missing Stage-1 physical table definition and generated Prisma delegate',
      },
    });
  }

  static async handleFrameworkMappingUnsupported(req: Request, res: Response) {
    return res.status(501).json({
      success: false,
      error: 'UNSUPPORTED_BY_FINALIZED_DATABASE',
      message:
        'Educational Framework mapping for resources is unsupported by the frozen Stage-1 physical database. Requires Stage-2 curriculum_frameworks migration.',
      status: 'UNSUPPORTED BY FINALIZED DATABASE',
      inspected_entities: {
        curriculum_frameworks:
          'Missing Stage-1 physical table definition and generated Prisma delegate',
      },
    });
  }
}
