import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Platform,
  StatusBar,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChildStore } from '../../../src/stores/child.store';
import { useAcademicsStore, AcademicsTab } from '../../../src/stores/academics.store';
import { SelectedChildCard } from '../../../src/components/child/SelectedChildCard';
import { ChildSwitcherSheet } from '../../../src/components/child/ChildSwitcherSheet';
import {
  AcademicHeader,
  AcademicTabs,
  AttendanceOverviewSection,
  TimetableSection,
  HomeworkSection,
  ExamsSection,
  TimetableDayName,
  HomeworkFilterKey,
} from '../../../src/components/academics';
import { ExamItem } from '../../../src/api/academics.api';
import { useUnreadNotificationCount } from '../../../src/features/notifications/hooks/useUnreadNotificationCount';
import { EnrolledChild } from '../../../src/types/child.types';
import { DESIGN_TOKENS } from '../../../src/theme/tokens/designTokens';

export default function AcademicsHubScreen() {
  const insets = useSafeAreaInsets();
  const activeChild = useChildStore((s) => s.getSelectedChild());
  const academicContext = useChildStore((s) => s.academicContext);
  const isEnrolled = activeChild?.kind === 'enrolled';
  const enrolledStudent = isEnrolled ? (activeChild as EnrolledChild) : null;
  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  const [switcherVisible, setSwitcherVisible] = useState(false);
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

  const {
    activeTab,
    selectedDay,
    homeworkFilter,
    attendance,
    timetable,
    homework,
    exams,
    reportCard,
    tabLoading,
    setActiveTab,
    setSelectedDay,
    setHomeworkFilter,
    loadActiveTabOnly,
    markHomeworkSubmitted,
  } = useAcademicsStore();

  // Demand-based loading: Only fetch active tab when enrolled child or active tab changes
  useEffect(() => {
    if (enrolledStudent?.studentId) {
      loadActiveTabOnly(enrolledStudent.studentId);
    }
  }, [enrolledStudent?.studentId, activeTab, loadActiveTabOnly]);

  const handleRefresh = async () => {
    if (enrolledStudent?.studentId) {
      await loadActiveTabOnly(enrolledStudent.studentId, true);
    }
  };

  const pendingHomeworkCount = homework.filter((h) => h.status === 'pending').length;

  // Safe area insets with guaranteed Android status bar & bottom bar clearance
  const androidStatusHeight = StatusBar.currentHeight || 24;
  const topSafeInset =
    insets.top > 0 ? insets.top : Platform.OS === 'android' ? androidStatusHeight : 16;
  const bottomSafeInset = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 16);

  const termLabel =
    academicContext?.termName ||
    (academicContext?.displayText ? academicContext.displayText.split('•')[1]?.trim() : 'Sem 2');

  return (
    <View style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: bottomSafeInset + 96,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={tabLoading[activeTab] || false}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
            colors={[DESIGN_TOKENS.colors.protoIndigo]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 1. ACADEMIC HEADER (Curved navy-indigo gradient) */}
        <AcademicHeader
          termName={termLabel}
          overallRate={attendance?.percentage}
          unreadCount={unreadCount}
          topInset={topSafeInset}
          onTermPress={() => showToast(`Active Term: ${termLabel}`)}
        />

        {/* 2. MAIN BODY (With -mt-8 overlap over header) */}
        <View style={styles.mainOverlapContainer}>
          {/* Selected Student Profile Card with Horizontal Switcher Chips */}
          <SelectedChildCard onOpenSwitcher={() => setSwitcherVisible(true)} />

          {!isEnrolled ? (
            /* Pre-Admission Notice for Applicant Students */
            <View style={styles.applicantCard}>
              <View style={styles.applicantIconContainer}>
                <Ionicons name="school-outline" size={28} color="#D97706" />
              </View>
              <Text style={styles.applicantTitle}>Applicant Records Notice</Text>
              <Text style={styles.applicantSubtitle}>
                Classroom schedules, daily attendance roll-calls, homework assignments, and grade
                cards activate once the student completes enrollment and is assigned to a section.
              </Text>
            </View>
          ) : (
            <>
              {/* 3. ACADEMIC NAVIGATION TABS (Segmented Control) */}
              <AcademicTabs
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                pendingHomeworkCount={pendingHomeworkCount}
              />

              {/* 4. TAB PANELS */}
              {activeTab === 'attendance' && (
                <AttendanceOverviewSection
                  attendance={attendance}
                  termLabel={`${academicContext?.termName || 'Semester II'} • 2026–27`}
                  onViewDetails={() => showToast('Opening Monthly Attendance Ledger')}
                  onViewAllHistory={() => showToast('Full Attendance History')}
                />
              )}

              {activeTab === 'timetable' && (
                <TimetableSection
                  timetable={timetable}
                  selectedDay={selectedDay as TimetableDayName}
                  onSelectDay={(d) => {
                    setSelectedDay(d);
                    showToast(`Viewing schedule for ${d}`);
                  }}
                  isLoading={tabLoading.timetable}
                />
              )}

              {activeTab === 'homework' && (
                <HomeworkSection
                  homework={homework}
                  activeFilter={homeworkFilter as HomeworkFilterKey}
                  onSelectFilter={(f) => {
                    setHomeworkFilter(f);
                    showToast(`Filter: ${f.toUpperCase()}`);
                  }}
                  onMarkDone={(id) => {
                    markHomeworkSubmitted(id);
                    showToast('Marked Homework as Completed ✓');
                  }}
                  isLoading={tabLoading.homework}
                />
              )}

              {activeTab === 'exams' && (
                <ExamsSection
                  exams={exams}
                  reportCard={reportCard}
                  onDownloadHallTicket={() =>
                    showToast('Downloading official Hall Ticket & Admit Card')
                  }
                  onSyllabusPress={(exam: ExamItem) =>
                    showToast(`Syllabus for ${exam.subject}: Standard Curriculum`)
                  }
                  isLoading={tabLoading.exams}
                />
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Child Switcher Bottom Sheet */}
      <ChildSwitcherSheet visible={switcherVisible} onClose={() => setSwitcherVisible(false)} />

      {/* Interactive Floating Toast Notification */}
      {toastMessage && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              top: topSafeInset + 16,
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
          <Ionicons name="checkmark-circle" size={17} color={DESIGN_TOKENS.colors.emerald} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F3FB', // Soft lavender neutral from Stitch design
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  mainOverlapContainer: {
    marginTop: -32, // Seamless overlap over curved header
    paddingHorizontal: 16,
    zIndex: 20,
  },
  applicantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
    ...DESIGN_TOKENS.shadows.floating,
  },
  applicantIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  applicantTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 6,
  },
  applicantSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
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
    fontSize: 12.5,
    fontWeight: '700',
  },
});
