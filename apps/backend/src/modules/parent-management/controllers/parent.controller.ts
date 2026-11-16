import { Request, Response } from 'express';
import { ParentService } from '../services/parent.service';
import { createParentSchema } from '../dto/request/create-parent.dto';
import { updateParentSchema } from '../dto/request/update-parent.dto';
import { searchParentSchema } from '../dto/request/search-parent.dto';
import { ParentError } from '../errors/parent.errors';

export class ParentController {
  static async create(req: Request, res: Response) {
    try {
      const parsed = createParentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await ParentService.createParent(parsed.data, userId);
      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof ParentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await ParentService.getParentById(id);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof ParentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = updateParentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await ParentService.updateParent(id, parsed.data, userId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof ParentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await ParentService.deleteParent(id, userId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof ParentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async search(req: Request, res: Response) {
    try {
      const parsed = searchParentSchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Invalid search parameters',
          details: parsed.error.format(),
        });
      }

      const result = await ParentService.searchParents(parsed.data);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
