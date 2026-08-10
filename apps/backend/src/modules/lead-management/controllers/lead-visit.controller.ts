import { Request, Response } from 'express';
import { LeadVisitService } from '../services/lead-visit.service';
import { LeadError } from '../errors/lead.errors';

export class LeadVisitController {
  static async getByLeadId(req: Request, res: Response) {
    try {
      const user = req.context?.user;
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { id } = req.params;
      const result = await LeadVisitService.getVisitsByLead(id, user);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof LeadError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const user = req.context?.user;
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { id } = req.params;
      const { visit_type, scheduled_at, remarks, meeting_link } = req.body;

      if (!visit_type || !scheduled_at) {
        return res.status(400).json({ error: 'visit_type and scheduled_at are required' });
      }

      const result = await LeadVisitService.createVisit(
        {
          lead_id: id,
          visit_type,
          scheduled_at,
          remarks,
          meeting_link,
        },
        user,
      );
      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof LeadError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const user = req.context?.user;
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { visitId } = req.params;
      const { status, remarks } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'status is required' });
      }

      const result = await LeadVisitService.updateVisit(visitId, status, remarks, user);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof LeadError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
