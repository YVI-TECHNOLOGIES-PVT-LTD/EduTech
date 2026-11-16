import { Request, Response } from 'express';
import { ParentStudentService } from '../services/parent.student.service';
import { linkStudentSchema } from '../dto/request/link-student.dto';
import { ParentError } from '../errors/parent.errors';

export class ParentStudentController {
  static async linkStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = linkStudentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await ParentStudentService.linkStudent(id, userId, parsed.data);
      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof ParentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async unlinkStudent(req: Request, res: Response) {
    try {
      const { id, studentId } = req.params;
      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await ParentStudentService.unlinkStudent(id, studentId, userId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof ParentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getStudents(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await ParentStudentService.getStudentsByParent(id);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof ParentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
