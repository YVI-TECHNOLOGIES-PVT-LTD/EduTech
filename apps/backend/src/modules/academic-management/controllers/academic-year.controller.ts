import { Request, Response } from 'express';
import { AcademicYearService } from '../services/academic-year.service';
import { createAcademicYearSchema } from '../dto/request/create-academic-year.dto';
import { updateAcademicYearSchema } from '../dto/request/update-academic-year.dto';
import { AcademicError } from '../errors/academic.errors';

export class AcademicYearController {
  static async create(req: Request, res: Response) {
    try {
      const parsed = createAcademicYearSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      }
      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await AcademicYearService.createAcademicYear(parsed.data, userId);
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
      const result = await AcademicYearService.getAcademicYearById(id);
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
      const parsed = updateAcademicYearSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      }
      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await AcademicYearService.updateAcademicYear(id, parsed.data, userId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof AcademicError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const orgId = (req.query.org_id as string) || undefined;
      const result = await AcademicYearService.getAllAcademicYears(orgId);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
