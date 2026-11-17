import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ROUTES } from '../../constants/routes';
import { useAcademicsStore, AcademicsTab } from '../../stores/academics.store';
import { useFinanceStore } from '../../stores/finance.store';
import { useChildStore } from '../../stores/child.store';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';

export interface QuickActionItem {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgColor: string;
  route: string;
  academicsTab?: AcademicsTab;
  hasPipBadge?: boolean;
  pipColor?: string;
  badgeTextColor?: string;
}

export const QuickActionGrid: React.FC = React.memo(() => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const setActiveTab = useAcademicsStore((s) => s.setActiveTab);
  const homework = useAcademicsStore((s) => s.homework);
  const attendance = useAcademicsStore((s) => s.attendance);
  const reportCard = useAcademicsStore((s) => s.reportCard);
  const ledger = useFinanceStore((s) => s.ledger);
  const activeChild = useChildStore((s) => s.getSelectedChild());

  const pendingHomeworkCount = homework.filter((h) => h.status === 'pending').length;
  const hasAttendance = attendance?.percentage !== undefined && attendance?.percentage !== null;
  const attendanceSubtitle = hasAttendance ? `${attendance.percentage}% Present` : 'Records';

  const rawBalance =
    activeChild?.kind === 'enrolled' && activeChild.pendingFeeAmount !== undefined
      ? activeChild.pendingFeeAmount
      : ledger?.summary?.outstanding_balance;

  const feeSubtitle =
    rawBalance !== undefined
      ? rawBalance > 0
        ? `₹${rawBalance.toLocaleString()} Due`
        : 'All Cleared'
      : 'Fee Portal';

  const reportSubtitle = reportCard?.overallGrade
    ? `Grade ${reportCard.overallGrade}`
    : 'Exams & Marks';

  const actions: QuickActionItem[] = [
    {
      id: 'attendance',
      title: 'Attendance',
      subtitle: attendanceSubtitle,
      icon: 'checkbox-outline',
      iconColor: DESIGN_TOKENS.colors.emerald,
      bgColor: 'rgba(5, 150, 105, 0.1)',
      route: ROUTES.MAIN.ACADEMICS,
      academicsTab: 'attendance',
    },
    {
      id: 'timetable',
      title: 'Timetable',
      subtitle: 'Weekly Plan',
      icon: 'calendar-outline',
      iconColor: DESIGN_TOKENS.colors.royalIndigo,
      bgColor: 'rgba(67, 56, 202, 0.1)',
      route: ROUTES.MAIN.ACADEMICS,
      academicsTab: 'timetable',
    },
    {
      id: 'homework',
      title: 'Homework',
      subtitle: pendingHomeworkCount > 0 ? `${pendingHomeworkCount} Pending` : 'All Done',
      icon: 'document-text-outline',
      iconColor: DESIGN_TOKENS.colors.electricViolet,
      bgColor: 'rgba(124, 58, 237, 0.1)',
      route: ROUTES.MAIN.ACADEMICS,
      academicsTab: 'homework',
      hasPipBadge: pendingHomeworkCount > 0,
      pipColor: DESIGN_TOKENS.colors.rose,
      badgeTextColor: pendingHomeworkCount > 0 ? DESIGN_TOKENS.colors.rose : undefined,
    },
    {
      id: 'fees',
      title: 'Pay Fees',
      subtitle: feeSubtitle,
      icon: 'wallet-outline',
      iconColor: DESIGN_TOKENS.colors.amber,
      bgColor: 'rgba(217, 119, 6, 0.1)',
      route: ROUTES.MAIN.FINANCE,
      badgeTextColor:
        rawBalance !== undefined && rawBalance > 0
          ? DESIGN_TOKENS.colors.amber
          : DESIGN_TOKENS.colors.emerald,
    },
    {
      id: 'report_card',
      title: 'Report Card',
      subtitle: reportSubtitle,
      icon: 'ribbon-outline',
      iconColor: DESIGN_TOKENS.colors.skyBlue,
      bgColor: 'rgba(14, 165, 233, 0.1)',
      route: ROUTES.MAIN.ACADEMICS,
      academicsTab: 'exams',
    },
    {
      id: 'helpdesk',
      title: 'Helpdesk',
      subtitle: '24/7 Support',
      icon: 'headset-outline',
      iconColor: DESIGN_TOKENS.colors.rose,
      bgColor: 'rgba(225, 29, 72, 0.1)',
      route: ROUTES.MAIN.HELPDESK,
    },
  ];

  const handleActionPress = (act: QuickActionItem) => {
    if (act.academicsTab) {
      setActiveTab(act.academicsTab);
    }
    router.push(act.route as any);
  };

  const columns = width < 340 ? 2 : 3;
  const gap = 10;
  const itemWidth = `${100 / columns - 2.5}%` as any;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Text style={styles.sectionSubtitle}>Core Services</Text>
      </View>

      <View style={styles.gridContainer}>
        {actions.map((act) => (
          <TouchableOpacity
            key={act.id}
            activeOpacity={0.8}
            onPress={() => handleActionPress(act)}
            style={[styles.tileCard, { width: itemWidth }]}
            accessibilityRole="button"
            accessibilityLabel={`${act.title}: ${act.subtitle}`}
          >
            {act.hasPipBadge && (
              <View
                style={[
                  styles.pipDot,
                  { backgroundColor: act.pipColor || DESIGN_TOKENS.colors.rose },
                ]}
              />
            )}

            <View style={[styles.iconContainer, { backgroundColor: act.bgColor }]}>
              <Ionicons name={act.icon} size={24} color={act.iconColor} />
            </View>

            <Text style={styles.tileTitle} numberOfLines={1}>
              {act.title}
            </Text>
            <Text
              style={[
                styles.tileSubtitle,
                act.badgeTextColor ? { color: act.badgeTextColor, fontWeight: '700' } : null,
              ]}
              numberOfLines={1}
            >
              {act.subtitle}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

QuickActionGrid.displayName = 'QuickActionGrid';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: DESIGN_TOKENS.colors.textSecondary,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  tileCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 104,
    position: 'relative',
    ...DESIGN_TOKENS.shadows.subtle,
  },
  pipDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tileTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
    textAlign: 'center',
    marginBottom: 2,
  },
  tileSubtitle: {
    fontSize: 10,
    color: DESIGN_TOKENS.colors.textSecondary,
    textAlign: 'center',
  },
});
