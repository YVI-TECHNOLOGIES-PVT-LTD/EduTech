import { Request, Response } from 'express';
import { AcademicYearGradeService } from '../services/academic-year-grade.service';
import { createAcademicYearGradeSchema } from '../dto/request/create-academic-year-grade.dto';
import { updateAcademicYearGradeSchema } from '../dto/request/update-academic-year-grade.dto';
import { AcademicError } from '../errors/academic.errors';

export class AcademicYearGradeController {
  static async create(req: Request, res: Response) {
    try {
      const parsed = createAcademicYearGradeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      }
      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await AcademicYearGradeService.createAcademicYearGrade(parsed.data, userId);
      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof AcademicError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await AcademicYearGradeService.getAcademicYearGradeById(id);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof AcademicError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = updateAcademicYearGradeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      }
      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await AcademicYearGradeService.updateAcademicYearGrade(
        id,
        parsed.data,
        userId,
      );
      return res.json(result);
    } catch (error: any) {
      if (error instanceof AcademicError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getByAcademicYear(req: Request, res: Response) {
    try {
      const { academicYearId } = req.params;
      const result = await AcademicYearGradeService.getAcademicYearGradesByYear(academicYearId);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
