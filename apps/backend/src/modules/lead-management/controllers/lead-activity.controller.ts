import { Request, Response } from 'express';
import { LeadActivityService } from '../services/lead.activity.service';
import { createActivitySchema, updateActivitySchema } from '../dto/request/create-activity.dto';
import { LeadError } from '../errors/lead.errors';

export class LeadActivityController {
  static async create(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = createActivitySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const user = req.context?.user;
      const userId = user?.id || (req as any).user?.user_id || (req as any).user?.id || null;
      const orgId = user?.org_id || user?.school_id;
      const result = await LeadActivityService.createActivity(id, userId, parsed.data, orgId);
      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof LeadError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getByLeadId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = req.context?.user;
      const orgId = user?.org_id || user?.school_id;
      const result = await LeadActivityService.getActivitiesByLead(id, orgId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof LeadError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = updateActivitySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const user = req.context?.user;
      const orgId = user?.org_id || user?.school_id;
      const result = await LeadActivityService.updateActivity(id, parsed.data, orgId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof LeadError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = req.context?.user;
      const userId = user?.id || (req as any).user?.user_id || (req as any).user?.id || null;
      const orgId = user?.org_id || user?.school_id;
      const result = await LeadActivityService.deleteActivity(id, userId, orgId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof LeadError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getTimeline(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = req.context?.user;
      const orgId = user?.org_id || user?.school_id;
      const result = await LeadActivityService.getTimeline(id, orgId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof LeadError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
