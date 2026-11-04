import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useChildStore } from '../../../src/stores/child.store';
import { useAcademicsStore } from '../../../src/stores/academics.store';
import { useFinanceStore } from '../../../src/stores/finance.store';
import { SelectedChildCard } from '../../../src/components/child/SelectedChildCard';
import { ChildSwitcherSheet } from '../../../src/components/child/ChildSwitcherSheet';
import { DailyAttendancePill } from '../../../src/components/dashboard/DailyAttendancePill';
import { TodayScheduleGlance } from '../../../src/components/dashboard/TodayScheduleGlance';
import { QuickActionGrid } from '../../../src/components/dashboard/QuickActionGrid';
import { AcademicPriorityCard } from '../../../src/components/dashboard/AcademicPriorityCard';
import { FinanceSummaryWidget } from '../../../src/components/dashboard/FinanceSummaryWidget';
import { AnnouncementCarousel } from '../../../src/components/dashboard/AnnouncementCarousel';
import { ApplicantDashboardView } from '../../../src/components/dashboard/ApplicantDashboardView';
import { UnlinkedOnboardingView } from '../../../src/components/dashboard/UnlinkedOnboardingView';
import { useUnreadNotificationCount } from '../../../src/features/notifications/hooks/useUnreadNotificationCount';
import { DESIGN_TOKENS } from '../../../src/theme/tokens/designTokens';
import { ROUTES } from '../../../src/constants/routes';

export default function HomeDashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const activeChild = useChildStore((s) => s.getSelectedChild());
  const syncChildren = useChildStore((s) => s.syncChildren);
  const isChildLoading = useChildStore((s) => s.isLoading);
  const fetchStudentAcademics = useAcademicsStore((s) => s.fetchStudentAcademics);
  const fetchChildFees = useFinanceStore((s) => s.fetchChildFees);
  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  const [switcherVisible, setSwitcherVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Sync children on mount or auth change
  useEffect(() => {
    syncChildren(user?.id);
  }, [user?.id, syncChildren]);

  // When active enrolled student changes, hydrate academics and finance data
  useEffect(() => {
    if (activeChild && activeChild.kind === 'enrolled') {
      fetchStudentAcademics(activeChild.studentId);
      fetchChildFees(activeChild.studentId);
    }
  }, [activeChild, fetchStudentAcademics, fetchChildFees]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await syncChildren(user?.id);
    if (activeChild && activeChild.kind === 'enrolled') {
      await Promise.all([
        fetchStudentAcademics(activeChild.studentId),
        fetchChildFees(activeChild.studentId),
      ]);
    }
    setRefreshing(false);
  };

  // Greeting based on wall-clock time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const parentName =
    user?.first_name || user?.fullName?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'Parent';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isChildLoading}
            onRefresh={handleRefresh}
            tintColor={DESIGN_TOKENS.colors.primary}
            colors={[DESIGN_TOKENS.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View style={styles.greetingContainer}>
            <Text style={styles.portalTag}>EduTrack Family Portal</Text>
            <Text style={styles.greetingTitle}>
              {greeting}, {parentName}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => router.push(ROUTES.COMMON.NOTIFICATIONS as any)}
              style={styles.notificationBtn}
              accessibilityRole="button"
              accessibilityLabel={`Notifications, ${unreadCount} unread`}
              activeOpacity={0.8}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color={DESIGN_TOKENS.colors.textPrimary}
              />
              {unreadCount > 0 ? <View style={styles.unreadDot} /> : null}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push(ROUTES.MAIN.PROFILE as any)}
              style={styles.avatarBtn}
              accessibilityRole="button"
              accessibilityLabel="View profile"
              activeOpacity={0.8}
            >
              <Text style={styles.avatarText}>{parentName.charAt(0).toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Universal Student Selector */}
        <SelectedChildCard onOpenSwitcher={() => setSwitcherVisible(true)} />

        {/* Adaptive View Engine */}
        {!activeChild ? (
          <UnlinkedOnboardingView />
        ) : activeChild.kind === 'applicant' ? (
          <ApplicantDashboardView applicant={activeChild} />
        ) : (
          <>
            {/* Enrolled SIS Experience */}
            <DailyAttendancePill
              status={activeChild.attendanceToday?.status}
              timestamp={activeChild.attendanceToday?.timestamp}
              onPress={() => router.push(ROUTES.MAIN.ACADEMICS as any)}
            />
            <TodayScheduleGlance onPress={() => router.push(ROUTES.MAIN.ACADEMICS as any)} />
            <QuickActionGrid />
            <AcademicPriorityCard />
            <FinanceSummaryWidget
              hasPendingFees={activeChild.hasPendingFees}
              amount={activeChild.pendingFeeAmount}
            />
            <AnnouncementCarousel />
          </>
        )}
      </ScrollView>

      {/* Global Child Switcher Sheet */}
      <ChildSwitcherSheet visible={switcherVisible} onClose={() => setSwitcherVisible(false)} />
    </SafeAreaView>
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
  greetingContainer: {
    flex: 1,
    marginRight: DESIGN_TOKENS.spacing.small,
  },
  portalTag: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: DESIGN_TOKENS.colors.textMuted,
    marginBottom: 2,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: DESIGN_TOKENS.colors.textPrimary,
    letterSpacing: -0.4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderColor: DESIGN_TOKENS.colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...DESIGN_TOKENS.shadows.subtle,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: DESIGN_TOKENS.colors.danger,
    position: 'absolute',
    top: 7,
    right: 7,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DESIGN_TOKENS.colors.primaryLight,
    borderColor: '#C7D2FE',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...DESIGN_TOKENS.shadows.subtle,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '900',
    color: DESIGN_TOKENS.colors.primary,
  },
});
