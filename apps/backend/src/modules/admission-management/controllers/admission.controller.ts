import { Request, Response } from 'express';
import { application_status } from '@prisma/client';
import { AdmissionService } from '../services/admission.service';
import { createApplicationSchema } from '../dto/request/create-application.dto';
import { updateApplicationSchema } from '../dto/request/update-application.dto';
import { searchApplicationSchema } from '../dto/request/search-application.dto';
import { ApplicationError } from '../errors/admission.errors';

export class AdmissionController {
  static async create(req: Request, res: Response) {
    try {
      const parsed = createApplicationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const user = req.context?.user;
      const userId = user?.id || (req as any).user?.user_id || (req as any).user?.id || null;
      const userOrgId = user?.org_id || user?.school_id;
      const result = await AdmissionService.createApplication(parsed.data, userId, userOrgId);
      return res.status(201).json(result);
    } catch (error: any) {
      console.error('[AdmissionController.create Error]:', error);
      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({
        error: error.message || 'Internal server error',
        details: error.message,
        stack: error.stack,
      });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = req.context?.user;
      const orgId = user?.org_id || user?.school_id;
      const isOnlyParent =
        user?.roles?.includes('PARENT') &&
        !user?.roles?.some((r) =>
          ['ADMIN', 'FRONT_OFFICE', 'ADMISSION_OFFICER', 'STAFF'].includes(r),
        );
      const parentUserId = isOnlyParent ? user?.id : undefined;

      const result = await AdmissionService.getApplicationById(id, orgId, parentUserId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = updateApplicationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const user = req.context?.user || (req as any).user;
      const userId = user?.id || user?.user_id || null;
      const result = await AdmissionService.updateApplication(id, parsed.data, userId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = req.context?.user || (req as any).user;
      const userId = user?.id || user?.user_id || null;
      const result = await AdmissionService.deleteApplication(id, userId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async search(req: Request, res: Response) {
    try {
      const user = req.context?.user;
      const parsed = searchApplicationSchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Invalid search parameters',
          details: parsed.error.format(),
        });
      }

      const userId = user?.id || (req as any).user?.user_id || (req as any).user?.id;
      const searchParams = { ...parsed.data };
      const isOnlyParent =
        user?.roles?.includes('PARENT') &&
        !user?.roles?.some((r) =>
          ['ADMIN', 'FRONT_OFFICE', 'ADMISSION_OFFICER', 'STAFF'].includes(r),
        );
      if (isOnlyParent || req.query.mine === 'true' || req.query.mine === '1') {
        if (userId) {
          searchParams.created_by = userId;
        }
      }

      if (!searchParams.org_id && (user?.org_id || user?.school_id)) {
        searchParams.org_id = user.org_id || user.school_id;
      }

      const result = await AdmissionService.searchApplications(searchParams);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getMine(req: Request, res: Response) {
    try {
      const user = req.context?.user;
      const userId = user?.id || (req as any).user?.user_id || (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const orgId =
        (req.query.org_id as string) ||
        (req.query.school_id as string) ||
        user?.org_id ||
        user?.school_id;
      const searchParams: any = {
        created_by: userId,
        org_id: orgId,
        page: parseInt((req.query.page as string) || '1', 10),
        pageSize: parseInt((req.query.pageSize as string) || '50', 10),
        sort: (req.query.sort as string) || 'created_at',
        order: (req.query.order as string) || 'desc',
      };

      const result = await AdmissionService.searchApplications(searchParams);
      console.log('[AdmissionController.getMine]:', {
        userId,
        orgId,
        resultCount: result.data ? result.data.length : 0,
        total: result.meta ? result.meta.total : 0,
      });
      return res.json(result);
    } catch (error: any) {
      console.error('[AdmissionController.getMine Error]:', error);
      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: 'Status parameter is required' });
      }

      const user = req.context?.user || (req as any).user;
      const userId = user?.id || (req as any).user?.user_id || (req as any).user?.id || null;
      const userRoles = user?.roles || [];
      const isParentOnly =
        userRoles.includes('PARENT') &&
        !userRoles.some((r: string) =>
          ['ADMIN', 'FRONT_OFFICE', 'ADMISSION_OFFICER', 'STAFF', 'SUPERADMIN'].includes(r),
        );
      const result = await AdmissionService.updateStatus(
        id,
        status as application_status,
        userId,
        isParentOnly,
      );
      return res.json(result);
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
