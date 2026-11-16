import { Prisma } from '@prisma/client';
import { notification_category, notification_priority } from '../dto/notification.dto';
import prisma from '../../../lib/prismaClient';

export interface CreateNotificationRecord {
  org_id: string;
  recipient_user_id: string;
  category?: notification_category;
  type: string;
  priority?: notification_priority;
  title: string;
  message: string;
  entity_type?: string | null;
  entity_id?: string | null;
  action_url?: string | null;
  metadata?: any | null;
  expires_at?: Date | null;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const safeUuid = (val?: string | null): string | null => (val && UUID_REGEX.test(val) ? val : null);

export class NotificationRepository {
  static async create(
    data: CreateNotificationRecord,
    tx?: Prisma.TransactionClient | typeof prisma,
  ) {
    const client: any = tx || prisma;
    return client.notifications.create({
      data: {
        org_id: data.org_id,
        recipient_user_id: data.recipient_user_id,
        category: data.category || notification_category.SYSTEM,
        type: data.type,
        priority: data.priority || notification_priority.NORMAL,
        title: data.title,
        message: data.message,
        entity_type: data.entity_type || null,
        entity_id: safeUuid(data.entity_id),
        action_url: data.action_url || null,
        metadata: data.metadata || undefined,
        expires_at: data.expires_at || null,
      },
    });
  }

  static async createMany(
    dataList: CreateNotificationRecord[],
    tx?: Prisma.TransactionClient | typeof prisma,
  ) {
    const client: any = tx || prisma;
    return client.notifications.createMany({
      data: dataList.map((data) => ({
        org_id: data.org_id,
        recipient_user_id: data.recipient_user_id,
        category: data.category || notification_category.SYSTEM,
        type: data.type,
        priority: data.priority || notification_priority.NORMAL,
        title: data.title,
        message: data.message,
        entity_type: data.entity_type || null,
        entity_id: safeUuid(data.entity_id),
        action_url: data.action_url || null,
        metadata: data.metadata || undefined,
        expires_at: data.expires_at || null,
      })),
    });
  }

  static async findById(
    orgId: string,
    userId: string,
    notificationId: string,
    tx?: Prisma.TransactionClient | typeof prisma,
  ) {
    const client: any = tx || prisma;
    return client.notifications.findFirst({
      where: {
        notification_id: notificationId,
        recipient_user_id: userId,
        org_id: orgId,
      },
    });
  }

  static async findManyByUser(
    orgId: string,
    userId: string,
    params: {
      page: number;
      limit: number;
      category?: notification_category;
      is_read?: boolean;
    },
    tx?: Prisma.TransactionClient | typeof prisma,
  ) {
    const client: any = tx || prisma;
    const skip = (params.page - 1) * params.limit;

    const where: any = {
      org_id: orgId,
      recipient_user_id: userId,
      ...(params?.category ? { category: params.category } : {}),
      ...(params?.is_read !== undefined ? { is_read: params.is_read } : {}),
    };

    return client.notifications.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: params.limit,
    });
  }

  static async countTotalByUser(
    orgId: string,
    userId: string,
    params?: {
      category?: notification_category;
      is_read?: boolean;
    },
    tx?: Prisma.TransactionClient | typeof prisma,
  ) {
    const client: any = tx || prisma;
    const where: any = {
      org_id: orgId,
      recipient_user_id: userId,
      ...(params?.category ? { category: params.category } : {}),
      ...(params?.is_read !== undefined ? { is_read: params.is_read } : {}),
    };

    return client.notifications.count({ where });
  }

  static async countUnreadByUser(
    orgId: string,
    userId: string,
    tx?: Prisma.TransactionClient | typeof prisma,
  ) {
    const client: any = tx || prisma;
    return client.notifications.count({
      where: {
        org_id: orgId,
        recipient_user_id: userId,
        is_read: false,
      },
    });
  }

  static async markAsRead(
    orgId: string,
    userId: string,
    notificationId: string,
    tx?: Prisma.TransactionClient | typeof prisma,
  ) {
    const client: any = tx || prisma;
    const existing = await client.notifications.findFirst({
      where: {
        notification_id: notificationId,
        recipient_user_id: userId,
        org_id: orgId,
      },
    });

    if (!existing) {
      return null;
    }

    return client.notifications.update({
      where: { notification_id: notificationId },
      data: {
        is_read: true,
        read_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  static async markAllAsRead(
    orgId: string,
    userId: string,
    tx?: Prisma.TransactionClient | typeof prisma,
  ) {
    const client: any = tx || prisma;
    return client.notifications.updateMany({
      where: {
        org_id: orgId,
        recipient_user_id: userId,
        is_read: false,
      },
      data: {
        is_read: true,
        read_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  static async delete(
    orgId: string,
    userId: string,
    notificationId: string,
    tx?: Prisma.TransactionClient | typeof prisma,
  ) {
    const client: any = tx || prisma;
    const existing = await client.notifications.findFirst({
      where: {
        notification_id: notificationId,
        recipient_user_id: userId,
        org_id: orgId,
      },
    });

    if (!existing) {
      return false;
    }

    await client.notifications.delete({
      where: { notification_id: notificationId },
    });

    return true;
  }
}
