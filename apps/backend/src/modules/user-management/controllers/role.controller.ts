import { Request, Response } from 'express';
import { RoleService } from '../services/role.service';
import { createRoleSchema } from '../dto/request/create-role.dto';
import { updateRoleSchema } from '../dto/request/update-role.dto';
import { UserError } from '../errors/user.errors';

export class RoleController {
  static async create(req: Request, res: Response) {
    try {
      const parsed = createRoleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      }
      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await RoleService.createRole(parsed.data, userId);
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
      const result = await RoleService.getRoleById(id);
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
      const parsed = updateRoleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      }
      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await RoleService.updateRole(id, parsed.data, userId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof UserError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const orgId = (req.query.org_id as string) || undefined;
      const result = await RoleService.getAllRoles(orgId);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
