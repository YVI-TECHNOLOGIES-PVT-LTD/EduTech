import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useNotificationRealtime,
  NotificationCard,
  ConnectionStatusBanner,
  resolveNotificationRoute,
  NotificationItem,
} from '../../src/features/notifications';
import { useTheme } from '../../src/theme';
import { DESIGN_TOKENS } from '../../src/theme/tokens/designTokens';
import { ParentPortalHeader } from '../../src/components/common/ParentPortalHeader';
import { ParentEmptyState } from '../../src/components/common/ParentEmptyState';
import { ParentLoadingSkeleton } from '../../src/components/common/ParentLoadingSkeleton';
import { Button } from '../../src/components/ui/atoms/Button';

export default function ParentNotificationsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

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
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? '#0B0F19' : DESIGN_TOKENS.colors.background },
      ]}
    >
      {/* Top Header */}
      <ParentPortalHeader
        title="Notifications"
        subtitle="Admission alerts & updates"
        rightAction={
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={isMarkingAll}
                onPress={handleMarkAllRead}
                style={[
                  styles.readAllButton,
                  {
                    backgroundColor: isDark
                      ? 'rgba(81, 70, 229, 0.2)'
                      : DESIGN_TOKENS.colors.primaryLight,
                    borderColor: isDark ? 'rgba(81, 70, 229, 0.4)' : '#C7D2FE',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Mark all notifications as read"
              >
                {isMarkingAll ? (
                  <ActivityIndicator size="small" color={DESIGN_TOKENS.colors.primary} />
                ) : (
                  <>
                    <Feather name="check" size={13} color={DESIGN_TOKENS.colors.primary} />
                    <Text style={styles.readAllButtonText}>Read all</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => refetch()}
              style={[styles.refreshButton, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
              accessibilityRole="button"
              accessibilityLabel="Refresh notifications"
            >
              <Feather
                name="refresh-cw"
                size={16}
                color={isDark ? '#F1F5F9' : DESIGN_TOKENS.colors.textPrimary}
              />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Non-blocking Connection State Banner */}
      <ConnectionStatusBanner status={socketStatus} />

      {/* Filter Segmented Controls */}
      <View
        style={[
          styles.filtersContainer,
          {
            backgroundColor: isDark ? '#0F172A' : DESIGN_TOKENS.colors.surface,
            borderBottomColor: isDark ? '#1E293B' : DESIGN_TOKENS.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveFilter('all')}
          style={[
            styles.filterPill,
            activeFilter === 'all'
              ? styles.filterPillActive
              : isDark
                ? styles.filterPillInactiveDark
                : styles.filterPillInactiveLight,
          ]}
        >
          <Text
            style={[
              styles.filterPillText,
              {
                color:
                  activeFilter === 'all'
                    ? '#FFFFFF'
                    : isDark
                      ? '#94A3B8'
                      : DESIGN_TOKENS.colors.textSecondary,
              },
            ]}
          >
            All ({notifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveFilter('unread')}
          style={[
            styles.filterPill,
            activeFilter === 'unread'
              ? styles.filterPillActive
              : isDark
                ? styles.filterPillInactiveDark
                : styles.filterPillInactiveLight,
          ]}
        >
          <Text
            style={[
              styles.filterPillText,
              {
                color:
                  activeFilter === 'unread'
                    ? '#FFFFFF'
                    : isDark
                      ? '#94A3B8'
                      : DESIGN_TOKENS.colors.textSecondary,
              },
            ]}
          >
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={DESIGN_TOKENS.colors.primary}
            colors={[DESIGN_TOKENS.colors.primary]}
          />
        }
      >
        {/* Loading State */}
        {isLoading && <ParentLoadingSkeleton type="list" />}

        {/* Error State */}
        {!isLoading && isError && (
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: isDark
                  ? 'rgba(220, 38, 38, 0.15)'
                  : DESIGN_TOKENS.colors.errorLight,
                borderColor: isDark ? 'rgba(220, 38, 38, 0.4)' : '#FECACA',
              },
            ]}
          >
            <View style={styles.errorHeader}>
              <Feather name="alert-circle" size={20} color={DESIGN_TOKENS.colors.error} />
              <Text
                style={[
                  styles.errorTitle,
                  { color: isDark ? '#FCA5A5' : DESIGN_TOKENS.colors.error },
                ]}
              >
                Failed to load notifications
              </Text>
            </View>
            <Text style={[styles.errorMessage, { color: isDark ? '#F87171' : '#991B1B' }]}>
              {error?.message || 'A network error occurred while retrieving notifications.'}
            </Text>
            <Button title="Try Again" variant="outline" size="sm" onPress={() => refetch()} />
          </View>
        )}

        {/* Empty State */}
        {!isLoading && !isError && displayedNotifications.length === 0 && (
          <ParentEmptyState
            icon="bell-off"
            title="No Notifications Yet"
            description={
              activeFilter === 'unread'
                ? 'You have caught up with all admission alerts.'
                : 'Admission announcements, evaluation updates, and document verification notices will be shown here.'
            }
          />
        )}

        {/* Notifications Listing */}
        {!isLoading && !isError && displayedNotifications.length > 0 && (
          <View style={styles.notificationsList}>
            {displayedNotifications.map((item: NotificationItem) => (
              <NotificationCard
                key={item.notification_id}
                notification={item}
                isMarkingRead={markingId === item.notification_id}
                onPress={() => handleNotificationPress(item)}
                onMarkRead={() => handleMarkSingleRead(item.notification_id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: DESIGN_TOKENS.radius.input,
    borderWidth: 1,
  },
  readAllButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.primary,
    marginLeft: 4,
  },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: DESIGN_TOKENS.radius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: DESIGN_TOKENS.radius.small,
  },
  filterPillActive: {
    backgroundColor: DESIGN_TOKENS.colors.primary,
  },
  filterPillInactiveLight: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillInactiveDark: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  errorCard: {
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: 16,
    marginBottom: 16,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  errorMessage: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  notificationsList: {
    gap: 10,
  },
});
