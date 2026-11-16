import { Request, Response } from 'express';
import { UserRoleService } from '../services/user-role.service';
import { assignRoleSchema } from '../dto/request/assign-role.dto';
import { UserError } from '../errors/user.errors';

export class UserRoleController {
  static async assignRole(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const parsed = assignRoleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      }
      const performedBy = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await UserRoleService.assignRole(userId, parsed.data, performedBy);
      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof UserError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async removeRole(req: Request, res: Response) {
    try {
      const { userId, roleId } = req.params;
      const performedBy = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await UserRoleService.removeRole(userId, roleId, performedBy);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof UserError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
