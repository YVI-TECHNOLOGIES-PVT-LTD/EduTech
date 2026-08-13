import { Request, Response } from 'express';
import { AdmissionAnalyticsService } from '../services/admission.analytics.service';

export class AdmissionAnalyticsController {
  static async getDashboard(req: Request, res: Response) {
    try {
      const user = req.context?.user;
      const orgId = user?.org_id || user?.school_id || (req.query.org_id as string) || undefined;
      const result = await AdmissionAnalyticsService.getDashboardMetrics(orgId);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getTimeline(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await AdmissionAnalyticsService.getTimeline(id);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getPendingItems(req: Request, res: Response) {
    try {
      const user = req.context?.user;
      const orgId = user?.org_id || user?.school_id || (req.query.org_id as string) || undefined;
      const result = await AdmissionAnalyticsService.getPendingItems(orgId);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
