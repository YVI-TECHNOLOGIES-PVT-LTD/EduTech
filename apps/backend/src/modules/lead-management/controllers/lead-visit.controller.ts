import { Request, Response } from 'express';
import { visit_type, visit_status } from '@prisma/client';
import { LeadVisitService } from '../services/lead.visit.service';
import { LeadError } from '../errors/lead.errors';

export class LeadVisitController {
  static async schedule(req: Request, res: Response) {
    try {
      const lead_id = req.params.id || req.body.lead_id;
      const { visit_type: vType, scheduled_at, staff_id, meeting_link, remarks } = req.body;

      if (!lead_id) {
        return res.status(400).json({ error: 'Lead ID is required' });
      }
      if (!scheduled_at) {
        return res.status(400).json({ error: 'Scheduled date/time is required' });
      }

      const user = req.context?.user;
      const userId = user?.id || (req as any).user?.user_id || (req as any).user?.id || null;
      const orgId = user?.org_id || user?.school_id;

      const visitTypeEnum: visit_type =
        vType === 'virtual' ? visit_type.virtual : visit_type.campus;

      const result = await LeadVisitService.scheduleVisit(
        {
          lead_id,
          visit_type: visitTypeEnum,
          scheduled_at,
          staff_id,
          meeting_link,
          remarks,
        },
        userId,
        orgId,
      );

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

      const result = await LeadVisitService.getVisitsByLead(id, orgId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof LeadError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getQueue(req: Request, res: Response) {
    try {
      const user = req.context?.user;
      const orgId =
        user?.org_id ||
        user?.school_id ||
        (req.query.org_id as string) ||
        (req.query.school_id as string) ||
        undefined;
      const staff_id =
        (req.query.staff_id as string) || (req.query.counsellor_id as string) || undefined;
      const vType = (req.query.visit_type as string) || (req.query.type as string);
      const statusStr = req.query.status as string;

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const pageSize = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await LeadVisitService.getQueue({
        org_id: orgId,
        staff_id,
        visit_type: vType as visit_type,
        status: statusStr as visit_status,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        page,
        pageSize,
      });

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, scheduled_at, staff_id, meeting_link, remarks } = req.body;

      const user = req.context?.user;
      const userId = user?.id || (req as any).user?.user_id || (req as any).user?.id || null;
      const orgId = user?.org_id || user?.school_id;

      const result = await LeadVisitService.updateVisitStatus(
        id,
        { status, scheduled_at, staff_id, meeting_link, remarks },
        userId,
        orgId,
      );

      return res.json(result);
    } catch (error: any) {
      if (error instanceof LeadError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
