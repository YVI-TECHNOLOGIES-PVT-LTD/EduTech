import { Request, Response } from 'express';
import { DesignationService } from '../services/designation.service';
import { createDesignationSchema } from '../dto/request/create-designation.dto';
import { updateDesignationSchema } from '../dto/request/update-designation.dto';
import { StaffError } from '../errors/staff.errors';

export class DesignationController {
  static async create(req: Request, res: Response) {
    try {
      const parsed = createDesignationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      }
      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await DesignationService.createDesignation(parsed.data, userId);
      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof StaffError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await DesignationService.getDesignationById(id);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof StaffError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = updateDesignationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      }
      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await DesignationService.updateDesignation(id, parsed.data, userId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof StaffError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const orgId = (req.query.org_id as string) || undefined;
      const result = await DesignationService.getAllDesignations(orgId);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
