import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ROUTES } from '../../constants/routes';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';
import { useAcademicsStore } from '../../stores/academics.store';

export interface DailyAttendancePillProps {
  status?: 'present' | 'absent' | 'late' | 'holiday' | 'unmarked';
  timestamp?: string;
  onPress?: () => void;
}

export const DailyAttendancePill: React.FC<DailyAttendancePillProps> = React.memo(
  ({ status, timestamp, onPress }) => {
    const router = useRouter();
    const setActiveTab = useAcademicsStore((s) => s.setActiveTab);
    const attendanceSummary = useAcademicsStore((s) => s.attendance);
    const [expanded, setExpanded] = useState(false);

    const handleOpenAcademics = () => {
      setActiveTab('attendance');
      if (onPress) {
        onPress();
      } else {
        router.push(ROUTES.MAIN.ACADEMICS as any);
      }
    };

    const effectiveStatus = status || 'unmarked';

    const getStatusConfig = () => {
      switch (effectiveStatus) {
        case 'present':
          return {
            icon: 'checkmark-circle-outline' as const,
            iconColor: DESIGN_TOKENS.colors.emerald,
            iconBg: '#ECFDF5',
            iconBorder: 'rgba(5, 150, 105, 0.2)',
            title: 'Present Today',
            badgeText: 'On Time',
            badgeBg: 'rgba(5, 150, 105, 0.12)',
            badgeColor: DESIGN_TOKENS.colors.emerald,
            subtitle: timestamp
              ? `Marked at ${timestamp} by Class Teacher`
              : 'Marked present for today',
          };
        case 'late':
          return {
            icon: 'time-outline' as const,
            iconColor: DESIGN_TOKENS.colors.amber,
            iconBg: '#FFFBEB',
            iconBorder: 'rgba(217, 119, 6, 0.2)',
            title: 'Late Entry',
            badgeText: 'Delayed',
            badgeBg: 'rgba(217, 119, 6, 0.12)',
            badgeColor: DESIGN_TOKENS.colors.amber,
            subtitle: timestamp
              ? `Arrived at school at ${timestamp}`
              : 'Late arrival recorded today',
          };
        case 'absent':
          return {
            icon: 'alert-circle-outline' as const,
            iconColor: DESIGN_TOKENS.colors.rose,
            iconBg: '#FFF1F2',
            iconBorder: 'rgba(225, 29, 72, 0.2)',
            title: 'Marked Absent',
            badgeText: 'Absence',
            badgeBg: 'rgba(225, 29, 72, 0.12)',
            badgeColor: DESIGN_TOKENS.colors.rose,
            subtitle: 'Absence recorded for regular class sessions',
          };
        case 'holiday':
          return {
            icon: 'sunny-outline' as const,
            iconColor: DESIGN_TOKENS.colors.skyBlue,
            iconBg: '#F0F9FF',
            iconBorder: 'rgba(14, 165, 233, 0.2)',
            title: 'School Holiday',
            badgeText: 'Holiday',
            badgeBg: 'rgba(14, 165, 233, 0.12)',
            badgeColor: DESIGN_TOKENS.colors.skyBlue,
            subtitle: 'Campus closed • No classes scheduled',
          };
        default:
          return {
            icon: 'time-outline' as const,
            iconColor: '#64748B',
            iconBg: '#F1F5F9',
            iconBorder: '#E2E8F0',
            title: 'Attendance Pending',
            badgeText: 'Pending',
            badgeBg: '#E2E8F0',
            badgeColor: '#475569',
            subtitle: 'Attendance session in progress',
          };
      }
    };

    const config = getStatusConfig();
    const hasMonthlyRate =
      attendanceSummary?.percentage !== undefined && attendanceSummary?.percentage !== null;
    const monthlyRateText = hasMonthlyRate ? `${attendanceSummary.percentage}%` : '—';
    const presentDaysText =
      attendanceSummary?.presentDays !== undefined ? `${attendanceSummary.presentDays} Days` : '—';
    const absentDaysText =
      attendanceSummary?.absentDays !== undefined ? `${attendanceSummary.absentDays} Days` : '—';
    const lateDaysText =
      attendanceSummary?.lateDays !== undefined ? `${attendanceSummary.lateDays} Days` : '—';

    return (
      <View style={styles.wrapper}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => setExpanded((prev) => !prev)}
          style={styles.cardContainer}
          accessibilityRole="button"
          accessibilityLabel={`${config.title}, ${config.subtitle}`}
        >
          <View style={styles.leftRow}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: config.iconBg, borderColor: config.iconBorder },
              ]}
            >
              <Ionicons name={config.icon} size={24} color={config.iconColor} />
            </View>

            <View style={styles.contentColumn}>
              <View style={styles.titleRow}>
                <Text style={styles.titleText}>{config.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: config.badgeBg }]}>
                  <Text style={[styles.statusBadgeText, { color: config.badgeColor }]}>
                    {config.badgeText}
                  </Text>
                </View>
              </View>

              <View style={styles.subtitleRow}>
                <Ionicons name="time-outline" size={13} color={DESIGN_TOKENS.colors.emerald} />
                <Text style={styles.subtitleText} numberOfLines={1}>
                  {config.subtitle}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.rightRow}>
            <View style={styles.monthlyColumn}>
              <Text style={styles.monthlyLabel}>Monthly</Text>
              <Text style={styles.monthlyValue}>{monthlyRateText}</Text>
            </View>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-forward'}
              size={16}
              color="#CBD5E1"
            />
          </View>
        </TouchableOpacity>

        {/* Expandable Breakdown Drawer */}
        {expanded && (
          <View style={styles.drawerContainer}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>
                Attendance Breakdown
                {attendanceSummary?.totalDays ? ` • ${attendanceSummary.totalDays} Total Days` : ''}
              </Text>
              <TouchableOpacity onPress={handleOpenAcademics} activeOpacity={0.75}>
                <Text style={styles.drawerGoal}>Full Report &gt;</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statBoxGreen}>
                <Text style={styles.statBoxLabel}>Total Present</Text>
                <Text style={styles.statBoxValueGreen}>{presentDaysText}</Text>
              </View>
              <View style={styles.statBoxRose}>
                <Text style={styles.statBoxLabel}>Absent</Text>
                <Text style={styles.statBoxValueRose}>{absentDaysText}</Text>
              </View>
              <View style={styles.statBoxIndigo}>
                <Text style={styles.statBoxLabel}>Late Entry</Text>
                <Text style={styles.statBoxValueIndigo}>{lateDaysText}</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  },
);

DailyAttendancePill.displayName = 'DailyAttendancePill';

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentColumn: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  subtitleText: {
    fontSize: 12,
    color: DESIGN_TOKENS.colors.textSecondary,
    flex: 1,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthlyColumn: {
    alignItems: 'flex-end',
  },
  monthlyLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: DESIGN_TOKENS.colors.textMuted,
  },
  monthlyValue: {
    fontSize: 13,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.emerald,
  },
  drawerContainer: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(5, 150, 105, 0.2)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  drawerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.deepNavy,
  },
  drawerGoal: {
    fontSize: 11,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.royalIndigo,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  statBoxGreen: {
    flex: 1,
    backgroundColor: 'rgba(5, 150, 105, 0.06)',
    borderColor: 'rgba(5, 150, 105, 0.15)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
  },
  statBoxRose: {
    flex: 1,
    backgroundColor: 'rgba(225, 29, 72, 0.06)',
    borderColor: 'rgba(225, 29, 72, 0.15)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
  },
  statBoxIndigo: {
    flex: 1,
    backgroundColor: 'rgba(67, 56, 202, 0.06)',
    borderColor: 'rgba(67, 56, 202, 0.15)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
  },
  statBoxLabel: {
    fontSize: 10,
    color: DESIGN_TOKENS.colors.textSecondary,
    marginBottom: 2,
  },
  statBoxValueGreen: {
    fontSize: 14,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.emerald,
  },
  statBoxValueRose: {
    fontSize: 14,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.rose,
  },
  statBoxValueIndigo: {
    fontSize: 14,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.royalIndigo,
  },
});
