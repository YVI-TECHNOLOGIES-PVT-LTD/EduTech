import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradientSurface } from '../ui/atoms/GradientSurface';
import { ExamItem, ReportCard } from '../../api/academics.api';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';

export interface ExamsSectionProps {
  exams: ExamItem[];
  reportCard: ReportCard | null;
  onDownloadHallTicket?: () => void;
  onSyllabusPress?: (exam: ExamItem) => void;
  isLoading?: boolean;
}

export const ExamsSection: React.FC<ExamsSectionProps> = React.memo(
  ({ exams, reportCard, onDownloadHallTicket, onSyllabusPress, isLoading = false }) => {
    const nextExam = exams.length > 0 ? exams[0] : null;

    // Helper: Calculate days left until next exam
    const computeDaysLeft = (examDateStr?: string) => {
      if (!examDateStr) return null;
      try {
        const examDate = new Date(examDateStr);
        if (isNaN(examDate.getTime())) return null;
        const now = new Date();
        const diffDays = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 ? diffDays : null;
      } catch {
        return null;
      }
    };

    const daysLeft = nextExam ? computeDaysLeft(nextExam.examDate) : null;

    // Format month short and date number
    const parseExamDate = (dateStr: string) => {
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return { month: 'EXAM', day: '—' };
        const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const day = String(d.getDate()).padStart(2, '0');
        return { month, day };
      } catch {
        return { month: 'EXAM', day: '—' };
      }
    };

    return (
      <View style={styles.sectionWrapper}>
        {/* 1. UPCOMING EXAMINATION ALERT BANNER (If next exam exists) */}
        {nextExam ? (
          <GradientSurface
            colors={['#D97706', '#EA580C', '#E11D48']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.8 }}
            borderRadius={20}
            style={styles.alertBanner}
          >
            <View style={styles.alertLeftColumn}>
              <Text style={styles.alertOverline}>UPCOMING EXAMINATION</Text>
              <Text style={styles.alertTitle} numberOfLines={1}>
                {nextExam.examName}
              </Text>
              <Text style={styles.alertDateTime}>
                {nextExam.examDate} • {nextExam.startTime}
              </Text>
            </View>

            {daysLeft !== null && (
              <View style={styles.countdownBox}>
                <Text style={styles.countdownNumber}>{String(daysLeft).padStart(2, '0')}</Text>
                <Text style={styles.countdownLabel}>DAYS LEFT</Text>
              </View>
            )}
          </GradientSurface>
        ) : null}

        {/* 2. EXAMINATION SCHEDULE LIST */}
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleHeaderRow}>
            <Text style={styles.scheduleHeaderTitle}>Examination Schedule</Text>
            {onDownloadHallTicket && (
              <TouchableOpacity
                onPress={onDownloadHallTicket}
                activeOpacity={0.7}
                style={styles.hallTicketBtn}
                accessibilityRole="button"
                accessibilityLabel="Download Hall Ticket"
              >
                <Ionicons
                  name="download-outline"
                  size={15}
                  color={DESIGN_TOKENS.colors.protoIndigo}
                />
                <Text style={styles.hallTicketText}>Hall Ticket</Text>
              </TouchableOpacity>
            )}
          </View>

          {exams.length > 0 ? (
            <View style={styles.examsList}>
              {exams.map((exam, idx) => {
                const { month, day } = parseExamDate(exam.examDate);
                const isFirst = idx === 0;

                return (
                  <View key={exam.id} style={styles.examItemCard}>
                    <View style={styles.examItemLeft}>
                      {/* Date Block */}
                      <View
                        style={[
                          styles.examDateBlock,
                          isFirst ? styles.examDateBlockViolet : styles.examDateBlockBlue,
                        ]}
                      >
                        <Text
                          style={[
                            styles.examDateMonth,
                            isFirst ? styles.textViolet : styles.textBlue,
                          ]}
                        >
                          {month}
                        </Text>
                        <Text
                          style={[
                            styles.examDateDay,
                            isFirst ? styles.textViolet : styles.textBlue,
                          ]}
                        >
                          {day}
                        </Text>
                      </View>

                      {/* Details Column */}
                      <View style={styles.examItemDetails}>
                        <View style={styles.examTitleRow}>
                          <Text style={styles.examSubjectTitle} numberOfLines={1}>
                            {exam.subject}
                          </Text>
                          {exam.duration ? (
                            <View style={styles.durationBadge}>
                              <Text style={styles.durationBadgeText}>{exam.duration}</Text>
                            </View>
                          ) : (
                            <View style={styles.durationBadge}>
                              <Text style={styles.durationBadgeText}>{exam.totalMarks} Marks</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.examTimeVenue} numberOfLines={1}>
                          {exam.startTime} – {exam.endTime} • {exam.room}
                        </Text>
                      </View>
                    </View>

                    {/* Syllabus / Notes Button */}
                    {onSyllabusPress && (
                      <TouchableOpacity
                        onPress={() => onSyllabusPress(exam)}
                        activeOpacity={0.7}
                        style={styles.syllabusButton}
                        accessibilityRole="button"
                        accessibilityLabel={`View syllabus for ${exam.subject}`}
                      >
                        <Ionicons
                          name="book-outline"
                          size={16}
                          color={DESIGN_TOKENS.colors.protoIndigo}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="calendar-outline" size={32} color="#D97706" />
              </View>
              <Text style={styles.emptyTitle}>No Upcoming Exams Announced</Text>
              <Text style={styles.emptySubtitle}>
                Examination dates, hall tickets, and syllabus outlines will appear here once
                published by the board.
              </Text>
            </View>
          )}
        </View>

        {/* 3. ACADEMIC REPORT CARD (TERM RESULTS) */}
        {reportCard && (
          <View style={styles.reportCardContainer}>
            <View style={styles.reportCardHeader}>
              <View>
                <Text style={styles.reportCardTerm}>{reportCard.term}</Text>
                <Text style={styles.reportCardYear}>{reportCard.academicYear}</Text>
              </View>
              <View style={styles.reportCardGpaBox}>
                <View style={styles.gradeBadge}>
                  <Text style={styles.gradeBadgeText}>Grade {reportCard.overallGrade}</Text>
                </View>
                <Text style={styles.gpaText}>GPA: {reportCard.gpa.toFixed(1)} / 4.0</Text>
              </View>
            </View>

            {/* Subject Marks Table */}
            {reportCard.results && reportCard.results.length > 0 && (
              <View style={styles.resultsTable}>
                {reportCard.results.map((r, i) => (
                  <View key={i} style={styles.resultRow}>
                    <Text style={styles.resultSubjectName}>{r.subject}</Text>
                    <View style={styles.resultMarksRow}>
                      <Text style={styles.resultMarksScore}>
                        {r.marksObtained}/{r.totalMarks}
                      </Text>
                      <View style={styles.scoreGradeBadge}>
                        <Text style={styles.scoreGradeBadgeText}>{r.grade}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Teacher Remarks */}
            {reportCard.teacherRemarks ? (
              <View style={styles.teacherRemarksCard}>
                <Text style={styles.teacherRemarksLabel}>Teacher's Remarks</Text>
                <Text style={styles.teacherRemarksQuote}>"{reportCard.teacherRemarks}"</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>
    );
  },
);

ExamsSection.displayName = 'ExamsSection';

const styles = StyleSheet.create({
  sectionWrapper: {
    gap: 14,
  },
  alertBanner: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...DESIGN_TOKENS.shadows.floating,
  },
  alertLeftColumn: {
    flex: 1,
    marginRight: 12,
  },
  alertOverline: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FEF3C7',
    letterSpacing: 0.6,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  alertDateTime: {
    fontSize: 12,
    color: '#FFEDD5',
    marginTop: 3,
  },
  countdownBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 26,
  },
  countdownLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FDE68A',
    letterSpacing: 0.4,
    marginTop: 1,
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  scheduleHeaderTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
  },
  hallTicketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hallTicketText: {
    fontSize: 12,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.protoIndigo,
  },
  examsList: {
    gap: 10,
  },
  examItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 10,
  },
  examItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  examDateBlock: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  examDateBlockViolet: {
    backgroundColor: '#EDE9FE',
  },
  examDateBlockBlue: {
    backgroundColor: '#DBEAFE',
  },
  examDateMonth: {
    fontSize: 9,
    fontWeight: '800',
  },
  examDateDay: {
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 18,
  },
  textViolet: {
    color: '#6D28D9',
  },
  textBlue: {
    color: '#1D4ED8',
  },
  examItemDetails: {
    flex: 1,
    minWidth: 0,
  },
  examTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  examSubjectTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
  },
  durationBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  durationBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.protoIndigo,
  },
  examTimeVenue: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  syllabusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  reportCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  reportCardTerm: {
    fontSize: 14,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
  },
  reportCardYear: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  reportCardGpaBox: {
    alignItems: 'flex-end',
  },
  gradeBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  gradeBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#059669',
  },
  gpaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 3,
  },
  resultsTable: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    gap: 8,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  resultSubjectName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  resultMarksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultMarksScore: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  scoreGradeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  scoreGradeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.protoIndigo,
  },
  teacherRemarksCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  teacherRemarksLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.protoIndigo,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  teacherRemarksQuote: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
    marginTop: 3,
    lineHeight: 17,
  },
  emptyContainer: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
  },
});
