import prisma from '../lib/prismaClient';
import { NotificationService as CanonicalNotificationService } from '../modules/notifications/services/notification.service';
import {
  notification_category,
  notification_priority,
} from '../modules/notifications/dto/notification.dto';
import { logger } from '../utils/logger';

export const NotificationService = {
  async send(userId: string, title: string, body: string, metadata: any = {}) {
    try {
      const user = await prisma.users.findUnique({
        where: { user_id: userId },
        select: { org_id: true },
      });

      if (!user) {
        logger.warn(`[Legacy NotificationService] User ${userId} not found, skipping notification`);
        return;
      }

      await CanonicalNotificationService.sendNotification(user.org_id, {
        recipient_user_id: userId,
        category: notification_category.SYSTEM,
        type: 'workflow.alert',
        priority: notification_priority.NORMAL,
        title,
        message: body,
        metadata,
      });
    } catch (error) {
      logger.error('[Legacy NotificationService] Failed to send notification:', error);
    }
  },
};
