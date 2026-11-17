import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, StyleProp } from 'react-native';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';

export interface PremiumCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  activeOpacity?: number;
  variant?: 'elevated' | 'flat' | 'gradientBorder' | 'glass';
  borderRadius?: number;
  padding?: number;
  accessibilityRole?: 'button' | 'summary' | 'none';
  accessibilityLabel?: string;
  testID?: string;
}

export const PremiumCard: React.FC<PremiumCardProps> = React.memo(
  ({
    children,
    style,
    onPress,
    activeOpacity = 0.85,
    variant = 'elevated',
    borderRadius = DESIGN_TOKENS.radius.card,
    padding = DESIGN_TOKENS.spacing.standard,
    accessibilityRole,
    accessibilityLabel,
    testID,
  }) => {
    const cardStyles: StyleProp<ViewStyle>[] = [
      styles.base,
      {
        borderRadius,
        padding,
      },
      variant === 'elevated' && styles.elevated,
      variant === 'flat' && styles.flat,
      variant === 'glass' && styles.glass,
      style,
    ];

    if (onPress) {
      return (
        <TouchableOpacity
          testID={testID}
          onPress={onPress}
          activeOpacity={activeOpacity}
          style={cardStyles}
          accessibilityRole={accessibilityRole || 'button'}
          accessibilityLabel={accessibilityLabel}
        >
          {children}
        </TouchableOpacity>
      );
    }

    return (
      <View
        testID={testID}
        style={cardStyles}
        accessibilityRole={accessibilityRole || 'none'}
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </View>
    );
  },
);

PremiumCard.displayName = 'PremiumCard';

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    position: 'relative',
  },
  elevated: {
    ...DESIGN_TOKENS.shadows.subtle,
  },
  flat: {
    elevation: 0,
    shadowOpacity: 0,
    backgroundColor: '#FFFFFF',
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: 'rgba(226, 232, 240, 0.8)',
    ...DESIGN_TOKENS.shadows.subtle,
  },
});
