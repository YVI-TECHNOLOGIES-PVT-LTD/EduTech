import { Request, Response } from 'express';
import { StudentService } from '../services/student.service';
import { createStudentSchema } from '../dto/request/create-student.dto';
import { updateStudentSchema } from '../dto/request/update-student.dto';
import { updateStudentStatusSchema } from '../dto/request/update-status.dto';
import { searchStudentSchema } from '../dto/request/search-student.dto';
import { StudentError } from '../errors/student.errors';

export class StudentController {
  static async create(req: Request, res: Response) {
    try {
      const parsed = createStudentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await StudentService.createStudent(parsed.data, userId);
      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof StudentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await StudentService.getStudentById(id);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof StudentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = updateStudentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await StudentService.updateStudent(id, parsed.data, userId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof StudentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await StudentService.deleteStudent(id, userId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof StudentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async search(req: Request, res: Response) {
    try {
      const parsed = searchStudentSchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Invalid search parameters',
          details: parsed.error.format(),
        });
      }

      const result = await StudentService.searchStudents(parsed.data);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = updateStudentStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await StudentService.updateStatus(id, parsed.data, userId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof StudentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
