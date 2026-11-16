import {
  Bell,
  CheckCircle2,
  CalendarCheck,
  DollarSign,
  GraduationCap,
  Info,
  AlertCircle,
} from 'lucide-react';
import type {
  NotificationItem,
  NotificationCategory,
  NotificationPriority,
} from '@/shared/api/notification.api';

/**
 * Defensive Normalization: Guarantee an array of NotificationItem objects
 * regardless of response shape variations ({ notifications: [...] }, { data: [...] }, { items: [...] }, or raw array).
 */
export function normalizeNotifications(response: unknown): NotificationItem[] {
  if (!response) return [];

  let rawList: any[] = [];
  if (Array.isArray(response)) {
    rawList = response;
  } else if (typeof response === 'object' && response !== null) {
    const obj = response as Record<string, any>;
    if (Array.isArray(obj.notifications)) {
      rawList = obj.notifications;
    } else if (Array.isArray(obj.data)) {
      rawList = obj.data;
    } else if (Array.isArray(obj.items)) {
      rawList = obj.items;
    }
  }

  // Deduplicate by canonical notification_id and format safe defaults
  const seen = new Set<string>();
  const normalized: NotificationItem[] = [];

  for (const item of rawList) {
    if (!item || typeof item !== 'object') continue;
    const id = item.notification_id || item.id;
    if (!id || seen.has(id)) continue;
    seen.add(id);

    normalized.push({
      notification_id: String(id),
      org_id: item.org_id || '',
      recipient_user_id: item.recipient_user_id || '',
      category: (item.category as NotificationCategory) || 'SYSTEM',
      type: item.type || 'system.alert',
      priority: (item.priority as NotificationPriority) || 'NORMAL',
      title: item.title || 'Notification',
      message: item.message || '',
      entity_type: item.entity_type || null,
      entity_id: item.entity_id || null,
      action_url: item.action_url || null,
      is_read: Boolean(item.is_read),
      read_at: item.read_at || null,
      metadata: item.metadata || null,
      expires_at: item.expires_at || null,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
    });
  }

  return normalized;
}

/**
 * Format relative timestamp cleanly for compact notifications
 */
export function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return 'Yesterday';
  }
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Category Visual Configuration
 */
export function getCategoryConfig(category?: NotificationCategory | string) {
  switch (category) {
    case 'ADMISSION':
      return {
        icon: CheckCircle2,
        label: 'Admission',
        bgClass:
          'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50',
      };
    case 'ATTENDANCE':
      return {
        icon: CalendarCheck,
        label: 'Attendance',
        bgClass:
          'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/50',
      };
    case 'FEE':
      return {
        icon: DollarSign,
        label: 'Fee',
        bgClass:
          'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/50',
      };
    case 'EXAM':
      return {
        icon: GraduationCap,
        label: 'Exam',
        bgClass:
          'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200/50',
      };
    case 'SYSTEM':
    default:
      return {
        icon: Info,
        label: 'System',
        bgClass: 'bg-muted/80 text-muted-foreground border-border/50',
      };
  }
}

/**
 * Priority Visual Badges
 */
export function getPriorityBadge(priority?: NotificationPriority | string) {
  switch (priority) {
    case 'URGENT':
      return {
        label: 'Urgent',
        badgeClass:
          'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800',
        dotClass: 'bg-red-600 ring-red-300 dark:ring-red-900',
      };
    case 'HIGH':
      return {
        label: 'High',
        badgeClass:
          'bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800',
        dotClass: 'bg-orange-500 ring-orange-200 dark:ring-orange-900',
      };
    case 'LOW':
      return {
        label: 'Low',
        badgeClass:
          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
        dotClass: 'bg-slate-400 ring-slate-200',
      };
    case 'NORMAL':
    default:
      return {
        label: 'Normal',
        badgeClass:
          'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900',
        dotClass: 'bg-blue-500 ring-blue-200',
      };
  }
}

/**
 * Aliases for explicit architectural naming consistency
 */
export const formatNotificationTime = formatRelativeTime;
export const getPriorityConfig = getPriorityBadge;

/**
 * Deduplicate notification items strictly by database notification_id
 */
export function deduplicateNotifications(items: NotificationItem[]): NotificationItem[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item?.notification_id || seen.has(item.notification_id)) return false;
    seen.add(item.notification_id);
    return true;
  });
}

/**
 * Safe action URL extractor
 */
export function getNotificationActionUrl(notification?: NotificationItem | null): string | null {
  if (!notification?.action_url) return null;
  return notification.action_url.trim() || null;
}
