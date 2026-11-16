import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';
import { useTheme } from '../../theme';

export interface ScreenHeaderProps {
  tag?: string;
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  containerStyle?: object;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  tag,
  title,
  subtitle,
  rightAction,
  showBack = false,
  onBack,
  containerStyle,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  // Calculate guaranteed safe top padding across all Android & iOS devices
  const androidStatusHeight = StatusBar.currentHeight || 24;
  const topSafeInset =
    insets.top > 0 ? insets.top : Platform.OS === 'android' ? androidStatusHeight : 16;
  const safeTopPadding = topSafeInset + 8;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingTop: safeTopPadding,
          backgroundColor: isDark ? '#0F172A' : DESIGN_TOKENS.colors.background,
        },
        containerStyle,
      ]}
    >
      <View style={styles.headerRow}>
        {showBack && (
          <TouchableOpacity
            onPress={handleBack}
            style={[
              styles.backButton,
              {
                backgroundColor: isDark ? '#1E293B' : DESIGN_TOKENS.colors.surface,
                borderColor: isDark ? '#334155' : DESIGN_TOKENS.colors.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={18}
              color={isDark ? '#F1F5F9' : DESIGN_TOKENS.colors.textPrimary}
            />
          </TouchableOpacity>
        )}

        <View style={styles.titleContainer}>
          {tag ? (
            <Text
              style={[
                styles.headerTag,
                { color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textMuted },
              ]}
              numberOfLines={1}
            >
              {tag}
            </Text>
          ) : null}

          <Text
            style={[
              styles.headerTitle,
              { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>

          {subtitle ? (
            <Text
              style={[
                styles.headerSubtitle,
                { color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightAction ? <View style={styles.rightSection}>{rightAction}</View> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: DESIGN_TOKENS.spacing.comfortable,
    paddingBottom: DESIGN_TOKENS.spacing.standard,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTag: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
});
