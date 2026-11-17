import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ROUTES } from '../../constants/routes';
import { useAcademicsStore } from '../../stores/academics.store';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';

export interface AcademicPriorityCardProps {
  pendingAssignmentsCount?: number;
  assignmentsSummary?: string;
  upcomingExamNotice?: string | null;
}

export const AcademicPriorityCard: React.FC<AcademicPriorityCardProps> = React.memo(
  ({
    pendingAssignmentsCount: propPendingCount,
    assignmentsSummary: propSummary,
    upcomingExamNotice: propExamNotice,
  }) => {
    const router = useRouter();
    const homework = useAcademicsStore((s) => s.homework);
    const exams = useAcademicsStore((s) => s.exams);
    const setActiveTab = useAcademicsStore((s) => s.setActiveTab);

    // Compute from real store data if not passed as prop
    const pendingHomework = homework.filter((h) => h.status === 'pending');
    const firstHomework = pendingHomework.length > 0 ? pendingHomework[0] : null;
    const firstExam = exams.length > 0 ? exams[0] : null;

    const hasPriorities = Boolean(firstHomework || firstExam);
    const totalPrioritiesCount = (firstHomework ? 1 : 0) + (firstExam ? 1 : 0);

    const handleOpenAssignments = () => {
      setActiveTab('homework');
      router.push(ROUTES.MAIN.ACADEMICS as any);
    };

    const handleOpenExams = () => {
      setActiveTab('exams');
      router.push(ROUTES.MAIN.ACADEMICS as any);
    };

    return (
      <View style={styles.cardContainer}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Ionicons name="notifications" size={20} color={DESIGN_TOKENS.colors.amber} />
            <Text style={styles.sectionTitle}>Academic Priorities</Text>
          </View>
          <TouchableOpacity
            onPress={handleOpenAssignments}
            activeOpacity={0.75}
            style={styles.viewAllButton}
            accessibilityRole="button"
            accessibilityLabel="View all academic priorities"
          >
            <Text style={styles.viewAllText}>View All ({totalPrioritiesCount})</Text>
          </TouchableOpacity>
        </View>

        {hasPriorities ? (
          <View style={styles.prioritiesList}>
            {/* Priority 1: Pending Homework (Amber) */}
            {firstHomework && (
              <View style={styles.priorityCardAmber}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.iconCircleAmber}>
                    <Ionicons name="document-text" size={17} color={DESIGN_TOKENS.colors.amber} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleBadgeRow}>
                      <Text style={styles.priorityTitle} numberOfLines={1}>
                        {firstHomework.subject}: {firstHomework.title}
                      </Text>
                      <View style={styles.dueBadgeAmber}>
                        <Text style={styles.dueBadgeTextAmber}>
                          {firstHomework.dueDate
                            ? `DUE ${firstHomework.dueDate.toUpperCase()}`
                            : 'PENDING'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.prioritySubtitle} numberOfLines={2}>
                      {firstHomework.description ||
                        'Complete exercises and prepare for submission.'}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionRowRight}>
                  <TouchableOpacity
                    onPress={handleOpenAssignments}
                    activeOpacity={0.75}
                    style={styles.actionLink}
                  >
                    <Text style={styles.actionLinkText}>Review</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Priority 2: Upcoming Exam (Violet) */}
            {firstExam && (
              <View style={styles.priorityCardViolet}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.iconCircleViolet}>
                    <Ionicons name="school" size={17} color={DESIGN_TOKENS.colors.electricViolet} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleBadgeRow}>
                      <Text style={styles.priorityTitle} numberOfLines={1}>
                        {firstExam.subject}: {firstExam.examName}
                      </Text>
                      <View style={styles.dueBadgeViolet}>
                        <Text style={styles.dueBadgeTextViolet}>
                          {firstExam.examDate ? firstExam.examDate.toUpperCase() : 'UPCOMING'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.prioritySubtitle} numberOfLines={2}>
                      {firstExam.instructions || 'Syllabus and test guidelines uploaded to portal.'}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionRowRight}>
                  <TouchableOpacity
                    onPress={handleOpenExams}
                    activeOpacity={0.75}
                    style={styles.actionLink}
                  >
                    <Text style={styles.actionLinkText}>Syllabus</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="happy-outline" size={26} color={DESIGN_TOKENS.colors.emerald} />
            </View>
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptySubtitle}>
              Zero pending homework or urgent alerts. Outstanding job!
            </Text>
          </View>
        )}
      </View>
    );
  },
);

AcademicPriorityCard.displayName = 'AcademicPriorityCard';

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
  },
  viewAllButton: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.royalIndigo,
  },
  prioritiesList: {
    gap: 10,
  },
  priorityCardAmber: {
    backgroundColor: 'rgba(217, 119, 6, 0.05)',
    borderColor: 'rgba(217, 119, 6, 0.2)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  priorityCardViolet: {
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
    borderColor: 'rgba(124, 58, 237, 0.2)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconCircleAmber: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  iconCircleViolet: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  priorityTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
    flex: 1,
  },
  dueBadgeAmber: {
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  dueBadgeTextAmber: {
    fontSize: 9,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.amber,
  },
  dueBadgeViolet: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  dueBadgeTextViolet: {
    fontSize: 9,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.electricViolet,
  },
  prioritySubtitle: {
    fontSize: 12,
    color: DESIGN_TOKENS.colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  actionRowRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  actionLink: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  actionLinkText: {
    fontSize: 12,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.royalIndigo,
  },
  emptyContainer: {
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
    marginBottom: 2,
  },
  emptySubtitle: {
    fontSize: 12,
    color: DESIGN_TOKENS.colors.textSecondary,
    textAlign: 'center',
  },
});
