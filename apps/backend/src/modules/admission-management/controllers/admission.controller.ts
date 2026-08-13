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
      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
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

      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
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
      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
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

      const searchParams = { ...parsed.data };
      const isOnlyParent =
        user?.roles?.includes('PARENT') &&
        !user?.roles?.some((r) =>
          ['ADMIN', 'FRONT_OFFICE', 'ADMISSION_OFFICER', 'STAFF'].includes(r),
        );
      if (isOnlyParent || req.query.mine === 'true' || req.query.mine === '1') {
        if (user?.id) {
          searchParams.created_by = user.id;
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

  static async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: 'Status parameter is required' });
      }

      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await AdmissionService.updateStatus(id, status as application_status, userId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
