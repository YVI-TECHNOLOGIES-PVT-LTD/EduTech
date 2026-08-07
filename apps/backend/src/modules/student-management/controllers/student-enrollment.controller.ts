import { Request, Response } from 'express';
import { StudentEnrollmentService } from '../services/student.enrollment.service';
import { enrollStudentSchema } from '../dto/request/enroll-student.dto';
import { assignSectionSchema } from '../dto/request/assign-section.dto';
import { StudentError } from '../errors/student.errors';

export class StudentEnrollmentController {
  static async enroll(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = enrollStudentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await StudentEnrollmentService.enrollStudent(id, userId, parsed.data);
      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof StudentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getEnrollments(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await StudentEnrollmentService.getEnrollmentsByStudent(id);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof StudentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async assignSection(req: Request, res: Response) {
    try {
      const { id } = req.params; // enrollment_id
      const parsed = assignSectionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await StudentEnrollmentService.assignSection(id, userId, parsed.data);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof StudentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
