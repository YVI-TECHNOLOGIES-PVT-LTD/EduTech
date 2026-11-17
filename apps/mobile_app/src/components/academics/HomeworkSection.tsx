import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HomeworkItem } from '../../api/academics.api';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';

export type HomeworkFilterKey = 'all' | 'pending' | 'completed' | 'overdue';

export interface HomeworkSectionProps {
  homework: HomeworkItem[];
  activeFilter: HomeworkFilterKey;
  onSelectFilter: (filter: HomeworkFilterKey) => void;
  onMarkDone?: (homeworkId: string) => void;
  isLoading?: boolean;
}

export const HomeworkSection: React.FC<HomeworkSectionProps> = React.memo(
  ({ homework, activeFilter, onSelectFilter, onMarkDone, isLoading = false }) => {
    const now = new Date();

    // Categorize homework counts
    const pendingItems = homework.filter((h) => h.status === 'pending');
    const completedItems = homework.filter((h) => h.status === 'submitted');

    const overdueItems = pendingItems.filter((h) => {
      try {
        const due = new Date(h.dueDate);
        return !isNaN(due.getTime()) && due.getTime() < now.getTime();
      } catch {
        return false;
      }
    });

    const counts: Record<HomeworkFilterKey, number> = {
      all: homework.length,
      pending: pendingItems.length,
      completed: completedItems.length,
      overdue: overdueItems.length,
    };

    // Filter items based on active selection
    const displayItems = homework.filter((h) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'pending') return h.status === 'pending';
      if (activeFilter === 'completed') return h.status === 'submitted';
      if (activeFilter === 'overdue') {
        if (h.status !== 'pending') return false;
        try {
          const due = new Date(h.dueDate);
          return !isNaN(due.getTime()) && due.getTime() < now.getTime();
        } catch {
          return false;
        }
      }
      return true;
    });

    const FILTERS: { key: HomeworkFilterKey; label: string }[] = [
      { key: 'all', label: `All (${counts.all})` },
      { key: 'pending', label: `Pending (${counts.pending})` },
      { key: 'completed', label: `Completed (${counts.completed})` },
      { key: 'overdue', label: `Overdue (${counts.overdue})` },
    ];

    // Subject icon mapper
    const getSubjectIcon = (subjectName: string) => {
      const s = subjectName.toLowerCase();
      if (s.includes('math'))
        return { icon: 'calculator' as const, bg: '#DBEAFE', color: '#1E40AF' };
      if (s.includes('science') || s.includes('evs') || s.includes('bio'))
        return { icon: 'flask' as const, bg: '#D1FAE5', color: '#065F46' };
      if (s.includes('english') || s.includes('lit'))
        return { icon: 'book' as const, bg: '#EDE9FE', color: '#5B21B6' };
      return { icon: 'school' as const, bg: '#EEF2FF', color: '#3730A3' };
    };

    return (
      <View style={styles.sectionWrapper}>
        {/* 1. FILTER PILLS */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const isSelected = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => onSelectFilter(f.key)}
                activeOpacity={0.8}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Filter ${f.label}`}
              >
                <Text
                  style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}
                  numberOfLines={1}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 2. HOMEWORK ASSIGNMENT CARDS */}
        {displayItems.length > 0 ? (
          <View style={styles.cardsList}>
            {displayItems.map((item) => {
              const isCompleted = item.status === 'submitted';
              const subjectMeta = getSubjectIcon(item.subject);

              // Due status label
              let dueLabel = `DUE ${item.dueDate}`;
              let isDueTomorrow = false;
              try {
                const dueDate = new Date(item.dueDate);
                const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                if (diffHours > 0 && diffHours <= 36) {
                  dueLabel = 'DUE TOMORROW';
                  isDueTomorrow = true;
                }
              } catch {}

              return (
                <View
                  key={item.id}
                  style={[
                    styles.homeworkCard,
                    isCompleted ? styles.cardCompleted : styles.cardPending,
                  ]}
                >
                  {/* Top Row: Icon + Subject + Title + Due Badge */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.subjectGroup}>
                      <View style={[styles.subjectIconCircle, { backgroundColor: subjectMeta.bg }]}>
                        <Ionicons name={subjectMeta.icon} size={18} color={subjectMeta.color} />
                      </View>
                      <View style={styles.titleColumn}>
                        <Text style={[styles.subjectTag, { color: subjectMeta.color }]}>
                          {item.subject.toUpperCase()}
                        </Text>
                        <Text style={styles.assignmentTitle} numberOfLines={2}>
                          {item.title}
                        </Text>
                      </View>
                    </View>

                    {/* Status / Deadline Pill */}
                    {isCompleted ? (
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedBadgeText}>COMPLETED ✓</Text>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.pendingDueBadge,
                          isDueTomorrow && { backgroundColor: '#FFE4E6' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.pendingDueBadgeText,
                            isDueTomorrow && { color: '#BE123C' },
                          ]}
                        >
                          {dueLabel}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Description */}
                  {item.description ? (
                    <Text style={styles.descriptionText} numberOfLines={3}>
                      {item.description}
                    </Text>
                  ) : null}

                  {/* Footer Row */}
                  <View style={styles.cardFooter}>
                    <Text style={styles.footerAuthorText} numberOfLines={1}>
                      {isCompleted && item.score
                        ? `Score: ${item.score}`
                        : `Assigned: ${item.teacherName || 'Class Faculty'}`}
                    </Text>

                    {!isCompleted ? (
                      onMarkDone ? (
                        <TouchableOpacity
                          onPress={() => onMarkDone(item.id)}
                          activeOpacity={0.8}
                          style={styles.markDoneButton}
                          accessibilityRole="button"
                          accessibilityLabel="Mark assignment as done"
                        >
                          <Text style={styles.markDoneButtonText}>Mark Done</Text>
                        </TouchableOpacity>
                      ) : null
                    ) : (
                      <Text style={styles.submittedDateText}>
                        {item.submissionDate ? `Submitted ${item.submissionDate}` : 'Verified ✓'}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="checkmark-done-circle-outline" size={34} color="#059669" />
            </View>
            <Text style={styles.emptyTitle}>No Assignments Found</Text>
            <Text style={styles.emptySubtitle}>
              All assignments matching this filter are up to date.
            </Text>
          </View>
        )}
      </View>
    );
  },
);

HomeworkSection.displayName = 'HomeworkSection';

const styles = StyleSheet.create({
  sectionWrapper: {
    gap: 14,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...DESIGN_TOKENS.shadows.subtle,
  },
  filterPillActive: {
    backgroundColor: DESIGN_TOKENS.colors.protoIndigo,
    borderColor: DESIGN_TOKENS.colors.protoIndigo,
  },
  filterPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  cardsList: {
    gap: 12,
  },
  homeworkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  cardPending: {
    borderColor: '#FDE68A',
  },
  cardCompleted: {
    borderColor: '#A7F3D0',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  subjectGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  subjectIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  titleColumn: {
    flex: 1,
    minWidth: 0,
  },
  subjectTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  assignmentTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
    marginTop: 2,
    lineHeight: 19,
  },
  pendingDueBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pendingDueBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.4,
  },
  completedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  completedBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.4,
  },
  descriptionText: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerAuthorText: {
    fontSize: 11.5,
    color: DESIGN_TOKENS.colors.protoIndigo,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  markDoneButton: {
    backgroundColor: DESIGN_TOKENS.colors.protoIndigo,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  markDoneButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  submittedDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyContainer: {
    padding: 24,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ECFDF5',
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
  },
});
