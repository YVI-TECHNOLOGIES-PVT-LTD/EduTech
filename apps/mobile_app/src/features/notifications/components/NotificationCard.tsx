import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { NotificationItem } from '../../../types/notification.types';
import { resolveNotificationRoute } from '../utils/notification-deep-link';

export interface NotificationCardProps {
  notification: NotificationItem;
  onPress: (notification: NotificationItem) => void;
  onMarkRead?: (notificationId: string) => void;
  isMarkingRead?: boolean;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
  onMarkRead,
  isMarkingRead = false,
}) => {
  const isUnread = !notification.is_read;
  const deepLinkRoute = resolveNotificationRoute(notification);

  const dateStr = notification.created_at
    ? new Date(notification.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recently';

  const notifType = String(notification.type || '').toLowerCase();
  const category = notification.category || 'ADMISSION';
  const isHighPriority = notification.priority === 'HIGH' || notification.priority === 'URGENT';

  let iconName: any = 'notifications';
  let iconBg = 'bg-indigo-50 dark:bg-indigo-950/60';
  let iconColor = '#4f46e5';

  if (notifType.includes('document')) {
    iconName = 'shield-checkmark';
    iconBg = 'bg-emerald-50 dark:bg-emerald-950/60';
    iconColor = '#10b981';
  } else if (notifType.includes('fee') || notifType.includes('payment')) {
    iconName = 'card';
    iconBg = 'bg-teal-50 dark:bg-teal-950/60';
    iconColor = '#0d9488';
  } else if (notifType.includes('decision') || notifType.includes('offer')) {
    iconName = 'ribbon';
    iconBg = 'bg-amber-50 dark:bg-amber-950/60';
    iconColor = '#d97706';
  } else if (notifType.includes('assessment') || notifType.includes('exam')) {
    iconName = 'school';
    iconBg = 'bg-purple-50 dark:bg-purple-950/60';
    iconColor = '#9333ea';
  }

  return (
    <TouchableOpacity
      activeOpacity={deepLinkRoute ? 0.8 : 1}
      onPress={() => onPress(notification)}
      className={`rounded-3xl p-5 mb-3.5 border shadow-sm ${
        isUnread
          ? 'bg-indigo-50/15 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800'
          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
      }`}
    >
      {/* Top Meta Row */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-wrap gap-1.5 flex-1 mr-2">
          {/* Category Tag */}
          <View className="bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md">
            <Text className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              {category}
            </Text>
          </View>

          {/* High Priority Tag */}
          {isHighPriority && (
            <View className="bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-md border border-red-200 dark:border-red-800">
              <Text className="text-[10px] font-extrabold uppercase text-red-600 dark:text-red-400">
                Action Required
              </Text>
            </View>
          )}

          {/* Unread Glow Dot */}
          {isUnread && (
            <View className="flex-row items-center ml-1">
              <View className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
            </View>
          )}
        </View>

        {/* Timestamp */}
        <Text className="text-[10px] font-semibold text-slate-400">{dateStr}</Text>
      </View>

      {/* Main Content Row */}
      <View className="flex-row items-start">
        <View className={`w-9 h-9 rounded-2xl ${iconBg} items-center justify-center mr-3 mt-0.5`}>
          <Ionicons name={iconName} size={18} color={iconColor} />
        </View>

        <View className="flex-1">
          <Text className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
            {notification.title}
          </Text>
          <Text className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            {notification.message}
          </Text>
        </View>
      </View>

      {/* Bottom Action Footer */}
      <View className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex-row items-center justify-between">
        {/* Mark as Read Button */}
        {isUnread && onMarkRead ? (
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={isMarkingRead}
            onPress={(e) => {
              e.stopPropagation();
              onMarkRead(notification.notification_id);
            }}
            className="flex-row items-center py-1 px-2 rounded-lg"
          >
            {isMarkingRead ? (
              <ActivityIndicator
                size="small"
                color="#4f46e5"
                style={{ transform: [{ scale: 0.7 }] }}
              />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={14} color="#64748b" />
                <Text className="text-xs font-semibold text-slate-500 ml-1">Mark as read</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View />
        )}

        {/* Deep Link Action */}
        {deepLinkRoute && (
          <View className="flex-row items-center">
            <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mr-1">
              View details
            </Text>
            <Feather name="arrow-right" size={13} color="#4f46e5" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
