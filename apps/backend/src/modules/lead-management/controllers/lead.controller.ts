import { Request, Response } from 'express';
import { lead_stage } from '@prisma/client';
import { LeadService } from '../services/lead.service';
import { LeadLifecycleService } from '../services/lead.lifecycle.service';
import { LeadAssignmentService } from '../services/lead.assignment.service';
import { createLeadSchema } from '../dto/request/create-lead.dto';
import { updateLeadSchema } from '../dto/request/update-lead.dto';
import { assignLeadSchema, bulkAssignLeadSchema } from '../dto/request/assign-lead.dto';
import { searchLeadSchema } from '../dto/request/search-lead.dto';
import { LeadError } from '../errors/lead.errors';

import { LeadScoringService } from '../services/lead.scoring.service';

export class LeadController {
  static async create(req: Request, res: Response) {
    try {
      const user = req.context?.user;
      const userId = user?.id || (req as any).user?.user_id || (req as any).user?.id || null;
      const targetOrgId =
        user?.org_id || user?.school_id || (req as any).user?.org_id || req.body.org_id;
      if (!targetOrgId) {
        return res.status(400).json({ error: 'Organization ID parameter is required' });
      }

      const parsed = createLeadSchema.safeParse({ ...req.body, org_id: targetOrgId });
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const result = await LeadService.createLead(parsed.data, userId);
      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof LeadError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = req.context?.user;
      const targetOrgId = user?.org_id || user?.school_id || (req as any).user?.org_id;
      const result = await LeadService.getLeadById(id, targetOrgId);
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
      const parsed = updateLeadSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const user = req.context?.user;
      const userId = user?.id || (req as any).user?.user_id || (req as any).user?.id || null;
      const targetOrgId = user?.org_id || user?.school_id || (req as any).user?.org_id;
      const result = await LeadService.updateLead(id, parsed.data, userId, targetOrgId);
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
      const targetOrgId = user?.org_id || user?.school_id || (req as any).user?.org_id;
      const result = await LeadService.deleteLead(id, userId, targetOrgId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof LeadError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async search(req: Request, res: Response) {
    try {
      const parsed = searchLeadSchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Invalid search parameters',
          details: parsed.error.format(),
        });
      }

      const user = req.context?.user;
      const orgId =
        user?.org_id ||
        user?.school_id ||
        (req.query.org_id as string) ||
        (req.query.school_id as string) ||
        undefined;
      const payload = { ...parsed.data, org_id: orgId || parsed.data.org_id };

      const result = await LeadService.searchLeads(payload);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const stageInput = req.body.stage || req.body.status;
      const remarks = req.body.remarks || req.body.lost_reason;
      if (!stageInput) {
        return res.status(400).json({ error: 'Stage/Status is required' });
      }

      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await LeadLifecycleService.updateStatus(
        id,
        stageInput as lead_stage,
        userId,
        remarks,
      );
      return res.json(result);
    } catch (error: any) {
      if (error instanceof LeadError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async assign(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const counselorId = req.body.assigned_counsellor_id || req.body.counselor_id;
      if (!counselorId) {
        return res.status(400).json({ error: 'Assigned counselor staff ID is required' });
      }

      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await LeadAssignmentService.assignCounselor(
        id,
        counselorId,
        userId,
        req.body.remarks,
      );
      return res.json(result);
    } catch (error: any) {
      if (error instanceof LeadError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async bulkAssign(req: Request, res: Response) {
    try {
      const parsed = bulkAssignLeadSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await LeadAssignmentService.bulkAssignCounselor(
        parsed.data.lead_ids,
        parsed.data.assigned_counsellor_id,
        userId,
        parsed.data.remarks,
      );
      return res.json(result);
    } catch (error: any) {
      if (error instanceof LeadError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getDashboard(req: Request, res: Response) {
    try {
      const user = req.context?.user;
      const orgId =
        user?.org_id ||
        user?.school_id ||
        (req.query.org_id as string) ||
        (req.query.school_id as string) ||
        undefined;
      const result = await LeadService.getDashboardMetrics(orgId);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async checkDuplicates(req: Request, res: Response) {
    try {
      const phone = req.query.phone as string;
      const email = req.query.email as string | undefined;
      const name = req.query.name as string | undefined;

      if (!phone) {
        return res.status(400).json({ error: 'Phone parameter is required for duplicate check' });
      }

      const result = await LeadService.checkDuplicates(phone, email, name);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async qualify(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = req.context?.user;
      const userId = user?.id || (req as any).user?.user_id || (req as any).user?.id || null;
      const orgId = user?.org_id || user?.school_id;

      const result = await LeadScoringService.evaluateAndQualify(id, userId, orgId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof LeadError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async convert(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = req.context?.user;
      const userId = user?.id || (req as any).user?.user_id || (req as any).user?.id || null;
      const orgId = user?.org_id || user?.school_id;

      const result = await LeadLifecycleService.convertToApplication(id, userId, orgId);
      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof LeadError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
