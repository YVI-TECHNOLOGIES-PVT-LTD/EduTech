import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ROUTES } from '../../constants/routes';
import { useAcademicsStore } from '../../stores/academics.store';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';

export interface ScheduleClassItem {
  title: string;
  time: string;
  room?: string;
  instructor?: string;
  periodName?: string;
  nextClass?: string;
}

export interface TodayScheduleGlanceProps {
  currentClass?: ScheduleClassItem | null;
  onPress?: () => void;
}

export const TodayScheduleGlance: React.FC<TodayScheduleGlanceProps> = React.memo(
  ({ currentClass, onPress }) => {
    const router = useRouter();
    const timetable = useAcademicsStore((s) => s.timetable);
    const isLoading = useAcademicsStore((s) => s.isLoading);
    const setActiveTab = useAcademicsStore((s) => s.setActiveTab);

    const handlePress = () => {
      setActiveTab('timetable');
      if (onPress) {
        onPress();
      } else {
        router.push(ROUTES.MAIN.ACADEMICS as any);
      }
    };

    // Determine current day of week
    const today = new Date();
    const isWeekend = today.getDay() === 0 || today.getDay() === 6;
    const dayNames: (
      'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'
    )[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = dayNames[today.getDay()];
    const dateFormatted = today.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

    // Find today's periods from timetable store
    const todayDayObj = timetable.find((d) => d.day === currentDayName);
    const todayPeriods = todayDayObj?.periods || [];

    const activePeriod =
      currentClass ||
      (todayPeriods.length > 0
        ? {
            periodName: `Period ${todayPeriods[0].periodNumber || 1}`,
            title: todayPeriods[0].subject,
            time: `${todayPeriods[0].startTime} – ${todayPeriods[0].endTime}`,
            room: todayPeriods[0].room || 'Classroom',
            instructor: todayPeriods[0].teacherName || 'Subject Teacher',
          }
        : null);

    const upcomingPeriods = todayPeriods.length > 1 ? todayPeriods.slice(1, 3) : [];
    const periodCountLabel = `${todayPeriods.length} ${todayPeriods.length === 1 ? 'Period' : 'Periods'}`;

    return (
      <View style={styles.cardContainer}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconCircle}>
              <Ionicons name="calendar" size={18} color={DESIGN_TOKENS.colors.royalIndigo} />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Today's Schedule</Text>
              <Text style={styles.sectionSubtitle}>
                {currentDayName}, {dateFormatted} • {periodCountLabel}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.75}
            style={styles.viewAllButton}
            accessibilityRole="button"
            accessibilityLabel="View full weekly timetable"
          >
            <Text style={styles.viewAllText}>Full Timetable</Text>
            <Ionicons name="chevron-forward" size={14} color={DESIGN_TOKENS.colors.royalIndigo} />
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {isLoading && !activePeriod ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={DESIGN_TOKENS.colors.royalIndigo} />
            <Text style={styles.loadingText}>Loading class schedule...</Text>
          </View>
        ) : !activePeriod ? (
          /* Empty State for Weekend/Holiday or no scheduled periods */
          <View style={styles.emptyStateBox}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name="calendar-outline"
                size={26}
                color={DESIGN_TOKENS.colors.royalIndigo}
              />
            </View>
            <Text style={styles.emptyTitle}>No Classes Scheduled Today</Text>
            <Text style={styles.emptySubtitle}>
              {isWeekend
                ? 'School is closed for the weekend. Enjoy quality family time with your child!'
                : 'No classes or timetable periods are scheduled for today.'}
            </Text>
            <View style={styles.resumeBadge}>
              <Ionicons name="checkmark-circle" size={14} color={DESIGN_TOKENS.colors.emerald} />
              <Text style={styles.resumeBadgeText}>
                {isWeekend
                  ? 'Classes resume on Monday'
                  : 'Tap Full Timetable for the weekly schedule'}
              </Text>
            </View>
          </View>
        ) : (
          /* Normal State: Active Class & Upcoming Periods */
          <View style={styles.scheduleContent}>
            {/* Active / In Progress Class */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handlePress}
              style={styles.activeClassBox}
            >
              <View style={styles.activeClassLeftBar} />

              <View style={styles.activeClassInner}>
                <View style={styles.activeClassLeft}>
                  <View style={styles.subjectIconBox}>
                    <Ionicons name="school" size={20} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.subjectHeaderRow}>
                      <Text style={styles.subjectName}>{activePeriod.title}</Text>
                      <View style={styles.inProgressTag}>
                        <Text style={styles.inProgressText}>SCHEDULED</Text>
                      </View>
                    </View>
                    <Text style={styles.instructorText}>
                      {activePeriod.room} • {activePeriod.instructor}
                    </Text>
                  </View>
                </View>

                <View style={styles.timeColumn}>
                  <Text style={styles.timeRangeText}>{activePeriod.time}</Text>
                  <Text style={styles.periodNumberText}>
                    {activePeriod.periodName || 'Period 1'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Upcoming Periods Grid (if any) */}
            {upcomingPeriods.length > 0 && (
              <View style={styles.upcomingGrid}>
                {upcomingPeriods.map((period, idx) => (
                  <View key={`period-${period.periodNumber || idx}`} style={styles.upcomingTile}>
                    <View style={idx === 0 ? styles.upcomingIconGreen : styles.upcomingIconAmber}>
                      <Ionicons
                        name={idx === 0 ? 'flask' : 'color-palette'}
                        size={17}
                        color={
                          idx === 0 ? DESIGN_TOKENS.colors.emerald : DESIGN_TOKENS.colors.amber
                        }
                      />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.upcomingSubject} numberOfLines={1}>
                        {period.subject}
                      </Text>
                      <Text style={styles.upcomingTime}>
                        {period.startTime} – {period.endTime}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  },
);

TodayScheduleGlance.displayName = 'TodayScheduleGlance';

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
    gap: 10,
  },
  headerIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: DESIGN_TOKENS.colors.textSecondary,
    marginTop: 1,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.royalIndigo,
  },
  loadingBox: {
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: DESIGN_TOKENS.colors.textSecondary,
  },
  scheduleContent: {
    gap: 10,
  },
  activeClassBox: {
    backgroundColor: 'rgba(67, 56, 202, 0.05)',
    borderColor: 'rgba(67, 56, 202, 0.2)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  activeClassLeftBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: DESIGN_TOKENS.colors.royalIndigo,
  },
  activeClassInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 6,
  },
  activeClassLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  subjectIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: DESIGN_TOKENS.colors.royalIndigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
  },
  inProgressTag: {
    backgroundColor: DESIGN_TOKENS.colors.royalIndigo,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  inProgressText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  instructorText: {
    fontSize: 12,
    color: DESIGN_TOKENS.colors.textSecondary,
    marginTop: 2,
  },
  timeColumn: {
    alignItems: 'flex-end',
  },
  timeRangeText: {
    fontSize: 12,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.royalIndigo,
  },
  periodNumberText: {
    fontSize: 10,
    color: DESIGN_TOKENS.colors.textMuted,
    marginTop: 1,
  },
  upcomingGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  upcomingTile: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  upcomingIconGreen: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingIconAmber: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingSubject: {
    fontSize: 12,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
  },
  upcomingTime: {
    fontSize: 11,
    color: DESIGN_TOKENS.colors.textSecondary,
    marginTop: 1,
  },
  emptyStateBox: {
    paddingVertical: 18,
    paddingHorizontal: 16,
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
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: DESIGN_TOKENS.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 280,
    marginBottom: 10,
  },
  resumeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  resumeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.emerald,
  },
});
