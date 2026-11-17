import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GradientSurface } from '../ui/atoms/GradientSurface';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';
import { ROUTES } from '../../constants/routes';

export interface ParentHomeHeaderProps {
  parentName: string;
  unreadCount?: number;
  avatarUrl?: string | null;
  schoolName?: string;
  termInfo?: string;
  topInset?: number;
}

export const ParentHomeHeader: React.FC<ParentHomeHeaderProps> = React.memo(
  ({
    parentName,
    unreadCount = 0,
    avatarUrl,
    schoolName = 'EduTrack International',
    termInfo = 'Academic Session 2026–27',
    topInset = 44,
  }) => {
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [imageError, setImageError] = React.useState(false);

    useEffect(() => {
      setImageError(false);
    }, [avatarUrl]);

    useEffect(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }, [fadeAnim]);

    // Greeting based on wall-clock time
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const initial = (parentName.charAt(0) || 'P').toUpperCase();

    return (
      <View style={styles.headerWrapper}>
        <GradientSurface
          colors={DESIGN_TOKENS.colors.gradients.headerNav}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.2, y: 1 }}
          style={[styles.gradientHeader, { paddingTop: topInset + 8 }]}
        >
          {/* Decorative Glow Orbs */}
          <View style={styles.glowOrbRight} />
          <View style={styles.glowOrbLeft} />

          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Top Branding Bar */}
            <View style={styles.brandingRow}>
              <View style={styles.brandingLeft}>
                <View style={styles.schoolIconContainer}>
                  <Ionicons name="school" size={22} color="#FFFFFF" />
                </View>
                <View style={styles.schoolTextColumn}>
                  <View style={styles.portalTitleRow}>
                    <Text style={styles.portalName}>EduTrack</Text>
                    <View style={styles.portalTagPill}>
                      <Text style={styles.portalTagText}>FAMILY</Text>
                    </View>
                  </View>
                  <Text style={styles.schoolNameText} numberOfLines={1}>
                    {schoolName}
                  </Text>
                </View>
              </View>

              {/* Action Buttons: Notifications & Profile Avatar */}
              <View style={styles.brandingActions}>
                <TouchableOpacity
                  onPress={() => router.push(ROUTES.COMMON.NOTIFICATIONS as any)}
                  style={styles.notificationButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Notifications, ${unreadCount} unread`}
                  activeOpacity={0.8}
                >
                  <Ionicons name="notifications" size={20} color="#FFFFFF" />
                  {unreadCount > 0 && (
                    <View style={styles.notificationDotWrapper}>
                      <View style={styles.notificationDot} />
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push(ROUTES.MAIN.PROFILE as any)}
                  style={styles.avatarButton}
                  accessibilityRole="button"
                  accessibilityLabel="View parent profile"
                  activeOpacity={0.8}
                >
                  {avatarUrl && !imageError ? (
                    <Image
                      source={{ uri: avatarUrl }}
                      style={styles.avatarImage}
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <View style={styles.avatarInitialsContainer}>
                      <Text style={styles.avatarInitialsText}>{initial}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Personalized Greeting Section */}
            <View style={styles.greetingSection}>
              <View style={styles.termTagRow}>
                <Text style={styles.termTagText}>{termInfo}</Text>
              </View>
              <Text style={styles.greetingTitle}>
                {greeting}, {parentName} <Text style={styles.greetingEmoji}>👋</Text>
              </Text>
              <Text style={styles.greetingSubtitle}>
                Viewing student dashboard and daily activities for today.
              </Text>
            </View>
          </Animated.View>
        </GradientSurface>
      </View>
    );
  },
);

ParentHomeHeader.displayName = 'ParentHomeHeader';

const styles = StyleSheet.create({
  headerWrapper: {
    marginHorizontal: -DESIGN_TOKENS.spacing.comfortable,
    marginTop: -8,
    marginBottom: 0,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    ...DESIGN_TOKENS.shadows.floating,
  },
  gradientHeader: {
    paddingHorizontal: 20,
    paddingBottom: 68, // Extra bottom padding for the floating child card overlap
    position: 'relative',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  glowOrbRight: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(124, 58, 237, 0.28)', // violet glow
  },
  glowOrbLeft: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(14, 165, 233, 0.2)', // sky blue glow
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  brandingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  schoolIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolTextColumn: {
    flex: 1,
  },
  portalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  portalName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  portalTagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  portalTagText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  schoolNameText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(224, 231, 255, 0.9)',
    marginTop: 1,
  },
  brandingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDotWrapper: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DESIGN_TOKENS.colors.rose,
    borderWidth: 1.5,
    borderColor: '#172554',
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitialsContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3730A3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  greetingSection: {
    marginTop: 6,
  },
  termTagRow: {
    marginBottom: 6,
  },
  termTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(199, 210, 254, 0.9)',
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  greetingEmoji: {
    fontSize: 24,
  },
  greetingSubtitle: {
    fontSize: 13.5,
    color: 'rgba(224, 231, 255, 0.85)',
    marginTop: 6,
    lineHeight: 18,
  },
});
