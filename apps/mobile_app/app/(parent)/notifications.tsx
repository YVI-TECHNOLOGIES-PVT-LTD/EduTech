import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useNotificationRealtime,
  NotificationCard,
  NotificationSkeleton,
  NotificationEmptyState,
  ConnectionStatusBanner,
  resolveNotificationRoute,
  NotificationItem,
} from '../../src/features/notifications';
import { useTheme } from '../../src/theme';
import { Button } from '../../src/components/ui/atoms/Button';

export default function ParentNotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const [markingId, setMarkingId] = useState<string | null>(null);

  // 1. Realtime WebSocket Lifecycle
  const { status: socketStatus } = useNotificationRealtime();

  // 2. Notification Queries & Mutations
  const { notifications, isLoading, isError, error, refetch, isRefetching } = useNotifications();

  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllNotificationsRead();

  // 3. Filtered Notifications
  const displayedNotifications = useMemo(() => {
    if (activeFilter === 'unread') {
      return notifications.filter((n: NotificationItem) => !n.is_read);
    }
    return notifications;
  }, [notifications, activeFilter]);

  // 4. Notification Tap / Deep-Link Action
  const handleNotificationPress = (item: NotificationItem) => {
    // Automatically mark as read on tap if unread
    if (!item.is_read) {
      markRead(item.notification_id);
    }

    const route = resolveNotificationRoute(item);
    if (route) {
      router.push(route as any);
    }
  };

  // 5. Individual Mark Read
  const handleMarkSingleRead = (notificationId: string) => {
    setMarkingId(notificationId);
    markRead(notificationId, {
      onSettled: () => setMarkingId(null),
    });
  };

  // 6. Mark All Read
  const handleMarkAllRead = () => {
    if (isMarkingAll || unreadCount === 0) return;
    markAllRead();
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Top Header */}
      <View className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-2">
          <View>
            <View className="flex-row items-center">
              <Text className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Notifications
              </Text>
              {unreadCount > 0 && (
                <View className="bg-indigo-600 dark:bg-indigo-500 px-2 py-0.5 rounded-full ml-2">
                  <Text className="text-[10px] font-black text-white">{unreadCount} new</Text>
                </View>
              )}
            </View>
            <Text className="text-xs font-semibold text-slate-400 mt-0.5">
              Admission alerts & updates
            </Text>
          </View>
        </View>

        <View className="flex-row items-center space-x-2">
          {/* Mark All as Read Action */}
          {unreadCount > 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={isMarkingAll}
              onPress={handleMarkAllRead}
              className="py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex-row items-center mr-2"
            >
              {isMarkingAll ? (
                <ActivityIndicator size="small" color="#4f46e5" />
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={14} color="#4f46e5" />
                  <Text className="text-xs font-bold text-indigo-600 dark:text-indigo-400 ml-1">
                    Read all
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Refresh Action */}
          <TouchableOpacity
            onPress={() => refetch()}
            className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center"
            accessibilityLabel="Refresh notifications"
          >
            <Feather name="refresh-cw" size={18} color={colors.iconSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Non-blocking Connection State Banner */}
      <ConnectionStatusBanner status={socketStatus} />

      {/* Filter Tabs */}
      <View className="px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/80 flex-row space-x-2">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveFilter('all')}
          className={`py-1.5 px-4 rounded-xl border ${
            activeFilter === 'all'
              ? 'bg-indigo-600 border-indigo-600'
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeFilter === 'all' ? 'text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            All ({notifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveFilter('unread')}
          className={`py-1.5 px-4 rounded-xl border ${
            activeFilter === 'unread'
              ? 'bg-indigo-600 border-indigo-600'
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeFilter === 'unread' ? 'text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notification List Scroll View */}
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Loading Skeleton */}
        {isLoading && <NotificationSkeleton />}

        {/* Error State */}
        {!isLoading && isError && (
          <View className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-3xl p-5 mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="alert-circle" size={22} color="#ef4444" />
              <Text className="text-sm font-bold text-red-700 dark:text-red-300 ml-2">
                Failed to load notifications
              </Text>
            </View>
            <Text className="text-xs text-red-600 dark:text-red-400 mb-4 leading-relaxed">
              {error?.message || 'A network error occurred while retrieving notifications.'}
            </Text>
            <Button title="Try Again" variant="outline" size="sm" onPress={() => refetch()} />
          </View>
        )}

        {/* Empty State */}
        {!isLoading && !isError && displayedNotifications.length === 0 && (
          <NotificationEmptyState />
        )}

        {/* Notification Cards */}
        {!isLoading &&
          !isError &&
          displayedNotifications.map((item: NotificationItem) => (
            <NotificationCard
              key={item.notification_id}
              notification={item}
              onPress={handleNotificationPress}
              onMarkRead={handleMarkSingleRead}
              isMarkingRead={markingId === item.notification_id}
            />
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}
