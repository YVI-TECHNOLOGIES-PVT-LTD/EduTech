import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradientSurface } from '../ui/atoms/GradientSurface';
import { AcademicsTab } from '../../stores/academics.store';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';

export interface AcademicTabsProps {
  activeTab: AcademicsTab;
  onSelectTab: (tab: AcademicsTab) => void;
  pendingHomeworkCount?: number;
}

interface TabDef {
  key: AcademicsTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  inactiveIconColor: string;
}

const TABS: TabDef[] = [
  {
    key: 'attendance',
    label: 'Attendance',
    icon: 'checkbox-outline',
    inactiveIconColor: '#4338CA',
  },
  {
    key: 'timetable',
    label: 'Timetable',
    icon: 'time-outline',
    inactiveIconColor: '#4338CA',
  },
  {
    key: 'homework',
    label: 'Homework',
    icon: 'book-outline',
    inactiveIconColor: '#7C3AED',
  },
  {
    key: 'exams',
    label: 'Exams',
    icon: 'ribbon-outline',
    inactiveIconColor: '#D97706',
  },
];

export const AcademicTabs: React.FC<AcademicTabsProps> = React.memo(
  ({ activeTab, onSelectTab, pendingHomeworkCount = 0 }) => {
    return (
      <View style={styles.container}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const showHomeworkDot = tab.key === 'homework' && pendingHomeworkCount > 0;

          if (isActive) {
            return (
              <GradientSurface
                key={tab.key}
                colors={['#4338CA', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                borderRadius={14}
                style={styles.activeTabGradient}
              >
                <TouchableOpacity
                  onPress={() => onSelectTab(tab.key)}
                  activeOpacity={0.85}
                  style={styles.tabInnerButton}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: true }}
                  accessibilityLabel={`${tab.label} tab, active`}
                >
                  <Ionicons name={tab.icon} size={15} color="#FFFFFF" style={styles.tabIcon} />
                  <Text style={styles.activeTabText} numberOfLines={1}>
                    {tab.label}
                  </Text>
                  {showHomeworkDot && <View style={styles.badgeDot} />}
                </TouchableOpacity>
              </GradientSurface>
            );
          }

          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onSelectTab(tab.key)}
              activeOpacity={0.7}
              style={styles.inactiveTabButton}
              accessibilityRole="tab"
              accessibilityState={{ selected: false }}
              accessibilityLabel={`${tab.label} tab`}
            >
              <Ionicons
                name={tab.icon}
                size={15}
                color={tab.inactiveIconColor}
                style={styles.tabIcon}
              />
              <Text style={styles.inactiveTabText} numberOfLines={1}>
                {tab.label}
              </Text>
              {showHomeworkDot && <View style={styles.badgeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  },
);

AcademicTabs.displayName = 'AcademicTabs';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 4,
    marginBottom: 16,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  activeTabGradient: {
    flex: 1,
    borderRadius: 14,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  tabInnerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 6,
    position: 'relative',
  },
  inactiveTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 14,
    position: 'relative',
  },
  tabIcon: {
    marginRight: 4,
  },
  activeTabText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  inactiveTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    letterSpacing: -0.2,
  },
  badgeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DESIGN_TOKENS.colors.rose,
  },
});
