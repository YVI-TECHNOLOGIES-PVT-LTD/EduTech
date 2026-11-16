import { Request, Response } from 'express';
import { ParentAnalyticsService } from '../services/parent.analytics.service';
import { getAuthenticatedOrgId } from '../../../utils/tenant-context';

export class ParentAnalyticsController {
  static async getDashboard(req: Request, res: Response) {
    try {
      const orgId = getAuthenticatedOrgId(req);
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
