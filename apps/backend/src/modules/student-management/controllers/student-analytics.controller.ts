import { Request, Response } from 'express';
import { StudentAnalyticsService } from '../services/student.analytics.service';
import { getAuthenticatedOrgId } from '../../../utils/tenant-context';

export class StudentAnalyticsController {
  static async getDashboard(req: Request, res: Response) {
    try {
      const orgId = getAuthenticatedOrgId(req);
      const result = await StudentAnalyticsService.getDashboardMetrics(orgId);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getTimeline(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await StudentAnalyticsService.getTimeline(id);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
