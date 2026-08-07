import { Request, Response } from 'express';
import { ParentAnalyticsService } from '../services/parent.analytics.service';

export class ParentAnalyticsController {
  static async getDashboard(req: Request, res: Response) {
    try {
      const orgId = (req.query.org_id as string) || undefined;
      const result = await ParentAnalyticsService.getDashboardMetrics(orgId);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getTimeline(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await ParentAnalyticsService.getTimeline(id);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
