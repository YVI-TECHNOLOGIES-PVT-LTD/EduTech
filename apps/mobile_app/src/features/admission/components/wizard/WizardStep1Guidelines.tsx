import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { DESIGN_TOKENS } from '../../../../theme/tokens/designTokens';
import { useTheme } from '../../../../theme';

export interface WizardStep1GuidelinesProps {
  accepted: boolean;
  onToggleAccept: (accepted: boolean) => void;
}

export const WizardStep1Guidelines: React.FC<WizardStep1GuidelinesProps> = ({
  accepted,
  onToggleAccept,
}) => {
  const { isDark } = useTheme();

  return (
    <View style={styles.container}>
      {/* Introduction Card */}
      <View
        style={[
          styles.introCard,
          {
            backgroundColor: isDark ? 'rgba(81, 70, 229, 0.15)' : DESIGN_TOKENS.colors.primaryLight,
            borderColor: isDark ? 'rgba(81, 70, 229, 0.35)' : '#C7D2FE',
          },
        ]}
      >
        <View style={styles.introHeaderRow}>
          <View style={[styles.introIconBadge, { backgroundColor: DESIGN_TOKENS.colors.primary }]}>
            <Feather name="info" size={16} color="#FFFFFF" />
          </View>
          <Text style={[styles.introTitle, { color: isDark ? '#E0E7FF' : '#312E81' }]}>
            Admission Instructions
          </Text>
        </View>
        <Text style={[styles.introText, { color: isDark ? '#C7D2FE' : '#4338CA' }]}>
          Please review the admission policies and requirements before filling out the form. You can
          save your progress as a draft and resume anytime.
        </Text>
      </View>

      {/* Guidelines List Card */}
      <View
        style={[
          styles.guidelinesCard,
          {
            backgroundColor: isDark ? '#1E293B' : DESIGN_TOKENS.colors.surface,
            borderColor: isDark ? '#334155' : DESIGN_TOKENS.colors.border,
          },
        ]}
      >
        {/* Guideline 1 */}
        <View style={styles.guidelineRow}>
          <View style={styles.checkIconWrapper}>
            <Feather name="check-circle" size={18} color={DESIGN_TOKENS.colors.primary} />
          </View>
          <View style={styles.guidelineContent}>
            <Text
              style={[
                styles.guidelineHeading,
                { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
              ]}
            >
              Accurate Personal Information
            </Text>
            <Text
              style={[
                styles.guidelineBody,
                { color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary },
              ]}
            >
              Ensure student details match official government documents (e.g. Birth Certificate,
              Aadhaar, or Passport).
            </Text>
          </View>
        </View>

        {/* Guideline 2 */}
        <View style={styles.guidelineRow}>
          <View style={styles.checkIconWrapper}>
            <Feather name="check-circle" size={18} color={DESIGN_TOKENS.colors.primary} />
          </View>
          <View style={styles.guidelineContent}>
            <Text
              style={[
                styles.guidelineHeading,
                { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
              ]}
            >
              Mandatory Document Uploads
            </Text>
            <Text
              style={[
                styles.guidelineBody,
                { color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary },
              ]}
            >
              Prepare scanned PDFs or clear photos of Birth Certificate, Report Cards, and Photos
              (under 10MB each).
            </Text>
          </View>
        </View>

        {/* Guideline 3 */}
        <View style={styles.guidelineRowLast}>
          <View style={styles.checkIconWrapper}>
            <Feather name="check-circle" size={18} color={DESIGN_TOKENS.colors.primary} />
          </View>
          <View style={styles.guidelineContent}>
            <Text
              style={[
                styles.guidelineHeading,
                { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
              ]}
            >
              Processing & Verification
            </Text>
            <Text
              style={[
                styles.guidelineBody,
                { color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary },
              ]}
            >
              Upon submission, the admission desk will review your credentials and schedule entrance
              evaluation if applicable.
            </Text>
          </View>
        </View>
      </View>

      {/* Acceptance Checkbox */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onToggleAccept(!accepted)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepted }}
        accessibilityLabel="Accept admission guidelines and instructions"
        style={[
          styles.checkboxContainer,
          {
            backgroundColor: accepted
              ? isDark
                ? 'rgba(81, 70, 229, 0.15)'
                : 'rgba(81, 70, 229, 0.06)'
              : isDark
                ? '#1E293B'
                : DESIGN_TOKENS.colors.surface,
            borderColor: accepted
              ? DESIGN_TOKENS.colors.primary
              : isDark
                ? '#334155'
                : DESIGN_TOKENS.colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.checkboxBox,
            {
              backgroundColor: accepted ? DESIGN_TOKENS.colors.primary : 'transparent',
              borderColor: accepted ? DESIGN_TOKENS.colors.primary : isDark ? '#64748B' : '#CBD5E1',
            },
          ]}
        >
          {accepted && <Feather name="check" size={14} color="#FFFFFF" />}
        </View>
        <Text
          style={[
            styles.checkboxLabel,
            { color: isDark ? '#E2E8F0' : DESIGN_TOKENS.colors.textPrimary },
          ]}
        >
          I have read, understood, and accept the admission guidelines and instructions.
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  introCard: {
    padding: 18,
    borderRadius: DESIGN_TOKENS.radius.card,
    borderWidth: 1,
  },
  introHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  introIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  introTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  introText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  guidelinesCard: {
    padding: 20,
    borderRadius: DESIGN_TOKENS.radius.card,
    borderWidth: 1,
    shadowColor: DESIGN_TOKENS.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  guidelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  guidelineRowLast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkIconWrapper: {
    marginTop: 2,
    marginRight: 12,
  },
  guidelineContent: {
    flex: 1,
  },
  guidelineHeading: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  guidelineBody: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: DESIGN_TOKENS.radius.card,
    borderWidth: 1.5,
    minHeight: 56,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxLabel: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    lineHeight: 18,
  },
});
