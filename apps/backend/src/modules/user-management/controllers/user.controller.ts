import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { createUserSchema } from '../dto/request/create-user.dto';
import { updateUserSchema } from '../dto/request/update-user.dto';
import { updateUserStatusSchema } from '../dto/request/update-user-status.dto';
import { searchUserSchema } from '../dto/request/search-user.dto';
import { UserError } from '../errors/user.errors';

export class UserController {
  static async create(req: Request, res: Response) {
    try {
      const parsed = createUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      }
      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await UserService.createUser(parsed.data, userId);
      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof UserError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await UserService.getUserById(id);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof UserError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = updateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      }
      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await UserService.updateUser(id, parsed.data, userId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof UserError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = updateUserStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      }
      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await UserService.updateUserStatus(id, parsed.data, userId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof UserError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async search(req: Request, res: Response) {
    try {
      const parsed = searchUserSchema.safeParse(req.query);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: 'Invalid search parameters', details: parsed.error.format() });
      }
      const result = await UserService.searchUsers(parsed.data);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
