import { Request, Response } from 'express';
import { listNotificationsQuerySchema } from '../dto/notification.dto';
import { NotificationService } from '../services/notification.service';
import { logger } from '../../../utils/logger';

export class NotificationController {
  private static getAuthContext(req: Request): { orgId: string; userId: string } | null {
    const user = req.context?.user || (req as any).user;
    const orgId =
      user?.org_id ||
      user?.school_id ||
      (req as any).organizationId ||
      (req as any).orgId ||
      (req.headers['x-tenant-id'] as string);
    const userId = user?.id || user?.user_id;

    if (!orgId || !userId) {
      return null;
    }
    return { orgId, userId };
  }

  static async list(req: Request, res: Response) {
    try {
      const auth = NotificationController.getAuthContext(req);
      if (!auth) {
        return res
          .status(401)
          .json({ error: 'Unauthorized: Missing user or organization context' });
      }

      const query = listNotificationsQuerySchema.parse(req.query);
      const result = await NotificationService.getUserNotifications(auth.orgId, auth.userId, query);
      return res.json(result);
    } catch (err: any) {
      logger.error('[NotificationController.list] Error:', err);
      if (err.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation Error', details: err.errors });
      }
      return res
        .status(500)
        .json({ error: 'Failed to retrieve notifications', message: err.message });
    }
  }

  static async getUnreadCount(req: Request, res: Response) {
    try {
      const auth = NotificationController.getAuthContext(req);
      if (!auth) {
        return res
          .status(401)
          .json({ error: 'Unauthorized: Missing user or organization context' });
      }

      const result = await NotificationService.getUnreadCount(auth.orgId, auth.userId);
      return res.json(result);
    } catch (err: any) {
      logger.error('[NotificationController.getUnreadCount] Error:', err);
      return res
        .status(500)
        .json({ error: 'Failed to get unread notification count', message: err.message });
    }
  }

  static async markRead(req: Request, res: Response) {
    try {
      const auth = NotificationController.getAuthContext(req);
      if (!auth) {
        return res
          .status(401)
          .json({ error: 'Unauthorized: Missing user or organization context' });
      }

      const { id } = req.params;
      const updated = await NotificationService.markRead(auth.orgId, auth.userId, id);
      if (!updated) {
        return res.status(404).json({ error: 'Notification not found or access denied' });
      }

      return res.json(updated);
    } catch (err: any) {
      logger.error('[NotificationController.markRead] Error:', err);
      return res
        .status(500)
        .json({ error: 'Failed to mark notification as read', message: err.message });
    }
  }

  static async markAllRead(req: Request, res: Response) {
    try {
      const auth = NotificationController.getAuthContext(req);
      if (!auth) {
        return res
          .status(401)
          .json({ error: 'Unauthorized: Missing user or organization context' });
      }

      const result = await NotificationService.markAllRead(auth.orgId, auth.userId);
      return res.json(result);
    } catch (err: any) {
      logger.error('[NotificationController.markAllRead] Error:', err);
      return res
        .status(500)
        .json({ error: 'Failed to mark all notifications as read', message: err.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const auth = NotificationController.getAuthContext(req);
      if (!auth) {
        return res
          .status(401)
          .json({ error: 'Unauthorized: Missing user or organization context' });
      }

      const { id } = req.params;
      const deleted = await NotificationService.deleteNotification(auth.orgId, auth.userId, id);
      if (!deleted) {
        return res.status(404).json({ error: 'Notification not found or access denied' });
      }

      return res.json({ success: true, message: 'Notification deleted' });
    } catch (err: any) {
      logger.error('[NotificationController.delete] Error:', err);
      return res.status(500).json({ error: 'Failed to delete notification', message: err.message });
    }
  }
}
