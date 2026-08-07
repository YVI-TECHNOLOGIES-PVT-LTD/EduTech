import { Request, Response } from 'express';
import { SectionService } from '../services/section.service';
import { createSectionSchema } from '../dto/request/create-section.dto';
import { updateSectionSchema } from '../dto/request/update-section.dto';
import { AcademicError } from '../errors/academic.errors';

export class SectionController {
  static async create(req: Request, res: Response) {
    try {
      const parsed = createSectionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      }
      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await SectionService.createSection(parsed.data, userId);
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
      const result = await SectionService.getSectionById(id);
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
      const parsed = updateSectionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      }
      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await SectionService.updateSection(id, parsed.data, userId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof AcademicError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getByAcademicYearGrade(req: Request, res: Response) {
    try {
      const { academicYearGradeId } = req.params;
      const result = await SectionService.getSectionsByAcademicYearGrade(academicYearGradeId);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
