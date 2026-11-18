import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Platform,
  StatusBar,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useChildStore } from '../../../src/stores/child.store';
import { useAcademicsStore } from '../../../src/stores/academics.store';
import { useFinanceStore } from '../../../src/stores/finance.store';
import { useTenantStore } from '../../../src/stores/tenant.store';
import { notificationsApi } from '../../../src/api/notifications.api';
import { NotificationItem } from '../../../src/types/notification.types';
import { SelectedChildCard } from '../../../src/components/child/SelectedChildCard';
import { ChildSwitcherSheet } from '../../../src/components/child/ChildSwitcherSheet';
import { ParentHomeHeader } from '../../../src/components/dashboard/ParentHomeHeader';
import { ParentHeroCarousel } from '../../../src/components/dashboard/ParentHeroCarousel';
import { DailyAttendancePill } from '../../../src/components/dashboard/DailyAttendancePill';
import { TodayScheduleGlance } from '../../../src/components/dashboard/TodayScheduleGlance';
import { QuickActionGrid } from '../../../src/components/dashboard/QuickActionGrid';
import { AcademicPriorityCard } from '../../../src/components/dashboard/AcademicPriorityCard';
import { FinanceSummaryWidget } from '../../../src/components/dashboard/FinanceSummaryWidget';
import {
  AnnouncementCarousel,
  AnnouncementItem,
} from '../../../src/components/dashboard/AnnouncementCarousel';
import { UpcomingEventsSection } from '../../../src/components/dashboard/UpcomingEventsSection';
import { ApplicantDashboardView } from '../../../src/components/dashboard/ApplicantDashboardView';
import { UnlinkedOnboardingView } from '../../../src/components/dashboard/UnlinkedOnboardingView';
import { HomeLoadingSkeleton } from '../../../src/components/dashboard/HomeLoadingSkeleton';
import { useUnreadNotificationCount } from '../../../src/features/notifications/hooks/useUnreadNotificationCount';
import { DESIGN_TOKENS } from '../../../src/theme/tokens/designTokens';
import { ROUTES } from '../../../src/constants/routes';

export default function HomeDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const activeChild = useChildStore((s) => s.getSelectedChild());
  const syncChildren = useChildStore((s) => s.syncChildren);
  const isChildLoading = useChildStore((s) => s.isLoading);
  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  const fetchStudentAcademics = useAcademicsStore((s) => s.fetchStudentAcademics);
  const fetchChildFees = useFinanceStore((s) => s.fetchChildFees);

  const [switcherVisible, setSwitcherVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [latestNotice, setLatestNotice] = useState<NotificationItem | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);

  // In-app interactive toast message state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;

  const showToast = useCallback(
    (msg: string) => {
      setToastMessage(msg);
      Animated.sequence([
        Animated.timing(toastAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.delay(2600),
        Animated.timing(toastAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setToastMessage(null);
      });
    },
    [toastAnim],
  );

  // Sync parent context & authorized children on mount or auth change (60s cached)
  useEffect(() => {
    syncChildren(user?.id);
  }, [user?.id, syncChildren]);

  // Load child-dependent academics and finance data when enrolled active child changes
  useEffect(() => {
    if (activeChild && activeChild.kind === 'enrolled') {
      const studentId = activeChild.studentId || activeChild.id;
      if (studentId) {
        fetchStudentAcademics(studentId).catch(() => {});
        fetchChildFees(studentId).catch(() => {});
      }
    }
  }, [activeChild?.id, activeChild?.kind, fetchStudentAcademics, fetchChildFees]);

  // Load school announcements / circulars from real notifications API
  const loadNotices = useCallback(async () => {
    try {
      const items = await notificationsApi.list();
      if (Array.isArray(items) && items.length > 0) {
        setLatestNotice(items[0]);
        const mapped: AnnouncementItem[] = items.slice(0, 5).map((n) => ({
          id: n.notification_id || String(Math.random()),
          category: n.category || 'School Notice',
          title: n.title,
          date: n.created_at
            ? new Date(n.created_at).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
              })
            : 'Recent',
          snippet: n.message,
          author: n.metadata?.author || 'Administration',
        }));
        setAnnouncements(mapped);
      }
    } catch {
      // Non-blocking fallback
    }
  }, []);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const studentId =
      activeChild && activeChild.kind === 'enrolled'
        ? activeChild.studentId || activeChild.id
        : null;
    await Promise.all([
      syncChildren(user?.id, true),
      studentId ? fetchStudentAcademics(studentId, true) : Promise.resolve(),
      studentId ? fetchChildFees(studentId, true) : Promise.resolve(),
      loadNotices(),
    ]);
    setRefreshing(false);
  };

  const organization = useChildStore((s) => s.organization);
  const academicContext = useChildStore((s) => s.academicContext);
  const lifecycleData = useChildStore((s) => s.lifecycleData);

  const parentName =
    user?.first_name ||
    lifecycleData?.parent?.firstName ||
    user?.fullName?.split(' ')[0] ||
    user?.full_name?.split(' ')[0] ||
    'Parent';

  const parentAvatarUrl =
    user?.avatarUrl || (user as any)?.avatar_url || lifecycleData?.parent?.avatarUrl || null;

  const tenantInfo = useTenantStore((s) => s.tenantInfo);
  const selectedWorkspace = useTenantStore((s) => s.selectedWorkspace);

  const schoolName =
    organization?.orgName ||
    tenantInfo?.schoolName ||
    selectedWorkspace?.name ||
    (activeChild?.kind === 'enrolled' ? activeChild.campusName : undefined) ||
    'EduLyfe International';

  const termInfo =
    academicContext?.displayText ||
    (academicContext?.academicYearName
      ? `Academic Term ${academicContext.academicYearName}${academicContext.termName ? ` • ${academicContext.termName}` : ''}${academicContext.weekNumber ? ` • Week ${academicContext.weekNumber}` : ''}`
      : activeChild?.academicYear
        ? `Academic Session ${activeChild.academicYear}`
        : 'Academic Session 2026–27');

  // Safe area insets with guaranteed Android status bar & bottom bar clearance
  const androidStatusHeight = StatusBar.currentHeight || 24;
  const topSafeInset =
    insets.top > 0 ? insets.top : Platform.OS === 'android' ? androidStatusHeight : 16;
  const bottomSafeInset = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 16);

  const isInitialLoading = isChildLoading && !activeChild && !refreshing;

  return (
    <View style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: bottomSafeInset + 88,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
            colors={[DESIGN_TOKENS.colors.royalIndigo]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* A. PERSONALIZED HEADER (Curved bottom with background gradient & safe area) */}
        <ParentHomeHeader
          parentName={parentName}
          unreadCount={unreadCount}
          avatarUrl={parentAvatarUrl}
          schoolName={schoolName}
          termInfo={termInfo}
          topInset={topSafeInset}
        />

        {/* MAIN SCROLLABLE DASHBOARD (Layered -mt-12 overlap) */}
        <View style={styles.mainOverlapContainer}>
          {isInitialLoading ? (
            <HomeLoadingSkeleton />
          ) : (
            <>
              {/* B. CHILD PROFILE CARD (Elevated White Card with Switcher) */}
              <SelectedChildCard onOpenSwitcher={() => setSwitcherVisible(true)} />

              {/* C. HERO CAROUSEL (4 Visually Distinct Slides with Touch/Swipe) */}
              <ParentHeroCarousel
                child={activeChild}
                parentName={parentName}
                latestNotice={latestNotice}
                onShowToast={showToast}
              />

              {/* ADAPTIVE VIEW ENGINE */}
              {!activeChild ? (
                <UnlinkedOnboardingView />
              ) : activeChild.kind === 'applicant' ? (
                <ApplicantDashboardView applicant={activeChild} />
              ) : (
                <>
                  {/* D. ATTENDANCE WIDGET (Present Today, Marked 08:15 AM, Green Treatment) */}
                  <DailyAttendancePill
                    status={activeChild.attendanceToday?.status}
                    timestamp={activeChild.attendanceToday?.timestamp}
                    onPress={() => router.push(ROUTES.MAIN.ACADEMICS as any)}
                  />

                  {/* E. TODAY'S SCHEDULE (Timetable Preview) */}
                  <TodayScheduleGlance onPress={() => router.push(ROUTES.MAIN.ACADEMICS as any)} />

                  {/* F. QUICK ACTIONS (6 Action Cards in 3-Column Grid) */}
                  <QuickActionGrid />

                  {/* G. ACADEMIC PRIORITIES (Pending assignments & Exams) */}
                  <AcademicPriorityCard />

                  {/* H. FEE STATUS (Financial Summary Card & Pay Now CTA) */}
                  <FinanceSummaryWidget
                    hasPendingFees={activeChild.hasPendingFees}
                    amount={activeChild.pendingFeeAmount}
                    onPayPress={() => router.push(ROUTES.MAIN.FINANCE as any)}
                  />

                  {/* I. SCHOOL ANNOUNCEMENTS (Social-Feed-Inspired Horizontal Cards) */}
                  <AnnouncementCarousel
                    announcements={announcements}
                    onSelectAnnouncement={(item) => setSelectedAnnouncement(item)}
                  />

                  {/* J. UPCOMING EVENTS (PTM, Cultural Gala) */}
                  <UpcomingEventsSection onEventAction={showToast} />
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Global Child Switcher Sheet */}
      <ChildSwitcherSheet visible={switcherVisible} onClose={() => setSwitcherVisible(false)} />

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <Modal
          visible={Boolean(selectedAnnouncement)}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedAnnouncement(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeaderBanner}>
                <View style={styles.modalCategoryBadge}>
                  <Text style={styles.modalCategoryText}>{selectedAnnouncement.category}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedAnnouncement(null)}
                  style={styles.modalCloseButton}
                  accessibilityRole="button"
                  accessibilityLabel="Close announcement modal"
                >
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.modalDateText}>{selectedAnnouncement.date}</Text>
                <Text style={styles.modalTitle}>{selectedAnnouncement.title}</Text>
                <Text style={styles.modalSnippet}>{selectedAnnouncement.snippet}</Text>

                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    onPress={() => {
                      showToast('Circular downloaded to device PDF');
                      setSelectedAnnouncement(null);
                    }}
                    style={styles.modalPrimaryBtn}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.modalPrimaryBtnText}>Download Circular</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setSelectedAnnouncement(null)}
                    style={styles.modalSecondaryBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalSecondaryBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Toast Popup Notification */}
      {toastMessage && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toastContainer,
            {
              top: topSafeInset + 12,
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={18} color={DESIGN_TOKENS.colors.emerald} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DESIGN_TOKENS.colors.background,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  mainOverlapContainer: {
    marginTop: -48, // Seamless overlap over the curved header
    paddingHorizontal: 16,
    zIndex: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    overflow: 'hidden',
    ...DESIGN_TOKENS.shadows.floating,
  },
  modalHeaderBanner: {
    height: 120,
    backgroundColor: DESIGN_TOKENS.colors.royalIndigo,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalCategoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  modalCategoryText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalDateText: {
    fontSize: 11,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.royalIndigo,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: DESIGN_TOKENS.colors.deepNavy,
    marginBottom: 8,
    lineHeight: 22,
  },
  modalSnippet: {
    fontSize: 13,
    color: DESIGN_TOKENS.colors.textSecondary,
    lineHeight: 19,
    marginBottom: 20,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modalPrimaryBtn: {
    flex: 1,
    backgroundColor: DESIGN_TOKENS.colors.royalIndigo,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  modalSecondaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryBtnText: {
    color: DESIGN_TOKENS.colors.deepNavy,
    fontSize: 12,
    fontWeight: '700',
  },
  toastContainer: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(23, 37, 84, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    ...DESIGN_TOKENS.shadows.floating,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
