export type NotificationCategory = 'ADMISSION' | 'ATTENDANCE' | 'FEE' | 'EXAM' | 'SYSTEM';
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface NotificationItem {
  notification_id: string;
  recipient_user_id: string;
  org_id?: string;
  category?: NotificationCategory;
  type?: string;
  priority?: NotificationPriority;
  title: string;
  message: string;
  entity_type?: string | null;
  entity_id?: string | null;
  action_url?: string | null;
  link_url?: string | null;
  is_read: boolean;
  read_at?: string | null;
  metadata?: Record<string, any> | null;
  expires_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface NotificationListResponse {
  notifications?: NotificationItem[];
  data?: NotificationItem[];
  total?: number;
  unreadCount?: number;
  unread_count?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface UnreadCountResponse {
  count?: number;
  unread_count?: number;
}

export type RealtimeSocketStatus =
  'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'OFFLINE';

export interface RealtimeNotificationEvent {
  type:
    | 'notification.created'
    | 'notification.updated'
    | 'notification.deleted'
    | 'connection.ack'
    | 'pong'
    | string;
  data?: any;
  userId?: string;
  orgId?: string;
  timestamp?: string;
}
