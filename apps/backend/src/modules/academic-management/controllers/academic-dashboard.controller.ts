import { Request, Response } from 'express';
import { AcademicAnalyticsService } from '../services/academic.analytics.service';

export class AcademicDashboardController {
  static async getDashboard(req: Request, res: Response) {
    try {
      const orgId = (req.query.org_id as string) || undefined;
      const result = await AcademicAnalyticsService.getDashboardMetrics(orgId);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getStructureTree(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await AcademicAnalyticsService.getStructureTree(id);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
