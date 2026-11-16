import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';
import { useTheme } from '../../theme';

export interface ParentPortalHeaderProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  bordered?: boolean;
}

export const ParentPortalHeader: React.FC<ParentPortalHeaderProps> = ({
  title,
  subtitle,
  showLogo = false,
  showBack = false,
  onBack,
  rightAction,
  bordered = true,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  // Safe area top padding: ensure at least 8px padding or safe area on notches
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 12 : 16);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: topPadding,
          backgroundColor: isDark ? '#0f172a' : DESIGN_TOKENS.colors.surface,
          borderBottomColor: isDark ? '#1e293b' : DESIGN_TOKENS.colors.border,
          borderBottomWidth: bordered ? 1 : 0,
        },
      ]}
    >
      <View style={styles.contentRow}>
        {/* Left: Back Button or Branding */}
        <View style={styles.leftSection}>
          {showBack && (
            <TouchableOpacity
              onPress={handleBack}
              style={[
                styles.iconButton,
                {
                  backgroundColor: isDark ? '#1e293b' : '#F1F5F9',
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather
                name="arrow-left"
                size={20}
                color={isDark ? '#F1F5F9' : DESIGN_TOKENS.colors.textPrimary}
              />
            </TouchableOpacity>
          )}

          {showLogo ? (
            <View style={styles.brandRow}>
              <View style={styles.brandLogo}>
                <Ionicons name="school" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text
                  style={[
                    styles.brandTitle,
                    { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
                  ]}
                >
                  EduTrack ERP
                </Text>
                <Text style={styles.brandSubtitle}>Parent Portal</Text>
              </View>
            </View>
          ) : (
            <View style={styles.titleContainer}>
              {title && (
                <Text
                  numberOfLines={1}
                  style={[
                    styles.title,
                    { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
                  ]}
                >
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text numberOfLines={1} style={styles.subtitle}>
                  {subtitle}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Right Action */}
        {rightAction && <View style={styles.rightSection}>{rightAction}</View>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogo: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: DESIGN_TOKENS.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: DESIGN_TOKENS.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: DESIGN_TOKENS.colors.textMuted,
    marginTop: 2,
  },
});
