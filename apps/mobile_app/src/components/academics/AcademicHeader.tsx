import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GradientSurface } from '../ui/atoms/GradientSurface';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';
import { ROUTES } from '../../constants/routes';

export interface AcademicHeaderProps {
  onBackPress?: () => void;
  onTermPress?: () => void;
  termName?: string;
  overallRate?: number | null;
  unreadCount?: number;
  topInset?: number;
}

export const AcademicHeader: React.FC<AcademicHeaderProps> = React.memo(
  ({
    onBackPress,
    onTermPress,
    termName = 'Sem 2',
    overallRate,
    unreadCount = 0,
    topInset = 44,
  }) => {
    const router = useRouter();

    const handleBack = () => {
      if (onBackPress) {
        onBackPress();
      } else if (router.canGoBack()) {
        router.back();
      } else {
        router.push(ROUTES.MAIN.HOME as any);
      }
    };

    const handleNotifications = () => {
      router.push(ROUTES.COMMON.NOTIFICATIONS as any);
    };

    return (
      <View style={styles.headerWrapper}>
        <GradientSurface
          colors={DESIGN_TOKENS.colors.gradients.headerNav}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.2, y: 1 }}
          style={[styles.gradientHeader, { paddingTop: topInset + 6 }]}
        >
          {/* Ambient Glow Lights */}
          <View style={styles.glowOrbRight} />
          <View style={styles.glowOrbLeft} />

          {/* Top Utility / Branding Bar */}
          <View style={styles.topBar}>
            <View style={styles.titleGroup}>
              {/* Back Navigation Button */}
              <TouchableOpacity
                onPress={handleBack}
                activeOpacity={0.8}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel="Navigate back"
              >
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Header Title Column */}
              <View style={styles.titleColumn}>
                <Text style={styles.categoryLabel}>STUDENT ACADEMICS</Text>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  Academics & Schedule
                </Text>
              </View>
            </View>

            {/* Right Action Buttons */}
            <View style={styles.rightActions}>
              {/* Term / Semester Switcher Pill */}
              <TouchableOpacity
                onPress={onTermPress}
                activeOpacity={0.8}
                style={styles.termPill}
                accessibilityRole="button"
                accessibilityLabel={`Active term: ${termName}`}
              >
                <Ionicons name="options-outline" size={13} color="#FFFFFF" />
                <Text style={styles.termPillText}>{termName}</Text>
              </TouchableOpacity>

              {/* Notification Bell Button */}
              <TouchableOpacity
                onPress={handleNotifications}
                activeOpacity={0.8}
                style={styles.notificationButton}
                accessibilityRole="button"
                accessibilityLabel="View notifications"
              >
                <Ionicons name="notifications" size={18} color="#FFFFFF" />
                {unreadCount > 0 && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Subtitle & Quick Metric Row */}
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitleText} numberOfLines={1}>
              Track attendance, timetable, homework & tests
            </Text>
            {overallRate !== null && overallRate !== undefined && overallRate > 0 ? (
              <View style={styles.overallRatePill}>
                <View style={styles.overallRateDot} />
                <Text style={styles.overallRateText}>{overallRate}% Overall</Text>
              </View>
            ) : null}
          </View>
        </GradientSurface>
      </View>
    );
  },
);

AcademicHeader.displayName = 'AcademicHeader';

const styles = StyleSheet.create({
  headerWrapper: {
    marginHorizontal: -DESIGN_TOKENS.spacing.comfortable,
    marginTop: -8,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    ...DESIGN_TOKENS.shadows.floating,
  },
  gradientHeader: {
    paddingHorizontal: 16,
    paddingBottom: 48, // Seamless overlap space for the child card
    position: 'relative',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  glowOrbRight: {
    position: 'absolute',
    top: -24,
    right: -24,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(124, 58, 237, 0.28)', // violet glow
  },
  glowOrbLeft: {
    position: 'absolute',
    bottom: -10,
    left: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(14, 165, 233, 0.2)', // sky blue glow
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleColumn: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#C7D2FE',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginTop: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  termPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 16,
  },
  termPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  notificationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DESIGN_TOKENS.colors.emerald,
    borderWidth: 1.5,
    borderColor: '#172554',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    gap: 8,
  },
  subtitleText: {
    fontSize: 12,
    color: 'rgba(224, 231, 255, 0.9)',
    flex: 1,
  },
  overallRatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(5, 150, 105, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
  },
  overallRateDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#34D399',
  },
  overallRateText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6EE7B7',
    letterSpacing: 0.2,
  },
});
