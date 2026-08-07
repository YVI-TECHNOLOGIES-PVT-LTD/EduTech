import { Request, Response } from 'express';
import { StaffService } from '../services/staff.service';
import { createStaffSchema } from '../dto/request/create-staff.dto';
import { updateStaffSchema } from '../dto/request/update-staff.dto';
import { assignDesignationSchema } from '../dto/request/assign-designation.dto';
import { assignUserSchema } from '../dto/request/assign-user.dto';
import { searchStaffSchema } from '../dto/request/search-staff.dto';
import { StaffError } from '../errors/staff.errors';

export class StaffController {
  static async create(req: Request, res: Response) {
    try {
      const parsed = createStaffSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      }
      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await StaffService.createStaff(parsed.data, userId);
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
      const result = await StaffService.getStaffById(id);
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
      const parsed = updateStaffSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      }
      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await StaffService.updateStaff(id, parsed.data, userId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof StaffError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async assignDesignation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = assignDesignationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      }
      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await StaffService.assignDesignation(id, parsed.data, userId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof StaffError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async assignUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = assignUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      }
      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await StaffService.assignUser(id, parsed.data, userId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof StaffError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await StaffService.deleteStaff(id, userId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof StaffError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async search(req: Request, res: Response) {
    try {
      const parsed = searchStaffSchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid search parameters', details: parsed.error.format() });
      }
      const result = await StaffService.searchStaff(parsed.data);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
