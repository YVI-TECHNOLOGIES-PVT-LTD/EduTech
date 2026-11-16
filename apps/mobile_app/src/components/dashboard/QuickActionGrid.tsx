import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ROUTES } from '../../constants/routes';
import { useAcademicsStore, AcademicsTab } from '../../stores/academics.store';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';

export interface QuickActionItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgColor: string;
  route: string;
  academicsTab?: AcademicsTab;
}

export const QuickActionGrid: React.FC = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const setActiveTab = useAcademicsStore((s) => s.setActiveTab);

  const actions: QuickActionItem[] = [
    {
      id: 'attendance',
      title: 'Attendance',
      icon: 'calendar-outline',
      iconColor: '#059669',
      bgColor: '#DCFCE7',
      route: ROUTES.MAIN.ACADEMICS,
      academicsTab: 'attendance',
    },
    {
      id: 'timetable',
      title: 'Timetable',
      icon: 'time-outline',
      iconColor: '#0284C7',
      bgColor: '#E0F2FE',
      route: ROUTES.MAIN.ACADEMICS,
      academicsTab: 'timetable',
    },
    {
      id: 'homework',
      title: 'Homework',
      icon: 'book-outline',
      iconColor: '#9333EA',
      bgColor: '#F3E8FF',
      route: ROUTES.MAIN.ACADEMICS,
      academicsTab: 'homework',
    },
    {
      id: 'fees',
      title: 'Pay Fees',
      icon: 'card-outline',
      iconColor: '#D97706',
      bgColor: '#FEF3C7',
      route: ROUTES.MAIN.FINANCE,
    },
    {
      id: 'report_card',
      title: 'Report Card',
      icon: 'ribbon-outline',
      iconColor: '#5145E5',
      bgColor: '#EEF0FF',
      route: ROUTES.MAIN.ACADEMICS,
      academicsTab: 'exams',
    },
    {
      id: 'helpdesk',
      title: 'Helpdesk',
      icon: 'chatbubbles-outline',
      iconColor: '#E11D48',
      bgColor: '#FFE4E6',
      route: ROUTES.MAIN.HELPDESK,
    },
  ];

  const handleActionPress = (act: QuickActionItem) => {
    if (act.academicsTab) {
      setActiveTab(act.academicsTab);
    }
    router.push(act.route as any);
  };

  // Compute item width for 3 columns on width >= 360, or 2 columns on very narrow screens (width < 340)
  const columns = width < 340 ? 2 : 3;
  const gap = 10;
  // Available width minus screen padding (40px) and gaps
  const itemWidth = `${100 / columns - 2.5}%` as any;

  return (
    <View style={{ marginBottom: DESIGN_TOKENS.spacing.standard }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          color: DESIGN_TOKENS.colors.textSecondary,
          marginBottom: 10,
          paddingHorizontal: 2,
        }}
      >
        Quick Actions
      </Text>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: gap,
          justifyContent: 'space-between',
        }}
      >
        {actions.map((act) => (
          <TouchableOpacity
            key={act.id}
            activeOpacity={0.75}
            onPress={() => handleActionPress(act)}
            style={{
              width: itemWidth,
              backgroundColor: DESIGN_TOKENS.colors.surface,
              borderColor: DESIGN_TOKENS.colors.border,
              borderWidth: 1,
              borderRadius: DESIGN_TOKENS.radius.card,
              paddingVertical: 14,
              paddingHorizontal: 6,
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 88,
              ...DESIGN_TOKENS.shadows.subtle,
            }}
            accessibilityRole="button"
            accessibilityLabel={act.title}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: act.bgColor,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              <Ionicons name={act.icon} size={22} color={act.iconColor} />
            </View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: DESIGN_TOKENS.colors.textPrimary,
                textAlign: 'center',
              }}
              numberOfLines={1}
            >
              {act.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
