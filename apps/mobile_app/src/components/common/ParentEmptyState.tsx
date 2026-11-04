import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';
import { useTheme } from '../../theme';

export interface ParentEmptyStateProps {
  icon?: keyof typeof Feather.glyphMap;
  ionIcon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const ParentEmptyState: React.FC<ParentEmptyStateProps> = ({
  icon,
  ionIcon,
  title,
  description,
  actionText,
  onAction,
}) => {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1e293b' : DESIGN_TOKENS.colors.surface,
          borderColor: isDark ? '#334155' : DESIGN_TOKENS.colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isDark ? 'rgba(81, 70, 229, 0.2)' : DESIGN_TOKENS.colors.primaryLight,
            borderColor: isDark ? 'rgba(81, 70, 229, 0.4)' : '#C7D2FE',
          },
        ]}
      >
        {ionIcon ? (
          <Ionicons
            name={ionIcon}
            size={30}
            color={isDark ? '#818CF8' : DESIGN_TOKENS.colors.primary}
          />
        ) : (
          <Feather
            name={icon || 'inbox'}
            size={28}
            color={isDark ? '#818CF8' : DESIGN_TOKENS.colors.primary}
          />
        )}
      </View>

      <Text
        style={[styles.title, { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary }]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.description,
          { color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary },
        ]}
      >
        {description}
      </Text>

      {actionText && onAction && (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.85}
          style={styles.actionButton}
          accessibilityRole="button"
          accessibilityLabel={actionText}
        >
          <Text style={styles.actionButtonText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 28,
    borderRadius: DESIGN_TOKENS.radius.featureCard,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    shadowColor: DESIGN_TOKENS.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: DESIGN_TOKENS.colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: DESIGN_TOKENS.radius.button,
    shadowColor: DESIGN_TOKENS.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
