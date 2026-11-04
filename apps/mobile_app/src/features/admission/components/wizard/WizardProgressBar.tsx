import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DESIGN_TOKENS } from '../../../../theme/tokens/designTokens';
import { useTheme } from '../../../../theme';

export interface WizardProgressBarProps {
  currentStep: number;
  totalSteps?: number;
}

const STEP_TITLES = [
  'Admission Guidelines',
  'Student Details',
  'Parent Details',
  'Academic Preferences',
  'Document Uploads',
  'Fee Statement',
  'Review & Declaration',
  'Confirmation',
];

export const WizardProgressBar: React.FC<WizardProgressBarProps> = ({
  currentStep,
  totalSteps = 8,
}) => {
  const { isDark } = useTheme();
  const progressPercent = Math.min(Math.round((currentStep / totalSteps) * 100), 100);
  const currentTitle = STEP_TITLES[currentStep - 1] || `Step ${currentStep}`;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#0F172A' : DESIGN_TOKENS.colors.surface,
          borderBottomColor: isDark ? '#1E293B' : DESIGN_TOKENS.colors.border,
        },
      ]}
    >
      {/* Step Info Row */}
      <View style={styles.infoRow}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>
            Step {currentStep} of {totalSteps}
          </Text>
        </View>
        <Text
          style={[
            styles.titleText,
            { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
          ]}
        >
          {currentTitle}
        </Text>
        <Text style={styles.percentText}>{progressPercent}%</Text>
      </View>

      {/* Progress Track */}
      <View style={[styles.track, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${progressPercent}%`,
              backgroundColor: DESIGN_TOKENS.colors.primary,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepBadge: {
    backgroundColor: DESIGN_TOKENS.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    marginLeft: 10,
    marginRight: 10,
  },
  percentText: {
    fontSize: 11,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.primary,
  },
  track: {
    height: 6,
    width: '100%',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 9999,
  },
});
