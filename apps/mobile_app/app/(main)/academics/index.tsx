import React, { useEffect, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useChildStore } from '../../../src/stores/child.store';
import { useAcademicsStore, AcademicsTab } from '../../../src/stores/academics.store';
import { SelectedChildCard } from '../../../src/components/child/SelectedChildCard';
import { ChildSwitcherSheet } from '../../../src/components/child/ChildSwitcherSheet';
import { Badge } from '../../../src/components/ui/atoms/Badge';
import { EnrolledChild } from '../../../src/types/child.types';
import { DESIGN_TOKENS } from '../../../src/theme/tokens/designTokens';

export default function AcademicsHubScreen() {
  const activeChild = useChildStore((s) => s.getSelectedChild());
  const isEnrolled = activeChild?.kind === 'enrolled';
  const enrolledStudent = isEnrolled ? (activeChild as EnrolledChild) : null;

  const [switcherVisible, setSwitcherVisible] = useState(false);

  const {
    activeTab,
    selectedDay,
    homeworkFilter,
    attendance,
    timetable,
    homework,
    exams,
    reportCard,
    isLoading,
    setActiveTab,
    setSelectedDay,
    setHomeworkFilter,
    fetchStudentAcademics,
    markHomeworkSubmitted,
  } = useAcademicsStore();

  useEffect(() => {
    if (enrolledStudent?.studentId) {
      fetchStudentAcademics(enrolledStudent.studentId);
    }
  }, [enrolledStudent?.studentId, fetchStudentAcademics]);

  const handleRefresh = async () => {
    if (enrolledStudent?.studentId) {
      await fetchStudentAcademics(enrolledStudent.studentId);
    }
  };

  const days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday')[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  const filteredHomework = homework.filter((item) => {
    if (homeworkFilter === 'all') return true;
    return item.status === homeworkFilter;
  });

  const selectedDaySchedule = timetable.find((d) => d.day === selectedDay)?.periods || [];

  const tabs: { key: AcademicsTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'attendance', label: 'Attendance', icon: 'calendar-outline' },
    { key: 'timetable', label: 'Timetable', icon: 'time-outline' },
    { key: 'homework', label: 'Homework', icon: 'book-outline' },
    { key: 'exams', label: 'Exams', icon: 'ribbon-outline' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={DESIGN_TOKENS.colors.primary}
            colors={[DESIGN_TOKENS.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Page Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTag}>Student Academics</Text>
          <Text style={styles.headerTitle}>Academics & Schedule</Text>
        </View>

        {/* Universal Student Selector */}
        <SelectedChildCard onOpenSwitcher={() => setSwitcherVisible(true)} />

        {!isEnrolled ? (
          /* Pre-Admission Notice */
          <View style={styles.applicantCard}>
            <View style={styles.applicantIconContainer}>
              <Ionicons name="school-outline" size={28} color="#D97706" />
            </View>
            <Text style={styles.applicantTitle}>Applicant Records Notice</Text>
            <Text style={styles.applicantSubtitle}>
              Classroom schedules, daily attendance roll-calls, and grade cards activate once the
              student completes enrollment and is assigned to a section.
            </Text>
          </View>
        ) : (
          <>
            {/* Horizontal Adaptive Tab Navigation */}
            <View style={styles.tabContainer}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    activeOpacity={0.7}
                    style={[styles.tabButton, isActive && styles.activeTabButton]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Ionicons
                      name={tab.icon}
                      size={14}
                      color={
                        isActive ? DESIGN_TOKENS.colors.primary : DESIGN_TOKENS.colors.textSecondary
                      }
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.tabLabel,
                        {
                          color: isActive
                            ? DESIGN_TOKENS.colors.primary
                            : DESIGN_TOKENS.colors.textSecondary,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ========================================================================= */}
            {/* TAB 1: ATTENDANCE OVERVIEW                                                */}
            {/* ========================================================================= */}
            {activeTab === 'attendance' && (
              <View>
                {/* Attendance Summary Header Card */}
                <View style={styles.cardContainer}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.sectionTag}>Term Attendance Overview</Text>
                    {attendance && attendance.totalDays > 0 ? (
                      <Badge
                        label={attendance.percentage >= 75 ? 'Satisfactory' : 'Action Required'}
                        variant={attendance.percentage >= 75 ? 'success' : 'warning'}
                      />
                    ) : null}
                  </View>

                  <View
                    style={{ flexDirection: 'row', alignItems: 'baseline', marginVertical: 12 }}
                  >
                    {isLoading && !attendance ? (
                      <ActivityIndicator size="small" color={DESIGN_TOKENS.colors.primary} />
                    ) : (
                      <>
                        <Text style={styles.heroMetricText}>
                          {attendance && attendance.totalDays > 0
                            ? `${attendance.percentage}%`
                            : '—'}
                        </Text>
                        <Text style={styles.heroMetricSubtext}>
                          {attendance && attendance.totalDays > 0
                            ? 'Attendance Rate'
                            : 'No attendance records yet'}
                        </Text>
                      </>
                    )}
                  </View>

                  {/* Metrics Breakdown Grid */}
                  <View style={styles.metricsRow}>
                    <View style={[styles.metricPill, { backgroundColor: '#DCFCE7' }]}>
                      <Text style={[styles.metricCount, { color: '#166534' }]}>
                        {attendance?.presentDays || 0}
                      </Text>
                      <Text style={[styles.metricLabel, { color: '#15803D' }]}>Present</Text>
                    </View>
                    <View style={[styles.metricPill, { backgroundColor: '#FEE2E2' }]}>
                      <Text style={[styles.metricCount, { color: '#991B1B' }]}>
                        {attendance?.absentDays || 0}
                      </Text>
                      <Text style={[styles.metricLabel, { color: '#B91C1C' }]}>Absent</Text>
                    </View>
                    <View style={[styles.metricPill, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={[styles.metricCount, { color: '#92400E' }]}>
                        {attendance?.lateDays || 0}
                      </Text>
                      <Text style={[styles.metricLabel, { color: '#B45309' }]}>Late</Text>
                    </View>
                    <View
                      style={[
                        styles.metricPill,
                        { backgroundColor: DESIGN_TOKENS.colors.secondarySurface },
                      ]}
                    >
                      <Text
                        style={[styles.metricCount, { color: DESIGN_TOKENS.colors.textPrimary }]}
                      >
                        {attendance?.totalDays || 0}
                      </Text>
                      <Text
                        style={[styles.metricLabel, { color: DESIGN_TOKENS.colors.textSecondary }]}
                      >
                        Working
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Day-by-Day Recent Attendance Timeline */}
                <Text style={styles.sectionHeaderTitle}>Recent Daily Markings</Text>

                {attendance?.records && attendance.records.length > 0 ? (
                  attendance.records.map((rec, i) => {
                    const isPresent = rec.status === 'present';
                    const isLate = rec.status === 'late';
                    const isHoliday = rec.status === 'holiday';
                    const badgeVariant = isPresent
                      ? 'success'
                      : isLate
                        ? 'warning'
                        : isHoliday
                          ? 'neutral'
                          : 'error';

                    return (
                      <View key={i} style={styles.dailyMarkingCard}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            flex: 1,
                            marginRight: 8,
                          }}
                        >
                          <View
                            style={[
                              styles.statusIconBox,
                              {
                                backgroundColor: isPresent
                                  ? '#DCFCE7'
                                  : isLate
                                    ? '#FEF3C7'
                                    : isHoliday
                                      ? '#E0F2FE'
                                      : '#FEE2E2',
                              },
                            ]}
                          >
                            <Ionicons
                              name={
                                isPresent
                                  ? 'checkmark'
                                  : isLate
                                    ? 'time'
                                    : isHoliday
                                      ? 'calendar'
                                      : 'close'
                              }
                              size={18}
                              color={
                                isPresent
                                  ? '#059669'
                                  : isLate
                                    ? '#D97706'
                                    : isHoliday
                                      ? '#0284C7'
                                      : '#DC2626'
                              }
                            />
                          </View>
                          <View>
                            <Text style={styles.markingDateText}>{rec.date}</Text>
                            {rec.remarks ? (
                              <Text style={styles.markingRemarksText}>{rec.remarks}</Text>
                            ) : null}
                          </View>
                        </View>
                        <Badge label={rec.status.toUpperCase()} variant={badgeVariant} />
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.emptyCard}>
                    <Ionicons
                      name="calendar-outline"
                      size={32}
                      color={DESIGN_TOKENS.colors.textMuted}
                    />
                    <Text style={styles.emptyTitle}>
                      No daily records recorded for this term yet.
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      Classroom roll-call updates sync each afternoon.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: TIMETABLE                                                          */}
            {/* ========================================================================= */}
            {activeTab === 'timetable' && (
              <View>
                {/* Day of Week Selector */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
                >
                  {days.map((day) => {
                    const isSelected = selectedDay === day;
                    return (
                      <TouchableOpacity
                        key={day}
                        onPress={() => setSelectedDay(day)}
                        activeOpacity={0.8}
                        style={[styles.dayChip, isSelected && styles.activeDayChip]}
                      >
                        <Text
                          style={[
                            styles.dayChipText,
                            { color: isSelected ? '#FFFFFF' : DESIGN_TOKENS.colors.textPrimary },
                          ]}
                        >
                          {day.slice(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={styles.sectionHeaderTitle}>{selectedDay} Schedule</Text>

                {selectedDaySchedule.length > 0 ? (
                  selectedDaySchedule.map((p, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.periodCard,
                        p.isBreak && { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
                      ]}
                    >
                      <View style={styles.rowBetween}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.periodNumberText}>Period {p.periodNumber}</Text>
                          <Text style={styles.periodTimeText}>
                            {p.startTime} - {p.endTime}
                          </Text>
                        </View>
                        {p.room ? <Badge label={p.room} variant="neutral" /> : null}
                      </View>
                      <Text style={styles.periodSubjectText}>{p.subject}</Text>
                      <Text style={styles.periodTeacherText}>Teacher: {p.teacherName}</Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyCard}>
                    <Ionicons
                      name="sunny-outline"
                      size={32}
                      color={DESIGN_TOKENS.colors.textMuted}
                    />
                    <Text style={styles.emptyTitle}>
                      No classroom periods scheduled for {selectedDay}.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: HOMEWORK & ASSIGNMENTS                                             */}
            {/* ========================================================================= */}
            {activeTab === 'homework' && (
              <View>
                {/* Filter Selector */}
                <View style={styles.filterRow}>
                  {(['all', 'pending', 'submitted'] as const).map((filter) => {
                    const isSelected = homeworkFilter === filter;
                    return (
                      <TouchableOpacity
                        key={filter}
                        onPress={() => setHomeworkFilter(filter)}
                        activeOpacity={0.8}
                        style={[styles.filterChip, isSelected && styles.activeFilterChip]}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            { color: isSelected ? '#FFFFFF' : DESIGN_TOKENS.colors.textPrimary },
                          ]}
                        >
                          {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {filteredHomework.length > 0 ? (
                  filteredHomework.map((hw) => {
                    const isPending = hw.status === 'pending';
                    return (
                      <View key={hw.id} style={styles.homeworkCard}>
                        <View style={styles.rowBetween}>
                          <Badge label={hw.subject} variant="primary" />
                          <Badge
                            label={isPending ? 'Pending' : 'Submitted'}
                            variant={isPending ? 'warning' : 'success'}
                          />
                        </View>
                        <Text style={styles.homeworkTitle}>{hw.title}</Text>
                        <Text style={styles.homeworkDesc}>{hw.description}</Text>

                        <View style={styles.homeworkFooter}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons
                              name="calendar-outline"
                              size={13}
                              color={DESIGN_TOKENS.colors.textMuted}
                            />
                            <Text style={styles.dueDateText}>Due: {hw.dueDate}</Text>
                          </View>
                          {isPending ? (
                            <TouchableOpacity
                              onPress={() => markHomeworkSubmitted(hw.id)}
                              style={styles.markDoneBtn}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.markDoneText}>Mark Done</Text>
                            </TouchableOpacity>
                          ) : (
                            <Text style={styles.completedText}>Completed</Text>
                          )}
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.emptyCard}>
                    <Ionicons
                      name="checkmark-done-circle-outline"
                      size={32}
                      color={DESIGN_TOKENS.colors.success}
                    />
                    <Text style={styles.emptyTitle}>No assignments found for this filter.</Text>
                    <Text style={styles.emptySubtitle}>
                      All assigned homework tasks are currently up to date.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: EXAMINATIONS & REPORT CARD                                         */}
            {/* ========================================================================= */}
            {activeTab === 'exams' && (
              <View>
                {/* Upcoming Exams Section */}
                <Text style={styles.sectionHeaderTitle}>Upcoming Examination Schedule</Text>

                {exams.length > 0 ? (
                  exams.map((exam) => (
                    <View key={exam.id} style={styles.examCard}>
                      <View style={styles.rowBetween}>
                        <Badge label={exam.subject} variant="primary" />
                        <Badge label={`Max ${exam.totalMarks} Marks`} variant="neutral" />
                      </View>
                      <Text style={styles.examTitle}>{exam.examName}</Text>
                      <View style={styles.examMetaRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons
                            name="calendar-outline"
                            size={13}
                            color={DESIGN_TOKENS.colors.textSecondary}
                          />
                          <Text style={styles.examMetaText}>{exam.examDate}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons
                            name="time-outline"
                            size={13}
                            color={DESIGN_TOKENS.colors.textSecondary}
                          />
                          <Text style={styles.examMetaText}>
                            {exam.startTime} - {exam.endTime}
                          </Text>
                        </View>
                        {exam.room ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons
                              name="location-outline"
                              size={13}
                              color={DESIGN_TOKENS.colors.textSecondary}
                            />
                            <Text style={styles.examMetaText}>{exam.room}</Text>
                          </View>
                        ) : null}
                      </View>
                      {exam.instructions ? (
                        <Text style={styles.examInstructions}>Note: {exam.instructions}</Text>
                      ) : null}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyCard}>
                    <Ionicons
                      name="calendar-outline"
                      size={28}
                      color={DESIGN_TOKENS.colors.textMuted}
                    />
                    <Text style={styles.emptyTitle}>No upcoming examinations announced.</Text>
                  </View>
                )}

                {/* Term Results / Report Card Section */}
                <Text style={[styles.sectionHeaderTitle, { marginTop: 16 }]}>
                  Academic Report Card
                </Text>

                {reportCard ? (
                  <View style={styles.cardContainer}>
                    <View style={styles.rowBetween}>
                      <View>
                        <Text style={styles.reportCardTerm}>{reportCard.term}</Text>
                        <Text style={styles.reportCardYear}>{reportCard.academicYear}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Badge label={`Grade ${reportCard.overallGrade}`} variant="success" />
                        <Text style={styles.reportCardGpa}>
                          GPA: {reportCard.gpa.toFixed(1)} / 4.0
                        </Text>
                      </View>
                    </View>

                    {/* Subject Scores Table */}
                    <View style={styles.scoresTable}>
                      {reportCard.results.map((res, i) => (
                        <View key={i} style={styles.scoreRow}>
                          <Text style={styles.scoreSubject}>{res.subject}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={styles.scoreMarks}>
                              {res.marksObtained}/{res.totalMarks}
                            </Text>
                            <Badge label={res.grade} variant="primary" />
                          </View>
                        </View>
                      ))}
                    </View>

                    {reportCard.teacherRemarks ? (
                      <View style={styles.remarksBox}>
                        <Text style={styles.remarksTag}>Teacher's Remarks</Text>
                        <Text style={styles.remarksText}>"{reportCard.teacherRemarks}"</Text>
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.emptyCard}>
                    <Ionicons
                      name="document-text-outline"
                      size={32}
                      color={DESIGN_TOKENS.colors.textMuted}
                    />
                    <Text style={styles.emptyTitle}>
                      Report cards will appear once term evaluation is published.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Child Switcher Bottom Sheet */}
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
  headerContainer: {
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
  applicantCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderColor: DESIGN_TOKENS.colors.border,
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  applicantIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  applicantTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  applicantSubtitle: {
    fontSize: 12,
    color: DESIGN_TOKENS.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
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
  cardContainer: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderColor: DESIGN_TOKENS.colors.border,
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: DESIGN_TOKENS.spacing.comfortable,
    marginBottom: DESIGN_TOKENS.spacing.standard,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTag: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: DESIGN_TOKENS.colors.textMuted,
  },
  heroMetricText: {
    fontSize: 36,
    fontWeight: '900',
    color: DESIGN_TOKENS.colors.textPrimary,
    letterSpacing: -0.6,
  },
  heroMetricSubtext: {
    fontSize: 12,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.textMuted,
    marginLeft: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: DESIGN_TOKENS.colors.borderLight,
  },
  metricPill: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricCount: {
    fontSize: 14,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: DESIGN_TOKENS.colors.textSecondary,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  dailyMarkingCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderColor: DESIGN_TOKENS.colors.border,
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...DESIGN_TOKENS.shadows.subtle,
  },
  statusIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  markingDateText: {
    fontSize: 13,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.textPrimary,
  },
  markingRemarksText: {
    fontSize: 11,
    color: DESIGN_TOKENS.colors.textSecondary,
    marginTop: 1,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
    backgroundColor: DESIGN_TOKENS.colors.surface,
  },
  activeDayChip: {
    backgroundColor: DESIGN_TOKENS.colors.primary,
    borderColor: DESIGN_TOKENS.colors.primary,
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  periodCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderColor: DESIGN_TOKENS.colors.border,
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: 14,
    marginBottom: 10,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  periodNumberText: {
    fontSize: 12,
    fontWeight: '900',
    color: DESIGN_TOKENS.colors.primary,
    marginRight: 8,
  },
  periodTimeText: {
    fontSize: 11,
    fontWeight: '600',
    color: DESIGN_TOKENS.colors.textMuted,
  },
  periodSubjectText: {
    fontSize: 15,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.textPrimary,
    marginTop: 4,
  },
  periodTeacherText: {
    fontSize: 12,
    color: DESIGN_TOKENS.colors.textSecondary,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
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
    backgroundColor: DESIGN_TOKENS.colors.textPrimary,
    borderColor: DESIGN_TOKENS.colors.textPrimary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  homeworkCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderColor: DESIGN_TOKENS.colors.border,
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: 16,
    marginBottom: 10,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  homeworkTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.textPrimary,
    marginTop: 6,
    marginBottom: 3,
  },
  homeworkDesc: {
    fontSize: 12,
    color: DESIGN_TOKENS.colors.textSecondary,
    lineHeight: 17,
    marginBottom: 12,
  },
  homeworkFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: DESIGN_TOKENS.colors.borderLight,
  },
  dueDateText: {
    fontSize: 11,
    color: DESIGN_TOKENS.colors.textMuted,
    fontWeight: '600',
    marginLeft: 4,
  },
  markDoneBtn: {
    backgroundColor: DESIGN_TOKENS.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  markDoneText: {
    fontSize: 11,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.primary,
  },
  completedText: {
    fontSize: 11,
    color: DESIGN_TOKENS.colors.success,
    fontWeight: '700',
  },
  examCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderColor: DESIGN_TOKENS.colors.border,
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: 16,
    marginBottom: 10,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  examTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.textPrimary,
    marginTop: 6,
    marginBottom: 6,
  },
  examMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 2,
  },
  examMetaText: {
    fontSize: 12,
    color: DESIGN_TOKENS.colors.textSecondary,
    fontWeight: '500',
    marginLeft: 4,
  },
  examInstructions: {
    fontSize: 11,
    color: DESIGN_TOKENS.colors.textSecondary,
    backgroundColor: DESIGN_TOKENS.colors.secondarySurface,
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  reportCardTerm: {
    fontSize: 16,
    fontWeight: '900',
    color: DESIGN_TOKENS.colors.textPrimary,
  },
  reportCardYear: {
    fontSize: 12,
    color: DESIGN_TOKENS.colors.textMuted,
    marginTop: 1,
  },
  reportCardGpa: {
    fontSize: 12,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.primary,
    marginTop: 2,
  },
  scoresTable: {
    borderTopWidth: 1,
    borderTopColor: DESIGN_TOKENS.colors.borderLight,
    paddingTop: 10,
    marginTop: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_TOKENS.colors.borderLight,
  },
  scoreSubject: {
    fontSize: 13,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.textPrimary,
  },
  scoreMarks: {
    fontSize: 12,
    fontWeight: '600',
    color: DESIGN_TOKENS.colors.textSecondary,
  },
  remarksBox: {
    backgroundColor: DESIGN_TOKENS.colors.primaryLight,
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  remarksTag: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: DESIGN_TOKENS.colors.primary,
    marginBottom: 2,
  },
  remarksText: {
    fontSize: 12,
    color: DESIGN_TOKENS.colors.textPrimary,
    fontStyle: 'italic',
  },
  emptyCard: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderColor: DESIGN_TOKENS.colors.border,
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: 24,
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 11,
    color: DESIGN_TOKENS.colors.textMuted,
    marginTop: 3,
    textAlign: 'center',
  },
});
