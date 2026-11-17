import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TimetableDay, TimetablePeriod } from '../../api/academics.api';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';

export type TimetableDayName =
  'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface TimetableSectionProps {
  timetable: TimetableDay[];
  selectedDay: TimetableDayName;
  onSelectDay: (day: TimetableDayName) => void;
  isLoading?: boolean;
}

const WEEKDAYS: { day: TimetableDayName; short: string }[] = [
  { day: 'Monday', short: 'MON' },
  { day: 'Tuesday', short: 'TUE' },
  { day: 'Wednesday', short: 'WED' },
  { day: 'Thursday', short: 'THU' },
  { day: 'Friday', short: 'FRI' },
  { day: 'Saturday', short: 'SAT' },
];

/**
 * Subject theme visual mapper
 */
function getSubjectTheme(subjectName?: string) {
  const s = (subjectName || '').toLowerCase();
  if (s.includes('math')) {
    return {
      barColor: '#2563EB',
      iconBg: '#3B82F6',
      iconName: 'calculator' as const,
      textColor: '#1E40AF',
    };
  }
  if (s.includes('science') || s.includes('evs') || s.includes('bio') || s.includes('env')) {
    return {
      barColor: '#059669',
      iconBg: '#10B981',
      iconName: 'flask' as const,
      textColor: '#065F46',
    };
  }
  if (s.includes('art') || s.includes('craft') || s.includes('music') || s.includes('draw')) {
    return {
      barColor: '#7C3AED',
      iconBg: '#8B5CF6',
      iconName: 'color-palette' as const,
      textColor: '#5B21B6',
    };
  }
  if (s.includes('physical') || s.includes('pe') || s.includes('sport') || s.includes('game')) {
    return {
      barColor: '#EA580C',
      iconBg: '#F97316',
      iconName: 'football' as const,
      textColor: '#9A3412',
    };
  }
  if (s.includes('english') || s.includes('french') || s.includes('hindi') || s.includes('lit')) {
    return {
      barColor: '#4338CA',
      iconBg: '#6366F1',
      iconName: 'book' as const,
      textColor: '#3730A3',
    };
  }
  return {
    barColor: '#4338CA',
    iconBg: '#4F46E5',
    iconName: 'school' as const,
    textColor: '#312E81',
  };
}

export const TimetableSection: React.FC<TimetableSectionProps> = React.memo(
  ({ timetable, selectedDay, onSelectDay, isLoading = false }) => {
    // Locate periods for the selected day
    const daySchedule = timetable.find((d) => d.day === selectedDay)?.periods || [];

    // Helper: Compute dynamic calendar date offset relative to current week
    const now = new Date();
    const currentJsDay = now.getDay(); // 0 is Sunday, 1 is Monday...
    const mondayOffset = currentJsDay === 0 ? -6 : 1 - currentJsDay;
    const mondayDate = new Date(now);
    mondayDate.setDate(now.getDate() + mondayOffset);

    const getDayNumber = (idx: number) => {
      const d = new Date(mondayDate);
      d.setDate(mondayDate.getDate() + idx);
      return String(d.getDate()).padStart(2, '0');
    };

    return (
      <View style={styles.sectionWrapper}>
        {/* 1. DAY SELECTOR (MON - SAT) */}
        <View style={styles.daySelectorCard}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daySelectorScroll}
          >
            {WEEKDAYS.map((w, idx) => {
              const isSelected = selectedDay === w.day;
              const dayNum = getDayNumber(idx);

              return (
                <TouchableOpacity
                  key={w.day}
                  onPress={() => onSelectDay(w.day)}
                  activeOpacity={0.75}
                  style={[styles.dayButton, isSelected && styles.dayButtonActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Select ${w.day}`}
                >
                  <Text style={[styles.dayLabelShort, isSelected && styles.dayLabelShortActive]}>
                    {w.short}
                  </Text>
                  <Text style={[styles.dayNumText, isSelected && styles.dayNumTextActive]}>
                    {dayNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 2. HEADER */}
        <View style={styles.classesHeaderRow}>
          <View style={styles.classesHeaderLeft}>
            <Text style={styles.classesHeaderTitle}>Classes for {selectedDay}</Text>
            <Text style={styles.classesHeaderCount}>({daySchedule.length} Periods)</Text>
          </View>
          <Text style={styles.roomTag}>Room 204 Main Wing</Text>
        </View>

        {/* 3. PERIODS TIMELINE LIST */}
        {daySchedule.length > 0 ? (
          <View style={styles.periodsList}>
            {daySchedule.map((p, idx) => {
              if (p.isBreak) {
                return (
                  <View key={idx} style={styles.breakCard}>
                    <View style={styles.breakLeft}>
                      <Ionicons name="restaurant" size={17} color="#D97706" />
                      <Text style={styles.breakTitle}>
                        {p.breakName || p.subject || 'Nutrition & Lunch Break'}
                      </Text>
                    </View>
                    <Text style={styles.breakTime}>
                      {p.startTime} – {p.endTime}
                    </Text>
                  </View>
                );
              }

              const theme = getSubjectTheme(p.subject);
              const isOngoing = p.status === 'ongoing';
              const isUpcoming = p.status === 'upcoming';

              return (
                <View key={idx} style={[styles.periodCard, isOngoing && styles.periodCardOngoing]}>
                  {/* Left Color Accent Bar */}
                  <View style={[styles.periodAccentBar, { backgroundColor: theme.barColor }]} />

                  {/* Period Details */}
                  <View style={styles.periodCardInner}>
                    <View style={styles.periodTopRow}>
                      <View style={styles.periodLeft}>
                        {/* Subject Icon Box */}
                        <View style={[styles.subjectIconBox, { backgroundColor: theme.iconBg }]}>
                          <Ionicons name={theme.iconName} size={20} color="#FFFFFF" />
                        </View>

                        {/* Title & Metadata */}
                        <View style={styles.subjectTextColumn}>
                          <View style={styles.subjectTitleRow}>
                            <Text style={styles.subjectNameText} numberOfLines={1}>
                              {p.subject}
                            </Text>
                            {isOngoing && (
                              <View style={styles.currentClassBadge}>
                                <Text style={styles.currentClassBadgeText}>CURRENT CLASS</Text>
                              </View>
                            )}
                            {isUpcoming && (
                              <View style={styles.upcomingBadge}>
                                <Text style={styles.upcomingBadgeText}>UPCOMING</Text>
                              </View>
                            )}
                          </View>

                          <Text style={styles.teacherAndRoomText}>
                            {p.teacherName} {p.room ? `• ${p.room}` : ''}
                          </Text>

                          {p.topic ? (
                            <Text
                              style={[styles.topicText, { color: theme.textColor }]}
                              numberOfLines={1}
                            >
                              {p.topic.startsWith('Topic') || p.topic.startsWith('Activity')
                                ? p.topic
                                : `Topic: ${p.topic}`}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      {/* Right Time & Period Tag */}
                      <View style={styles.timeColumn}>
                        <Text style={[styles.timeText, isOngoing && styles.timeTextOngoing]}>
                          {p.startTime} – {p.endTime}
                        </Text>
                        <Text style={styles.periodNumLabel}>Period {p.periodNumber}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="sunny-outline" size={32} color="#D97706" />
            </View>
            <Text style={styles.emptyTitle}>No Classes Scheduled</Text>
            <Text style={styles.emptySubtitle}>
              There are no classroom timetable periods scheduled for {selectedDay}.
            </Text>
          </View>
        )}
      </View>
    );
  },
);

TimetableSection.displayName = 'TimetableSection';

const styles = StyleSheet.create({
  sectionWrapper: {
    gap: 14,
  },
  daySelectorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  daySelectorScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  dayButton: {
    flex: 1,
    minWidth: 48,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  dayButtonActive: {
    backgroundColor: DESIGN_TOKENS.colors.protoIndigo,
    shadowColor: DESIGN_TOKENS.colors.protoIndigo,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  dayLabelShort: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  dayLabelShortActive: {
    color: '#C7D2FE',
  },
  dayNumText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#334155',
    marginTop: 2,
  },
  dayNumTextActive: {
    color: '#FFFFFF',
  },
  classesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  classesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  classesHeaderTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
  },
  classesHeaderCount: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  roomTag: {
    fontSize: 11,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.protoIndigo,
  },
  periodsList: {
    gap: 10,
  },
  periodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    position: 'relative',
    ...DESIGN_TOKENS.shadows.subtle,
  },
  periodCardOngoing: {
    borderColor: DESIGN_TOKENS.colors.protoIndigo,
    borderWidth: 2,
    ...DESIGN_TOKENS.shadows.floating,
  },
  periodAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  periodCardInner: {
    padding: 12,
    paddingLeft: 14,
  },
  periodTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  periodLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  subjectIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  subjectTextColumn: {
    flex: 1,
    minWidth: 0,
  },
  subjectTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  subjectNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
  },
  currentClassBadge: {
    backgroundColor: DESIGN_TOKENS.colors.protoIndigo,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  currentClassBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  upcomingBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  upcomingBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.4,
  },
  teacherAndRoomText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  topicText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  timeColumn: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  timeTextOngoing: {
    color: DESIGN_TOKENS.colors.protoIndigo,
    fontWeight: '800',
  },
  periodNumLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  breakCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  breakTime: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
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
  },
});
