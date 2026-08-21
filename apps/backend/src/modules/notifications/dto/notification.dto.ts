import { z } from 'zod';

export enum notification_category {
  ADMISSION = 'ADMISSION',
  ATTENDANCE = 'ATTENDANCE',
  FEE = 'FEE',
  EXAM = 'EXAM',
  SYSTEM = 'SYSTEM',
}

export enum notification_priority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  category: z.nativeEnum(notification_category).optional(),
  is_read: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

export type ListNotificationsQueryDto = z.infer<typeof listNotificationsQuerySchema>;

export const createNotificationSchema = z.object({
  recipient_user_id: z.string().uuid(),
  category: z.nativeEnum(notification_category).default(notification_category.SYSTEM),
  type: z.string().min(1).max(100),
  priority: z.nativeEnum(notification_priority).default(notification_priority.NORMAL),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  entity_type: z.string().max(100).optional().nullable(),
  entity_id: z.string().uuid().optional().nullable(),
  action_url: z.string().optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
  expires_at: z.string().datetime().optional().nullable(),
});

export type CreateNotificationDto = z.infer<typeof createNotificationSchema>;

export interface NotificationResponseDto {
  notification_id: string;
  org_id: string;
  recipient_user_id: string;
  category: notification_category;
  type: string;
  priority: notification_priority;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  metadata: any | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationListResponseDto {
  notifications: NotificationResponseDto[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}
