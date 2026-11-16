import { Request, Response } from 'express';
import { StudentParentService } from '../services/student.parent.service';
import { linkParentSchema } from '../dto/request/link-parent.dto';
import { StudentError } from '../errors/student.errors';

export class StudentParentController {
  static async linkParent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = linkParentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await StudentParentService.linkParent(id, userId, parsed.data);
      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof StudentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async unlinkParent(req: Request, res: Response) {
    try {
      const { id, parentId } = req.params;
      const result = await StudentParentService.unlinkParent(id, parentId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof StudentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getParents(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await StudentParentService.getParentsByStudent(id);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof StudentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
