import { Prisma } from '@prisma/client';
import {
  CreateNotificationDto,
  ListNotificationsQueryDto,
  NotificationListResponseDto,
  NotificationResponseDto,
} from '../dto/notification.dto';
import { NotificationRepository } from '../repositories/notification.repository';
import { realtimeNotificationServer } from '../realtime/notification.realtime';
import { logger } from '../../../utils/logger';

export class NotificationService {
  static async sendNotification(
    orgId: string,
    dto: CreateNotificationDto,
    tx?: Prisma.TransactionClient,
  ): Promise<NotificationResponseDto> {
    const record = await NotificationRepository.create(
      {
        org_id: orgId,
        recipient_user_id: dto.recipient_user_id,
        category: dto.category,
        type: dto.type,
        priority: dto.priority,
        title: dto.title,
        message: dto.message,
        entity_type: dto.entity_type,
        entity_id: dto.entity_id,
        action_url: dto.action_url,
        metadata: dto.metadata,
        expires_at: dto.expires_at ? new Date(dto.expires_at) : null,
      },
      tx,
    );

    const serialized = this.serialize(record);

    logger.info(
      `[Notification] Created notification ${record.notification_id} for user ${record.recipient_user_id}`,
      {
        notificationId: record.notification_id,
        recipientUserId: record.recipient_user_id,
        category: record.category,
        type: record.type,
        orgId,
      },
    );

    // Realtime broadcast (non-blocking, failure resilient)
    try {
      realtimeNotificationServer.sendToUser(record.org_id, record.recipient_user_id, {
        type: 'notification.created',
        data: serialized,
      });
    } catch (realtimeErr) {
      logger.warn(`[Notification] Realtime dispatch error:`, {
        error: (realtimeErr as Error)?.message,
      });
    }

    return serialized;
  }

  static async sendBulkNotifications(
    orgId: string,
    dtos: CreateNotificationDto[],
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    if (!dtos.length) return 0;

    const records = dtos.map((dto) => ({
      org_id: orgId,
      recipient_user_id: dto.recipient_user_id,
      category: dto.category,
      type: dto.type,
      priority: dto.priority,
      title: dto.title,
      message: dto.message,
      entity_type: dto.entity_type,
      entity_id: dto.entity_id,
      action_url: dto.action_url,
      metadata: dto.metadata,
      expires_at: dto.expires_at ? new Date(dto.expires_at) : null,
    }));

    const result = await NotificationRepository.createMany(records, tx);
    logger.info(`[Notification] Created ${result.count} bulk notifications`, { orgId });
    return result.count;
  }

  static async getUserNotifications(
    orgId: string,
    userId: string,
    query: ListNotificationsQueryDto,
  ): Promise<NotificationListResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const [items, total, unreadCount] = await Promise.all([
      NotificationRepository.findManyByUser(orgId, userId, {
        page,
        limit,
        category: query.category,
        is_read: query.is_read,
      }),
      NotificationRepository.countTotalByUser(orgId, userId, {
        category: query.category,
        is_read: query.is_read,
      }),
      NotificationRepository.countUnreadByUser(orgId, userId),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      notifications: items.map((item: any) => this.serialize(item)),
      total,
      unreadCount,
      page,
      limit,
      totalPages,
    };
  }

  static async getUnreadCount(orgId: string, userId: string): Promise<{ count: number }> {
    const count = await NotificationRepository.countUnreadByUser(orgId, userId);
    return { count };
  }

  static async markRead(
    orgId: string,
    userId: string,
    notificationId: string,
  ): Promise<NotificationResponseDto | null> {
    const updated = await NotificationRepository.markAsRead(orgId, userId, notificationId);
    if (!updated) return null;
    const serialized = this.serialize(updated);
    try {
      realtimeNotificationServer.sendToUser(orgId, userId, {
        type: 'notification.updated',
        data: serialized,
      });
    } catch (e) {
      logger.warn(`[Notification] Realtime dispatch error on markRead:`, {
        error: (e as Error)?.message,
      });
    }
    return serialized;
  }

  static async markAllRead(orgId: string, userId: string): Promise<{ count: number }> {
    const result = await NotificationRepository.markAllAsRead(orgId, userId);
    try {
      realtimeNotificationServer.sendToUser(orgId, userId, {
        type: 'notification.updated',
        data: { allRead: true, count: result.count },
      });
    } catch (e) {
      logger.warn(`[Notification] Realtime dispatch error on markAllRead:`, {
        error: (e as Error)?.message,
      });
    }
    return { count: result.count };
  }

  static async deleteNotification(
    orgId: string,
    userId: string,
    notificationId: string,
  ): Promise<boolean> {
    const deleted = await NotificationRepository.delete(orgId, userId, notificationId);
    if (deleted) {
      try {
        realtimeNotificationServer.sendToUser(orgId, userId, {
          type: 'notification.deleted',
          data: { notification_id: notificationId },
        });
      } catch (e) {
        logger.warn(`[Notification] Realtime dispatch error on deleteNotification:`, {
          error: (e as Error)?.message,
        });
      }
    }
    return deleted;
  }

  private static serialize(record: any): NotificationResponseDto {
    return {
      notification_id: record.notification_id,
      org_id: record.org_id,
      recipient_user_id: record.recipient_user_id,
      category: record.category,
      type: record.type,
      priority: record.priority,
      title: record.title,
      message: record.message,
      entity_type: record.entity_type,
      entity_id: record.entity_id,
      action_url: record.action_url,
      is_read: record.is_read,
      read_at: record.read_at ? new Date(record.read_at).toISOString() : null,
      metadata: record.metadata,
      expires_at: record.expires_at ? new Date(record.expires_at).toISOString() : null,
      created_at: new Date(record.created_at).toISOString(),
      updated_at: new Date(record.updated_at).toISOString(),
    };
  }
}
