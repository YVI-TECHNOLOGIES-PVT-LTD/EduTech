import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { GradientSurface } from '../ui/atoms/GradientSurface';
import { AttendanceSummary, AttendanceRecord } from '../../api/academics.api';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';

export interface AttendanceOverviewSectionProps {
  attendance: AttendanceSummary | null;
  termLabel?: string;
  onViewDetails?: () => void;
  onViewAllHistory?: () => void;
}

export const AttendanceOverviewSection: React.FC<AttendanceOverviewSectionProps> = React.memo(
  ({ attendance, termLabel = 'Semester II • Nov 2026', onViewDetails, onViewAllHistory }) => {
    const totalDays = attendance?.totalDays || 0;
    const presentDays = attendance?.presentDays || 0;
    const absentDays = attendance?.absentDays || 0;
    const lateDays = attendance?.lateDays || 0;
    const percentage = attendance?.percentage || 0;
    const records = attendance?.records || [];

    // Donut SVG circumference calculation
    const radius = 48;
    const circumference = 2 * Math.PI * radius;
    const validPercent = Math.min(Math.max(percentage, 0), 100);
    const strokeDashoffset = circumference - (circumference * validPercent) / 100;

    const rateStatusText =
      percentage >= 90
        ? 'EXCELLENT'
        : percentage >= 75
          ? 'SATISFACTORY'
          : percentage > 0
            ? 'ATTENTION'
            : 'UNRECORDED';

    const presentRatio =
      totalDays > 0 ? `${((presentDays / totalDays) * 100).toFixed(1)}% Ratio` : '—';

    // Format weekday short name and day number
    const parseDateBlock = (dateStr: string) => {
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) {
          return { dayOfWeek: 'DAY', dayNum: '—' };
        }
        const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
        const dayNum = String(d.getDate()).padStart(2, '0');
        return { dayOfWeek, dayNum };
      } catch {
        return { dayOfWeek: 'DAY', dayNum: '—' };
      }
    };

    return (
      <View style={styles.sectionWrapper}>
        {/* 1. ATTENDANCE HERO SUMMARY CARD WITH CIRCULAR PROGRESS RING */}
        <GradientSurface
          colors={['#172554', '#4338CA', '#2563EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          borderRadius={24}
          style={styles.heroCard}
        >
          {/* Decorative ambient lights */}
          <View style={styles.heroGlowRight} />
          <View style={styles.heroGlowLeft} />

          {/* Hero Header */}
          <View style={styles.heroHeaderRow}>
            <View>
              <Text style={styles.heroOverline}>ATTENDANCE OVERVIEW</Text>
              <Text style={styles.heroTermText}>{termLabel}</Text>
            </View>
            {onViewDetails && (
              <TouchableOpacity
                onPress={onViewDetails}
                activeOpacity={0.8}
                style={styles.heroDetailsButton}
                accessibilityRole="button"
                accessibilityLabel="View attendance details"
              >
                <Text style={styles.heroDetailsButtonText}>View Details</Text>
                <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Donut Chart + Metrics Layout */}
          <View style={styles.chartAndMetricsRow}>
            {/* Circular Progress Ring */}
            <View style={styles.ringWrapper}>
              <Svg width={116} height={116} viewBox="0 0 120 120">
                {/* Background Track */}
                <Circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="11"
                />
                {/* Progress Stroke */}
                <Circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={percentage >= 75 ? '#10B981' : '#F59E0B'}
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={totalDays > 0 ? strokeDashoffset : circumference}
                  transform="rotate(-90 60 60)"
                />
                {/* Inner Accent Ring */}
                <Circle
                  cx="60"
                  cy="60"
                  r={39}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="1"
                />
              </Svg>

              {/* Center Metric Text */}
              <View style={styles.ringCenterTextWrapper}>
                <Text style={styles.ringPercentText}>{totalDays > 0 ? `${percentage}%` : '—'}</Text>
                <Text style={styles.ringStatusText}>{rateStatusText}</Text>
                <Text style={styles.ringSubtext}>Attendance</Text>
              </View>
            </View>

            {/* Metrics Breakdown Ratios */}
            <View style={styles.ratiosColumn}>
              <View style={styles.ratioPill}>
                <View style={styles.ratioLeft}>
                  <View style={[styles.ratioIndicatorDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.ratioLabelText}>Present Rate</Text>
                </View>
                <Text style={[styles.ratioValueText, { color: '#6EE7B7' }]}>
                  {presentDays} / {totalDays} Days
                </Text>
              </View>

              <View style={styles.ratioPill}>
                <View style={styles.ratioLeft}>
                  <View style={[styles.ratioIndicatorDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.ratioLabelText}>Benchmark</Text>
                </View>
                <Text style={[styles.ratioValueText, { color: '#FFFFFF' }]}>&gt; 85% Required</Text>
              </View>

              <View style={styles.honorsRow}>
                <Ionicons
                  name={percentage >= 85 ? 'checkmark-circle' : 'information-circle'}
                  size={15}
                  color={percentage >= 85 ? '#34D399' : '#A5B4FC'}
                />
                <Text style={styles.honorsText}>
                  {percentage >= 85 ? 'Eligible for Annual Honors' : 'Target: 85% minimum'}
                </Text>
              </View>
            </View>
          </View>
        </GradientSurface>

        {/* 2. ATTENDANCE STATISTICS CARDS (2x2 GRID) */}
        <View style={styles.statsGrid}>
          {/* Card 1: Present */}
          <View style={[styles.statCard, { borderColor: '#A7F3D0', backgroundColor: '#ECFDF5' }]}>
            <View style={styles.statTopRow}>
              <Text style={[styles.statTitle, { color: '#065F46' }]}>Present</Text>
              <View style={[styles.statIconBadge, { backgroundColor: '#059669' }]}>
                <Ionicons name="checkmark-circle" size={17} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.statCountRow}>
              <Text style={[styles.statCount, { color: '#047857' }]}>{presentDays}</Text>
              <Text style={[styles.statUnit, { color: '#059669' }]}>Days</Text>
            </View>
            <View style={[styles.statFooter, { borderTopColor: '#D1FAE5' }]}>
              <Text style={[styles.statRatioText, { color: '#047857' }]}>{presentRatio}</Text>
              <Text style={[styles.statStatusTag, { color: '#059669' }]}>
                {percentage >= 75 ? 'On Track' : 'Review'}
              </Text>
            </View>
          </View>

          {/* Card 2: Absent */}
          <View style={[styles.statCard, { borderColor: '#FECDD3', backgroundColor: '#FFF1F2' }]}>
            <View style={styles.statTopRow}>
              <Text style={[styles.statTitle, { color: '#9F1239' }]}>Absent</Text>
              <View style={[styles.statIconBadge, { backgroundColor: '#E11D48' }]}>
                <Ionicons name="close-circle" size={17} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.statCountRow}>
              <Text style={[styles.statCount, { color: '#BE123C' }]}>
                {String(absentDays).padStart(2, '0')}
              </Text>
              <Text style={[styles.statUnit, { color: '#E11D48' }]}>Days</Text>
            </View>
            <View style={[styles.statFooter, { borderTopColor: '#FFE4E6' }]}>
              <Text style={[styles.statRatioText, { color: '#BE123C' }]}>
                {absentDays > 0 ? 'Leave Logged' : 'Zero Absent'}
              </Text>
              <Text style={[styles.statStatusTag, { color: '#E11D48' }]}>
                {absentDays > 0 ? 'Recorded' : 'Clean'}
              </Text>
            </View>
          </View>

          {/* Card 3: Late Entry */}
          <View style={[styles.statCard, { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' }]}>
            <View style={styles.statTopRow}>
              <Text style={[styles.statTitle, { color: '#92400E' }]}>Late Entry</Text>
              <View style={[styles.statIconBadge, { backgroundColor: '#D97706' }]}>
                <Ionicons name="time" size={17} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.statCountRow}>
              <Text style={[styles.statCount, { color: '#B45309' }]}>
                {String(lateDays).padStart(2, '0')}
              </Text>
              <Text style={[styles.statUnit, { color: '#D97706' }]}>Day(s)</Text>
            </View>
            <View style={[styles.statFooter, { borderTopColor: '#FEF3C7' }]}>
              <Text style={[styles.statRatioText, { color: '#B45309' }]}>
                {lateDays > 0 ? 'Tardy Logged' : 'Punctual'}
              </Text>
              <Text style={[styles.statStatusTag, { color: '#D97706' }]}>
                {lateDays > 0 ? 'Excused' : 'On Time'}
              </Text>
            </View>
          </View>

          {/* Card 4: Working Days */}
          <View style={[styles.statCard, { borderColor: '#BAE6FD', backgroundColor: '#F0F9FF' }]}>
            <View style={styles.statTopRow}>
              <Text style={[styles.statTitle, { color: '#075985' }]}>Working Days</Text>
              <View style={[styles.statIconBadge, { backgroundColor: '#0284C7' }]}>
                <Ionicons name="calendar" size={17} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.statCountRow}>
              <Text style={[styles.statCount, { color: '#0369A1' }]}>
                {String(totalDays).padStart(2, '0')}
              </Text>
              <Text style={[styles.statUnit, { color: '#0284C7' }]}>Total</Text>
            </View>
            <View style={[styles.statFooter, { borderTopColor: '#E0F2FE' }]}>
              <Text style={[styles.statRatioText, { color: '#0369A1' }]}>Semester 2</Text>
              <Text style={[styles.statStatusTag, { color: '#0284C7' }]}>Active</Text>
            </View>
          </View>
        </View>

        {/* 3. RECENT DAILY MARKINGS TIMELINE */}
        <View style={styles.timelineCard}>
          <View style={styles.timelineHeader}>
            <View style={styles.timelineHeaderLeft}>
              <View style={styles.timelineIconContainer}>
                <Ionicons name="time" size={18} color="#4338CA" />
              </View>
              <View>
                <Text style={styles.timelineTitle}>Recent Daily Markings</Text>
                <Text style={styles.timelineSubtitle}>Live RFID & classroom roll records</Text>
              </View>
            </View>

            {onViewAllHistory && (
              <TouchableOpacity
                onPress={onViewAllHistory}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="View full attendance log"
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Records List or Empty State */}
          {records.length > 0 ? (
            <View style={styles.timelineList}>
              {records.slice(0, 5).map((rec, idx) => {
                const isPresent = rec.status === 'present';
                const isLate = rec.status === 'late';
                const { dayOfWeek, dayNum } = parseDateBlock(rec.date);

                const statusBg = isPresent ? '#ECFDF5' : isLate ? '#FFFBEB' : '#FFF1F2';
                const statusBorder = isPresent ? '#A7F3D0' : isLate ? '#FDE68A' : '#FECDD3';
                const iconBg = isPresent ? '#059669' : isLate ? '#D97706' : '#E11D48';
                const iconName = isPresent ? 'checkmark' : isLate ? 'time' : 'close';

                const statusLabel = isPresent
                  ? 'Present (On Time)'
                  : isLate
                    ? 'Late Entry'
                    : 'Absent';
                const badgeText = isPresent
                  ? idx === 0
                    ? 'TODAY'
                    : 'PRESENT'
                  : isLate
                    ? '10 MIN'
                    : 'ABSENT';
                const badgeBg = isPresent ? '#D1FAE5' : isLate ? '#FEF3C7' : '#FFE4E6';
                const badgeColor = isPresent ? '#065F46' : isLate ? '#92400E' : '#9F1239';

                return (
                  <View
                    key={idx}
                    style={[
                      styles.timelineItem,
                      { backgroundColor: statusBg, borderColor: statusBorder },
                    ]}
                  >
                    <View style={styles.timelineItemLeft}>
                      {/* Date Square */}
                      <View style={styles.dateSquare}>
                        <Text style={styles.dateSquareDay}>{dayOfWeek}</Text>
                        <Text style={styles.dateSquareNum}>{dayNum}</Text>
                      </View>

                      {/* Content */}
                      <View style={styles.timelineItemContent}>
                        <View style={styles.timelineTitleRow}>
                          <Text style={styles.timelineStatusTitle}>{statusLabel}</Text>
                          <View style={[styles.timelineStatusPill, { backgroundColor: badgeBg }]}>
                            <Text style={[styles.timelineStatusPillText, { color: badgeColor }]}>
                              {badgeText}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.timelineMetaText} numberOfLines={1}>
                          {rec.remarks ||
                            (isPresent
                              ? 'In: 08:15 AM • Class Teacher Roll Call'
                              : 'Attendance log recorded')}
                        </Text>
                      </View>
                    </View>

                    {/* Right Check / Cross Badge */}
                    <View style={[styles.timelineStatusCheck, { backgroundColor: iconBg }]}>
                      <Ionicons name={iconName} size={15} color="#FFFFFF" />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="calendar-outline" size={32} color="#4338CA" />
              </View>
              <Text style={styles.emptyTitle}>No Attendance Records Yet</Text>
              <Text style={styles.emptySubtitle}>
                Daily attendance information will appear here once recorded by the school RFID gates
                or class teachers.
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  },
);

AttendanceOverviewSection.displayName = 'AttendanceOverviewSection';

const styles = StyleSheet.create({
  sectionWrapper: {
    gap: 16,
  },
  heroCard: {
    borderRadius: 24,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...DESIGN_TOKENS.shadows.floating,
  },
  heroGlowRight: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(124, 58, 237, 0.35)',
  },
  heroGlowLeft: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(14, 165, 233, 0.25)',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heroOverline: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#C7D2FE',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroTermText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E0E7FF',
    marginTop: 2,
  },
  heroDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  heroDetailsButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chartAndMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  ringWrapper: {
    width: 116,
    height: 116,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenterTextWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercentText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  ringStatusText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#6EE7B7',
    letterSpacing: 0.6,
    marginTop: 1,
  },
  ringSubtext: {
    fontSize: 9,
    color: '#C7D2FE',
  },
  ratiosColumn: {
    flex: 1,
    gap: 8,
  },
  ratioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  ratioLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratioIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ratioLabelText: {
    fontSize: 11.5,
    color: '#E0E7FF',
    fontWeight: '600',
  },
  ratioValueText: {
    fontSize: 12,
    fontWeight: '800',
  },
  honorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 4,
    marginTop: 2,
  },
  honorsText: {
    fontSize: 11,
    color: '#C7D2FE',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  statIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statCount: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statUnit: {
    fontSize: 11,
    fontWeight: '600',
  },
  statFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statRatioText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  statStatusTag: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  timelineHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(67, 56, 202, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
  },
  timelineSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  viewAllText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.protoIndigo,
  },
  timelineList: {
    gap: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
  },
  timelineItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  dateSquare: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateSquareDay: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },
  dateSquareNum: {
    fontSize: 14,
    fontWeight: '900',
    color: DESIGN_TOKENS.colors.deepNavy,
    lineHeight: 16,
  },
  timelineItemContent: {
    flex: 1,
    minWidth: 0,
  },
  timelineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timelineStatusTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
  },
  timelineStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  timelineStatusPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  timelineMetaText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  timelineStatusCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    ...DESIGN_TOKENS.shadows.subtle,
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
