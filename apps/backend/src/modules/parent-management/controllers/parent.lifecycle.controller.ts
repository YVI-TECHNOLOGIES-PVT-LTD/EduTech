import { Request, Response } from 'express';
import { ParentStudentLifecycleService } from '../services/parent.student-lifecycle.service';
import { ParentError } from '../errors/parent.errors';

export class ParentLifecycleController {
  static async getLifecycle(req: Request, res: Response) {
    try {
      const user = (req as any).context?.user || (req as any).user;
      const userId = user?.id || (req as any).user?.user_id || (req as any).user?.id || null;

      if (!userId) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'Authentication session required to access lifecycle',
        });
      }

      const orgId = user?.org_id || user?.school_id || (req.query.org_id as string) || undefined;
      const result = await ParentStudentLifecycleService.getParentStudentLifecycle(userId, orgId);

      return res.json(result);
    } catch (error: any) {
      if (error instanceof ParentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
