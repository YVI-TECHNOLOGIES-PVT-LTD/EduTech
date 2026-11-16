import { Request, Response } from 'express';
import { UserAvatarService } from '../services/user-avatar.service';
import { ApplicationValidationError } from '../../admission-management/errors/admission.errors';

export class UserAvatarController {
  /**
   * Upload profile photo for current logged-in user (POST /me/avatar)
   */
  static async uploadCurrent(req: Request, res: Response) {
    try {
      const user = req.context?.user;
      if (!user || !user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!req.file) {
        throw new ApplicationValidationError('Image binary file is required in request body');
      }

      const result = await UserAvatarService.uploadAvatar(user.id, req.file, user);
      return res.status(200).json(result);
    } catch (err: any) {
      const statusCode = err.statusCode || (err.name === 'ApplicationForbiddenError' ? 403 : 400);
      return res.status(statusCode).json({ error: err.message || 'Avatar upload failed' });
    }
  }

  /**
   * Upload profile photo for a specific target user (POST /:id/avatar)
   */
  static async uploadById(req: Request, res: Response) {
    try {
      const user = req.context?.user;
      if (!user || !user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const targetUserId = req.params.id;
      if (!targetUserId) {
        throw new ApplicationValidationError('Target User ID parameter is required');
      }

      if (!req.file) {
        throw new ApplicationValidationError('Image binary file is required in request body');
      }

      const result = await UserAvatarService.uploadAvatar(targetUserId, req.file, user);
      return res.status(200).json(result);
    } catch (err: any) {
      const statusCode = err.statusCode || (err.name === 'ApplicationForbiddenError' ? 403 : 400);
      return res.status(statusCode).json({ error: err.message || 'Avatar upload failed' });
    }
  }

  /**
   * Delete profile photo for current logged-in user (DELETE /me/avatar)
   */
  static async deleteCurrent(req: Request, res: Response) {
    try {
      const user = req.context?.user;
      if (!user || !user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const result = await UserAvatarService.deleteAvatar(user.id, user);
      return res.status(200).json(result);
    } catch (err: any) {
      const statusCode = err.statusCode || (err.name === 'ApplicationForbiddenError' ? 403 : 400);
      return res.status(statusCode).json({ error: err.message || 'Avatar deletion failed' });
    }
  }

  /**
   * Delete profile photo for a specific target user (DELETE /:id/avatar)
   */
  static async deleteById(req: Request, res: Response) {
    try {
      const user = req.context?.user;
      if (!user || !user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const targetUserId = req.params.id;
      if (!targetUserId) {
        throw new ApplicationValidationError('Target User ID parameter is required');
      }

      const result = await UserAvatarService.deleteAvatar(targetUserId, user);
      return res.status(200).json(result);
    } catch (err: any) {
      const statusCode = err.statusCode || (err.name === 'ApplicationForbiddenError' ? 403 : 400);
      return res.status(statusCode).json({ error: err.message || 'Avatar deletion failed' });
    }
  }
}
