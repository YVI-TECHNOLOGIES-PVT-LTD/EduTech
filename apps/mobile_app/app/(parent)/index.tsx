import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/auth.store';
import { useChildStore } from '../../src/stores/child.store';
import { applicationsApi } from '../../src/api/applications.api';
import { notificationsApi } from '../../src/api/notifications.api';
import { QUERY_KEYS } from '../../src/api/query-keys';
import { ApplicationStatusCard } from '../../src/components/admission/ApplicationStatusCard';
import { SelectedChildCard } from '../../src/components/child/SelectedChildCard';
import { ChildSwitcherSheet } from '../../src/components/child/ChildSwitcherSheet';
import { DailyAttendancePill } from '../../src/components/dashboard/DailyAttendancePill';
import { TodayScheduleGlance } from '../../src/components/dashboard/TodayScheduleGlance';
import { QuickActionGrid } from '../../src/components/dashboard/QuickActionGrid';
import { AcademicPriorityCard } from '../../src/components/dashboard/AcademicPriorityCard';
import { FinanceSummaryWidget } from '../../src/components/dashboard/FinanceSummaryWidget';
import { AnnouncementCarousel } from '../../src/components/dashboard/AnnouncementCarousel';
import { AdmissionApplication } from '../../src/types/admission.types';
import { EnrolledChild, ApplicantChild } from '../../src/types/child.types';
import { getApplicationStatusConfig } from '../../src/utils/status-mapper';
import { useTheme } from '../../src/theme';
import { DESIGN_TOKENS } from '../../src/theme/tokens/designTokens';
import { ParentPortalHeader } from '../../src/components/common/ParentPortalHeader';
import { ParentEmptyState } from '../../src/components/common/ParentEmptyState';
import { ParentLoadingSkeleton } from '../../src/components/common/ParentLoadingSkeleton';
import { Button } from '../../src/components/ui/atoms/Button';

export default function ParentDashboardScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const user = useAuthStore((state) => state.user);

  // Authoritative Child Store (Independent per-child classification)
  const activeChild = useChildStore((s) => s.getSelectedChild());
  const syncChildren = useChildStore((s) => s.syncChildren);
  const isChildLoading = useChildStore((s) => s.isLoading);

  const [switcherVisible, setSwitcherVisible] = useState(false);

  // Synchronize children and lifecycle on mount or auth change
  useEffect(() => {
    syncChildren(user?.id);
  }, [user?.id, syncChildren]);

  // 1. Fetch Applications for Pre-Admission views & fallback
  const {
    data: applications = [],
    isLoading: isAppsLoading,
    isError: isAppsError,
    error: appsError,
    refetch: refetchApps,
    isRefetching: isAppsRefetching,
  } = useQuery<AdmissionApplication[], Error>({
    queryKey: QUERY_KEYS.applications.mine(),
    queryFn: () => applicationsApi.listMine(),
  });

  // 2. Fetch Unread Notifications Count
  const { data: unreadCount = 0 } = useQuery<number, Error>({
    queryKey: QUERY_KEYS.notifications.unreadCount,
    queryFn: () => notificationsApi.getUnreadCount(),
    staleTime: 1000 * 30,
  });

  const handleRefresh = async () => {
    await Promise.all([syncChildren(user?.id), refetchApps()]);
  };

  const parentName =
    user?.full_name ||
    user?.fullName ||
    (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '') ||
    'Parent';

  // Resolve matching application if current active child is an applicant
  const activeAppId =
    activeChild && activeChild.kind === 'applicant'
      ? activeChild.applicationId
      : applications.length > 0
        ? applications[0].application_id || (applications[0] as any).id
        : '';

  const activeApplication =
    applications.find(
      (app: AdmissionApplication) => (app.application_id || (app as any).id) === activeAppId,
    ) || (applications.length > 0 ? applications[0] : null);

  const isEnrolled = activeChild?.kind === 'enrolled';
  const enrolledStudent = isEnrolled ? (activeChild as EnrolledChild) : null;
  const applicantStudent =
    activeChild?.kind === 'applicant' ? (activeChild as ApplicantChild) : null;

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? '#0B0F19' : DESIGN_TOKENS.colors.background },
      ]}
    >
      {/* Top Header */}
      <ParentPortalHeader
        showLogo={true}
        rightAction={
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(parent)/notifications' as any)}
            accessibilityRole="button"
            accessibilityLabel={`Notifications, ${unreadCount} unread`}
            style={[styles.notificationButton, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
          >
            <Feather
              name="bell"
              size={19}
              color={isDark ? '#F1F5F9' : DESIGN_TOKENS.colors.textPrimary}
            />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isAppsRefetching || isChildLoading}
            onRefresh={handleRefresh}
            tintColor={DESIGN_TOKENS.colors.primary}
            colors={[DESIGN_TOKENS.colors.primary]}
          />
        }
      >
        {/* Child Selector Card at Top */}
        <SelectedChildCard onOpenSwitcher={() => setSwitcherVisible(true)} />

        {/* ========================================================================= */}
        {/* VIEW A: POST-ADMISSION ENROLLED STUDENT VIEW (RULE 2: student_enrollments) */}
        {/* ========================================================================= */}
        {isEnrolled && enrolledStudent && (
          <View>
            {/* Student Banner */}
            <View
              style={[
                styles.welcomeCard,
                { backgroundColor: isDark ? '#1E1B4B' : DESIGN_TOKENS.colors.primary },
              ]}
            >
              <View style={styles.sessionHeaderRow}>
                <Text style={styles.sessionTagText}>
                  Academic Year {enrolledStudent.academicYear}
                </Text>
                <View style={styles.enrolledBadge}>
                  <Text style={styles.enrolledBadgeText}>Enrolled Student</Text>
                </View>
              </View>

              <Text style={styles.welcomeGreetingText}>{enrolledStudent.fullName}</Text>
              <Text style={styles.welcomeSubtext}>
                Grade {enrolledStudent.gradeLevel} • Section {enrolledStudent.section}
                {enrolledStudent.rollNumber ? ` • Roll #${enrolledStudent.rollNumber}` : ''} • Adm:{' '}
                {enrolledStudent.admissionNumber}
              </Text>
            </View>

            {/* Daily Attendance Pill */}
            <DailyAttendancePill
              status={(enrolledStudent.attendanceToday?.status as any) || 'present'}
              timestamp={enrolledStudent.attendanceToday?.timestamp}
            />

            {/* Today Schedule Glance */}
            <TodayScheduleGlance />

            {/* Academic Priority Card */}
            <AcademicPriorityCard />

            {/* Operational Student SIS Modules Grid */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={[
                  styles.sectionHeaderTitle,
                  {
                    color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary,
                    marginBottom: 10,
                  },
                ]}
              >
                Student Services & Portals
              </Text>
              <QuickActionGrid />
            </View>

            {/* Student Term Fees Widget */}
            <FinanceSummaryWidget
              hasPendingFees={enrolledStudent.hasPendingFees}
              amount={enrolledStudent.pendingFeeAmount}
            />

            {/* School Announcements */}
            <AnnouncementCarousel />
          </View>
        )}

        {/* ========================================================================= */}
        {/* VIEW B: PRE-ADMISSION APPLICANT VIEW (RULE 1: no student_enrollments)      */}
        {/* ========================================================================= */}
        {!isEnrolled && applicantStudent && (
          <View>
            {/* Welcome Greeting Banner */}
            <View
              style={[
                styles.welcomeCard,
                { backgroundColor: isDark ? '#1E1B4B' : DESIGN_TOKENS.colors.primary },
              ]}
            >
              <View style={styles.sessionHeaderRow}>
                <Text style={styles.sessionTagText}>Session 2026–2027</Text>
                <View style={styles.preAdmissionBadge}>
                  <Text style={styles.preAdmissionBadgeText}>Admission Applicant</Text>
                </View>
              </View>

              <Text style={styles.welcomeGreetingText}>Welcome, {parentName}!</Text>
              <Text style={styles.welcomeSubtext}>
                Tracking application for {applicantStudent.fullName} • Applying:{' '}
                {applicantStudent.applyingGrade}
              </Text>
            </View>

            {/* Active Application Status Section */}
            {activeApplication && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text
                    style={[
                      styles.sectionHeaderTitle,
                      { color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary },
                    ]}
                  >
                    Active Application Status
                  </Text>
                  <TouchableOpacity
                    onPress={handleRefresh}
                    style={styles.refreshLink}
                    accessibilityRole="button"
                    accessibilityLabel="Refresh application status"
                  >
                    <Feather name="refresh-cw" size={13} color={DESIGN_TOKENS.colors.primary} />
                    <Text style={styles.refreshLinkText}>Refresh</Text>
                  </TouchableOpacity>
                </View>

                <ApplicationStatusCard
                  application={activeApplication}
                  onPress={() => {
                    const appId = activeApplication.application_id || (activeApplication as any).id;
                    router.push(`/(parent)/applications/${appId}` as any);
                  }}
                />
              </View>
            )}

            {/* Quick Action Shortcuts for Admission Workflow */}
            <View style={styles.shortcutsSection}>
              <Text
                style={[
                  styles.sectionHeaderTitle,
                  {
                    color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary,
                    marginBottom: 12,
                  },
                ]}
              >
                Admission Portals & Actions
              </Text>

              <View style={styles.shortcutsList}>
                {/* 1. New Admission Application */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push('/(parent)/applications/wizard' as any)}
                  style={[
                    styles.shortcutCard,
                    {
                      backgroundColor: isDark
                        ? 'rgba(81, 70, 229, 0.15)'
                        : DESIGN_TOKENS.colors.primaryLight,
                      borderColor: isDark ? 'rgba(81, 70, 229, 0.35)' : '#C7D2FE',
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="New Admission Application"
                >
                  <View style={styles.shortcutContent}>
                    <View
                      style={[
                        styles.shortcutIconContainer,
                        { backgroundColor: DESIGN_TOKENS.colors.primary },
                      ]}
                    >
                      <Feather name="plus-circle" size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.shortcutTextContainer}>
                      <Text
                        style={[styles.shortcutTitle, { color: isDark ? '#E0E7FF' : '#312E81' }]}
                      >
                        New Admission Application
                      </Text>
                      <Text
                        style={[
                          styles.shortcutDescription,
                          { color: isDark ? '#C7D2FE' : '#4338CA' },
                        ]}
                      >
                        Start an 8-step enrollment application
                      </Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={18} color={DESIGN_TOKENS.colors.primary} />
                </TouchableOpacity>

                {/* 2. My Applications */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push('/(parent)/applications' as any)}
                  style={[
                    styles.shortcutCard,
                    {
                      backgroundColor: isDark ? '#1E293B' : DESIGN_TOKENS.colors.surface,
                      borderColor: isDark ? '#334155' : DESIGN_TOKENS.colors.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="My Applications"
                >
                  <View style={styles.shortcutContent}>
                    <View
                      style={[
                        styles.shortcutIconContainer,
                        {
                          backgroundColor: isDark
                            ? 'rgba(81, 70, 229, 0.2)'
                            : DESIGN_TOKENS.colors.primaryLight,
                        },
                      ]}
                    >
                      <Feather
                        name="file-text"
                        size={20}
                        color={isDark ? '#818CF8' : DESIGN_TOKENS.colors.primary}
                      />
                    </View>
                    <View style={styles.shortcutTextContainer}>
                      <Text
                        style={[
                          styles.shortcutTitle,
                          { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
                        ]}
                      >
                        My Applications
                      </Text>
                      <Text
                        style={[
                          styles.shortcutDescription,
                          { color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary },
                        ]}
                      >
                        View registered applications ({applications.length})
                      </Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={18} color="#94A3B8" />
                </TouchableOpacity>

                {/* 3. Admission Status & Milestones */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    if (activeAppId) {
                      router.push(`/(parent)/status?id=${activeAppId}` as any);
                    } else {
                      router.push('/(parent)/status' as any);
                    }
                  }}
                  style={[
                    styles.shortcutCard,
                    {
                      backgroundColor: isDark ? '#1E293B' : DESIGN_TOKENS.colors.surface,
                      borderColor: isDark ? '#334155' : DESIGN_TOKENS.colors.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Admission Status and Milestones"
                >
                  <View style={styles.shortcutContent}>
                    <View
                      style={[
                        styles.shortcutIconContainer,
                        {
                          backgroundColor: isDark ? 'rgba(14, 165, 233, 0.2)' : '#E0F2FE',
                        },
                      ]}
                    >
                      <Feather
                        name="check-square"
                        size={20}
                        color={isDark ? '#38BDF8' : '#0284C7'}
                      />
                    </View>
                    <View style={styles.shortcutTextContainer}>
                      <Text
                        style={[
                          styles.shortcutTitle,
                          { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
                        ]}
                      >
                        Admission Status & Milestones
                      </Text>
                      <Text
                        style={[
                          styles.shortcutDescription,
                          { color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary },
                        ]}
                      >
                        {activeApplication
                          ? `${activeApplication.student_name || 'Child'}: ${getApplicationStatusConfig(activeApplication.status).label}`
                          : 'Track 7-stage admission progress & requirements'}
                      </Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* VIEW C: EMPTY OR UNLINKED STATE (NO CHILDREN / NO APPLICATIONS YET)       */}
        {/* ========================================================================= */}
        {!activeChild && !isChildLoading && (
          <View>
            <ParentEmptyState
              ionIcon="document-text-outline"
              title="No Admission Applications or Students Yet"
              description="Start your child's enrollment by completing an online admission application, or link your existing student record."
              actionText="Start Admission Application"
              onAction={() => router.push('/(parent)/applications/wizard' as any)}
            />
          </View>
        )}

        {/* Loading Indicator */}
        {isChildLoading && <ParentLoadingSkeleton type="cards" />}
      </ScrollView>

      {/* Child Switcher Bottom Sheet */}
      <ChildSwitcherSheet visible={switcherVisible} onClose={() => setSwitcherVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: DESIGN_TOKENS.spacing.standard,
    paddingTop: 14,
    paddingBottom: 40,
  },
  notificationButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: DESIGN_TOKENS.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  welcomeCard: {
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: 18,
    marginBottom: 16,
    shadowColor: DESIGN_TOKENS.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sessionTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  enrolledBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  enrolledBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  preAdmissionBadge: {
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  preAdmissionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  welcomeGreetingText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  refreshLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.primary,
    marginLeft: 4,
  },
  shortcutsSection: {
    marginTop: 4,
  },
  shortcutsList: {
    gap: 12,
  },
  shortcutCard: {
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: DESIGN_TOKENS.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    minHeight: 68,
  },
  shortcutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  shortcutIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  shortcutTextContainer: {
    flex: 1,
  },
  shortcutTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  shortcutDescription: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 16,
  },
});
