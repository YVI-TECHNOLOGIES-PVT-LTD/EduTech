import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notificationsApi } from '../../../src/api/notifications.api';
import { NotificationItem } from '../../../src/types/notification.types';
import { Badge } from '../../../src/components/ui/atoms/Badge';
import { DESIGN_TOKENS } from '../../../src/theme/tokens/designTokens';
import { ROUTES } from '../../../src/constants/routes';
import {
  communicationApi,
  FeedPost,
  FeedAttachment,
  MobileFeedGallery,
  MobileFeedImageViewer,
  MobileFeedImageItem,
  MobileCreateFeedPostModal,
} from '../../../src/features/communication';

export default function CommunicationFeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'notices' | 'feed'>('notices');
  const [categoryFilter, setCategoryFilter] = useState<
    'all' | 'academics' | 'administrative' | 'events' | 'urgent'
  >('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Community Feed State
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [isFeedLoading, setIsFeedLoading] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState<MobileFeedImageItem[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const fetchNotices = async () => {
    setIsLoading(true);
    try {
      const items = await notificationsApi.list();
      setNotifications(items);
    } catch {
      // Non-blocking fallback
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFeeds = async () => {
    setIsFeedLoading(true);
    try {
      const res = await communicationApi.getFeeds({ limit: 20 });
      if (Array.isArray(res?.data)) {
        setFeedPosts(res.data);
      } else if (Array.isArray(res)) {
        setFeedPosts(res as any);
      }
    } catch {
      // Non-blocking fallback
    } finally {
      setIsFeedLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
    fetchFeeds();
  }, []);

  const handleOpenImageViewer = (attachments: FeedAttachment[], index: number) => {
    const formattedImages: MobileFeedImageItem[] = attachments
      .filter((a) => Boolean(a.signedUrl || a.signed_url))
      .map((a) => ({
        url: a.signedUrl || a.signed_url || '',
        caption: a.caption,
        fileName: a.fileName || a.file_name,
      }));

    if (formattedImages.length > 0) {
      setViewerImages(formattedImages);
      setViewerIndex(index);
      setViewerVisible(true);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n)),
      );
    } catch {
      // Non-blocking
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // Non-blocking
    }
  };

  const filteredNotices = notifications.filter((item) => {
    if (categoryFilter === 'all') return true;
    return item.category?.toLowerCase() === categoryFilter;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // School Community Feed Posts
  const communityPosts = [
    {
      id: 'feed-1',
      author: "Principal's Desk",
      role: 'Administration',
      date: 'Today at 09:30 AM',
      title: 'Annual Science & Innovation Exhibition 2026',
      content:
        'We warmly invite all parents and guardians to witness innovative student projects this Saturday in the main auditorium. Student registrations close on Thursday.',
      tag: 'Campus Event',
    },
    {
      id: 'feed-2',
      author: 'Department of Physical Education',
      role: 'Sports',
      date: 'Yesterday at 04:15 PM',
      title: 'Inter-School Athletics Championship Victories',
      content:
        'Hearty congratulations to our U-14 and U-17 relay teams for clinching Gold and Silver medals at the Regional Athletics Meet!',
      tag: 'Sports Achievement',
    },
    {
      id: 'feed-3',
      author: 'Academic Council',
      role: 'Academics',
      date: '28 Oct 2026',
      title: 'Mid-Term Evaluation Schedule Released',
      content:
        'The comprehensive syllabus and schedule for the upcoming Mid-Term Examinations are now published under the Academics tab. Please review with your ward.',
      tag: 'Curriculum',
    },
  ];

  // Safe area insets with guaranteed Android status bar & bottom bar clearance
  const androidStatusHeight = StatusBar.currentHeight || 24;
  const topSafeInset =
    insets.top > 0 ? insets.top : Platform.OS === 'android' ? androidStatusHeight : 16;
  const bottomSafeInset = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 16);

  return (
    <View style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topSafeInset + 8,
            paddingBottom: bottomSafeInset + 84,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={activeTab === 'notices' ? isLoading : isFeedLoading}
            onRefresh={() => {
              if (activeTab === 'notices') fetchNotices();
              else fetchFeeds();
            }}
            tintColor={DESIGN_TOKENS.colors.primary}
            colors={[DESIGN_TOKENS.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTag}>School Community</Text>
            <Text style={styles.headerTitle}>Updates & Circulars</Text>
          </View>

          {/* Quick Helpdesk Pill */}
          <TouchableOpacity
            onPress={() => router.push(ROUTES.MAIN.HELPDESK as any)}
            style={styles.helpdeskPill}
            accessibilityRole="button"
            accessibilityLabel="Open Parent Helpdesk"
            activeOpacity={0.8}
          >
            <Ionicons name="help-buoy-outline" size={14} color="#E11D48" />
            <Text style={styles.helpdeskText}>Helpdesk</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => setActiveTab('notices')}
            activeOpacity={0.8}
            style={[styles.tabButton, activeTab === 'notices' && styles.activeTabButton]}
          >
            <Ionicons
              name="notifications-outline"
              size={15}
              color={
                activeTab === 'notices'
                  ? DESIGN_TOKENS.colors.primary
                  : DESIGN_TOKENS.colors.textSecondary
              }
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color:
                    activeTab === 'notices'
                      ? DESIGN_TOKENS.colors.primary
                      : DESIGN_TOKENS.colors.textSecondary,
                },
              ]}
            >
              Circulars & Notices {unreadCount > 0 ? `(${unreadCount})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('feed')}
            activeOpacity={0.8}
            style={[styles.tabButton, activeTab === 'feed' && styles.activeTabButton]}
          >
            <Ionicons
              name="newspaper-outline"
              size={15}
              color={
                activeTab === 'feed'
                  ? DESIGN_TOKENS.colors.primary
                  : DESIGN_TOKENS.colors.textSecondary
              }
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color:
                    activeTab === 'feed'
                      ? DESIGN_TOKENS.colors.primary
                      : DESIGN_TOKENS.colors.textSecondary,
                },
              ]}
            >
              School Feed
            </Text>
          </TouchableOpacity>
        </View>

        {/* ========================================================================= */}
        {/* TAB 1: NOTICES & CIRCULARS                                                */}
        {/* ========================================================================= */}
        {activeTab === 'notices' && (
          <View>
            {/* Category Filter Pills & Mark Read Action */}
            <View style={{ marginBottom: 12 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6 }}
              >
                {(['all', 'academics', 'administrative', 'events', 'urgent'] as const).map(
                  (cat) => {
                    const isSelected = categoryFilter === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setCategoryFilter(cat)}
                        activeOpacity={0.8}
                        style={[styles.filterChip, isSelected && styles.activeFilterChip]}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            { color: isSelected ? '#FFFFFF' : DESIGN_TOKENS.colors.textPrimary },
                          ]}
                        >
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    );
                  },
                )}
              </ScrollView>
            </View>

            {unreadCount > 0 && (
              <View style={styles.unreadHeaderRow}>
                <Text style={styles.unreadCountText}>
                  {unreadCount} unread update{unreadCount > 1 ? 's' : ''}
                </Text>
                <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.8}>
                  <Text style={styles.markAllReadText}>Mark All as Read</Text>
                </TouchableOpacity>
              </View>
            )}

            {filteredNotices.length > 0 ? (
              filteredNotices.map((n) => {
                const isUrgent = n.priority === 'URGENT' || n.priority === 'HIGH';
                return (
                  <TouchableOpacity
                    key={n.notification_id}
                    onPress={() => handleMarkAsRead(n.notification_id)}
                    activeOpacity={0.8}
                    style={[styles.noticeCard, !n.is_read && styles.unreadNoticeCard]}
                  >
                    <View style={styles.noticeHeader}>
                      <Badge
                        label={n.category || 'Announcement'}
                        variant={isUrgent ? 'error' : 'primary'}
                      />
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {!n.is_read && <View style={styles.noticeUnreadDot} />}
                        <Text style={styles.noticeDateText}>
                          {n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Recent'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.noticeTitle}>{n.title}</Text>
                    <Text style={styles.noticeMessage}>{n.message}</Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={32}
                  color={DESIGN_TOKENS.colors.textMuted}
                />
                <Text style={styles.emptyTitle}>No notifications found in this category.</Text>
              </View>
            )}
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SCHOOL COMMUNITY FEED                                              */}
        {/* ========================================================================= */}
        {activeTab === 'feed' && (
          <View>
            {/* Quick Create Post Bar */}
            <TouchableOpacity
              style={styles.createPostBar}
              onPress={() => setCreateModalVisible(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Create feed post"
            >
              <View style={styles.createPostAvatar}>
                <Ionicons name="create-outline" size={18} color={DESIGN_TOKENS.colors.primary} />
              </View>
              <Text style={styles.createPostPlaceholder}>
                Share an update or photo with school...
              </Text>
              <Ionicons name="images" size={20} color={DESIGN_TOKENS.colors.primary} />
            </TouchableOpacity>

            {/* Live Feed Posts if available, else static demo posts */}
            {feedPosts.length > 0
              ? feedPosts.map((post) => {
                  const authorName = post.author?.name || 'School Staff';
                  const postDate =
                    post.createdAt || post.created_at
                      ? new Date(post.createdAt || post.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Recent';

                  return (
                    <View key={post.feedPostId || post.feed_post_id} style={styles.feedCard}>
                      <View style={styles.feedHeader}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            flex: 1,
                            marginRight: 8,
                          }}
                        >
                          <View style={styles.feedAvatarBox}>
                            <Ionicons
                              name="school"
                              size={18}
                              color={DESIGN_TOKENS.colors.primary}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.feedAuthorName} numberOfLines={1}>
                              {authorName}
                            </Text>
                            <Text style={styles.feedMetaText}>
                              {post.feedType || 'General'} • {postDate}
                            </Text>
                          </View>
                        </View>
                        <Badge label={post.feedType || 'Campus'} variant="neutral" />
                      </View>

                      {Boolean(post.title) && <Text style={styles.feedTitle}>{post.title}</Text>}
                      <Text style={styles.feedContent}>{post.content}</Text>

                      {/* Image Attachments Gallery */}
                      {post.attachments && post.attachments.length > 0 && (
                        <MobileFeedGallery
                          attachments={post.attachments}
                          onImagePress={(idx) => handleOpenImageViewer(post.attachments!, idx)}
                        />
                      )}

                      <View style={styles.feedFooter}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons
                            name="heart-outline"
                            size={16}
                            color={DESIGN_TOKENS.colors.textSecondary}
                          />
                          <Text style={styles.feedActionText}>
                            {post.reactionSummary?.reduce((acc, r) => acc + (r.count || 0), 0) || 0}
                          </Text>
                          <Ionicons
                            name="chatbubble-outline"
                            size={15}
                            color={DESIGN_TOKENS.colors.textSecondary}
                            style={{ marginLeft: 16 }}
                          />
                          <Text style={styles.feedActionText}>{post.commentCount || 0}</Text>
                          <Ionicons
                            name="share-social-outline"
                            size={16}
                            color={DESIGN_TOKENS.colors.textSecondary}
                            style={{ marginLeft: 16 }}
                          />
                          <Text style={styles.feedActionText}>Share</Text>
                        </View>
                        <Text style={styles.broadcastTag}>Official Broadcast</Text>
                      </View>
                    </View>
                  );
                })
              : communityPosts.map((post) => (
                  <View key={post.id} style={styles.feedCard}>
                    <View style={styles.feedHeader}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          flex: 1,
                          marginRight: 8,
                        }}
                      >
                        <View style={styles.feedAvatarBox}>
                          <Ionicons name="school" size={18} color={DESIGN_TOKENS.colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.feedAuthorName} numberOfLines={1}>
                            {post.author}
                          </Text>
                          <Text style={styles.feedMetaText}>
                            {post.role} • {post.date}
                          </Text>
                        </View>
                      </View>
                      <Badge label={post.tag} variant="neutral" />
                    </View>

                    <Text style={styles.feedTitle}>{post.title}</Text>
                    <Text style={styles.feedContent}>{post.content}</Text>

                    <View style={styles.feedFooter}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons
                          name="heart-outline"
                          size={16}
                          color={DESIGN_TOKENS.colors.textSecondary}
                        />
                        <Text style={styles.feedActionText}>Appreciate</Text>
                        <Ionicons
                          name="share-social-outline"
                          size={16}
                          color={DESIGN_TOKENS.colors.textSecondary}
                          style={{ marginLeft: 16 }}
                        />
                        <Text style={styles.feedActionText}>Share</Text>
                      </View>
                      <Text style={styles.broadcastTag}>Official Broadcast</Text>
                    </View>
                  </View>
                ))}
          </View>
        )}
      </ScrollView>

      {/* Full Screen Image Viewer Modal */}
      <MobileFeedImageViewer
        visible={viewerVisible}
        images={viewerImages}
        initialIndex={viewerIndex}
        onClose={() => setViewerVisible(false)}
      />

      {/* Create Feed Post Modal */}
      <MobileCreateFeedPostModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={fetchFeeds}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DESIGN_TOKENS.colors.background,
  },
  scrollContent: {
    paddingHorizontal: DESIGN_TOKENS.spacing.comfortable,
    paddingTop: DESIGN_TOKENS.spacing.small,
    paddingBottom: DESIGN_TOKENS.spacing.major,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DESIGN_TOKENS.spacing.standard,
    paddingTop: 4,
  },
  headerTag: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: DESIGN_TOKENS.colors.textMuted,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: DESIGN_TOKENS.colors.textPrimary,
    letterSpacing: -0.4,
  },
  helpdeskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4E6',
    borderColor: '#FECDD3',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  helpdeskText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#BE123C',
    marginLeft: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    padding: 4,
    borderRadius: DESIGN_TOKENS.radius.input,
    marginBottom: DESIGN_TOKENS.spacing.standard,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
  },
  activeTabButton: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
    backgroundColor: DESIGN_TOKENS.colors.surface,
  },
  activeFilterChip: {
    backgroundColor: DESIGN_TOKENS.colors.primary,
    borderColor: DESIGN_TOKENS.colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  unreadHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  unreadCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: DESIGN_TOKENS.colors.textSecondary,
  },
  markAllReadText: {
    fontSize: 12,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.primary,
  },
  noticeCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderColor: DESIGN_TOKENS.colors.border,
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: 16,
    marginBottom: 10,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  unreadNoticeCard: {
    backgroundColor: '#FAF5FF',
    borderColor: '#E9D5FF',
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  noticeUnreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: DESIGN_TOKENS.colors.primary,
    marginRight: 6,
  },
  noticeDateText: {
    fontSize: 11,
    color: DESIGN_TOKENS.colors.textMuted,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.textPrimary,
    marginBottom: 4,
  },
  noticeMessage: {
    fontSize: 12,
    color: DESIGN_TOKENS.colors.textSecondary,
    lineHeight: 18,
  },
  emptyCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderColor: DESIGN_TOKENS.colors.border,
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  createPostBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderColor: DESIGN_TOKENS.colors.border,
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  createPostAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DESIGN_TOKENS.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  createPostPlaceholder: {
    flex: 1,
    fontSize: 13,
    color: DESIGN_TOKENS.colors.textMuted,
    fontWeight: '500',
  },
  feedCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderColor: DESIGN_TOKENS.colors.border,
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: 18,
    marginBottom: 14,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  feedAvatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DESIGN_TOKENS.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  feedAuthorName: {
    fontSize: 13,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.textPrimary,
  },
  feedMetaText: {
    fontSize: 11,
    color: DESIGN_TOKENS.colors.textMuted,
    marginTop: 1,
  },
  feedTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: DESIGN_TOKENS.colors.textPrimary,
    marginBottom: 6,
  },
  feedContent: {
    fontSize: 13,
    color: DESIGN_TOKENS.colors.textSecondary,
    lineHeight: 19,
    marginBottom: 14,
  },
  feedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: DESIGN_TOKENS.colors.borderLight,
  },
  feedActionText: {
    fontSize: 12,
    color: DESIGN_TOKENS.colors.textSecondary,
    marginLeft: 4,
  },
  broadcastTag: {
    fontSize: 10,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.textMuted,
    textTransform: 'uppercase',
  },
});
