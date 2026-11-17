import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ROUTES } from '../../constants/routes';
import { useAcademicsStore } from '../../stores/academics.store';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';

export const UpcomingExamsGlance: React.FC = React.memo(() => {
  const router = useRouter();
  const exams = useAcademicsStore((s) => s.exams);
  const setActiveTab = useAcademicsStore((s) => s.setActiveTab);

  if (!exams || exams.length === 0) {
    return null;
  }

  const handleOpenExams = () => {
    setActiveTab('exams');
    router.push(ROUTES.MAIN.ACADEMICS as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconCircle}>
            <Ionicons name="document-text" size={16} color="#D97706" />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Examination Schedule</Text>
            <Text style={styles.sectionSubtitle}>Upcoming Assessment Dates</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleOpenExams}
          activeOpacity={0.75}
          style={styles.viewAllButton}
          accessibilityRole="button"
          accessibilityLabel="View full exam schedule"
        >
          <Text style={styles.viewAllText}>Full Schedule</Text>
          <Ionicons name="chevron-forward" size={13} color={DESIGN_TOKENS.colors.royalIndigo} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {exams.slice(0, 4).map((exam) => (
          <TouchableOpacity
            key={exam.id}
            activeOpacity={0.85}
            onPress={handleOpenExams}
            style={styles.examCard}
          >
            <View style={styles.cardHeader}>
              <View style={styles.dateBadge}>
                <Ionicons name="calendar-outline" size={12} color="#D97706" />
                <Text style={styles.dateBadgeText}>{exam.examDate}</Text>
              </View>
              {exam.totalMarks ? (
                <Text style={styles.marksText}>{exam.totalMarks} Marks</Text>
              ) : null}
            </View>

            <Text style={styles.subjectText} numberOfLines={1}>
              {exam.subject}
            </Text>
            <Text style={styles.examNameText} numberOfLines={1}>
              {exam.examName}
            </Text>

            <View style={styles.cardFooter}>
              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={12} color="#64748B" />
                <Text style={styles.timeText}>
                  {exam.startTime} - {exam.endTime}
                </Text>
              </View>
              {exam.room ? <Text style={styles.roomText}>{exam.room}</Text> : null}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
});

UpcomingExamsGlance.displayName = 'UpcomingExamsGlance';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: DESIGN_TOKENS.colors.textMuted,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#F7F8FC',
    gap: 3,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.royalIndigo,
  },
  scrollContent: {
    gap: 10,
    paddingRight: 16,
  },
  examCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    width: 210,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  dateBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  marksText: {
    fontSize: 10,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.textMuted,
  },
  subjectText: {
    fontSize: 15,
    fontWeight: '900',
    color: DESIGN_TOKENS.colors.deepNavy,
    marginBottom: 2,
  },
  examNameText: {
    fontSize: 11,
    fontWeight: '500',
    color: DESIGN_TOKENS.colors.textSecondary,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 10,
    color: DESIGN_TOKENS.colors.textSecondary,
    fontWeight: '500',
  },
  roomText: {
    fontSize: 10,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.textMuted,
  },
});
