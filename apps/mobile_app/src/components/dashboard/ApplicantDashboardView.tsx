import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ApplicantChild } from '../../types/child.types';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';

export interface ApplicantDashboardViewProps {
  applicant: ApplicantChild;
}

export const ApplicantDashboardView: React.FC<ApplicantDashboardViewProps> = ({ applicant }) => {
  const router = useRouter();
  const appId = applicant.applicationId;

  const getStageDisplay = (stage: string) => {
    switch (stage) {
      case 'submitted':
        return {
          label: 'Application Submitted',
          bg: '#EEF0FF',
          text: DESIGN_TOKENS.colors.royalIndigo,
          border: '#C7D2FE',
        };
      case 'documents_pending':
        return { label: 'Documents Pending', bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' };
      case 'under_review':
        return { label: 'Under Review', bg: '#F0F9FF', text: '#0369A1', border: '#BAE6FD' };
      case 'assessment_scheduled':
        return { label: 'Assessment Scheduled', bg: '#EEF0FF', text: '#4338CA', border: '#C7D2FE' };
      case 'fee_pending':
        return { label: 'Fee Payment Pending', bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' };
      case 'decision_ready':
      case 'offer_accepted':
        return { label: 'Offer Issued', bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' };
      default:
        return {
          label: 'In Progress',
          bg: '#EEF0FF',
          text: DESIGN_TOKENS.colors.royalIndigo,
          border: '#C7D2FE',
        };
    }
  };

  const stageInfo = getStageDisplay(applicant.stage);

  return (
    <View style={styles.container}>
      {/* 1. Admission Progress Hero Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerIconCircle}>
              <Ionicons name="document-text" size={16} color={DESIGN_TOKENS.colors.royalIndigo} />
            </View>
            <Text style={styles.headerTitle}>Admission Progress</Text>
          </View>
          <View
            style={[
              styles.stageBadge,
              { backgroundColor: stageInfo.bg, borderColor: stageInfo.border },
            ]}
          >
            <Text style={[styles.stageBadgeText, { color: stageInfo.text }]}>
              {stageInfo.label}
            </Text>
          </View>
        </View>

        {/* Progress Bar & Percentage */}
        <View style={styles.progressSection}>
          <View style={styles.progressInfoRow}>
            <Text style={styles.appNumberText}>{applicant.applicationNumber}</Text>
            <Text style={styles.percentageText}>{applicant.progressPercentage}% Completed</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${applicant.progressPercentage}%` }]} />
          </View>
        </View>

        {applicant.actionRequiredNotice && (
          <View style={styles.noticeBox}>
            <Ionicons name="alert-circle" size={17} color="#D97706" />
            <Text style={styles.noticeText}>{applicant.actionRequiredNotice}</Text>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push(`/(parent)/applications/${appId}` as any)}
          style={styles.openHubButton}
          accessibilityRole="button"
          accessibilityLabel="Open Application Hub"
        >
          <Text style={styles.openHubButtonText}>Open Application Hub</Text>
          <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 2. Admission Quick Shortcuts */}
      <View style={styles.checklistHeaderRow}>
        <Text style={styles.checklistTitle}>Application Checklist</Text>
        <Text style={styles.checklistSubtitle}>Quick Actions</Text>
      </View>

      <View style={styles.shortcutsGrid}>
        <TouchableOpacity
          onPress={() => router.push(`/(parent)/applications/${appId}/documents` as any)}
          style={styles.shortcutCard}
          activeOpacity={0.8}
        >
          <View style={[styles.shortcutIconCircle, { backgroundColor: '#EEF0FF' }]}>
            <Ionicons
              name="folder-open-outline"
              size={18}
              color={DESIGN_TOKENS.colors.royalIndigo}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shortcutTitle}>Documents</Text>
            <Text style={styles.shortcutSub}>Upload certificates</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push(`/(parent)/applications/${appId}/timeline` as any)}
          style={styles.shortcutCard}
          activeOpacity={0.8}
        >
          <View style={[styles.shortcutIconCircle, { backgroundColor: '#F0F9FF' }]}>
            <Ionicons name="git-commit-outline" size={18} color="#0EA5E9" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shortcutTitle}>Timeline</Text>
            <Text style={styles.shortcutSub}>Track history</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push(`/(parent)/applications/${appId}/assessment` as any)}
          style={styles.shortcutCard}
          activeOpacity={0.8}
        >
          <View style={[styles.shortcutIconCircle, { backgroundColor: '#FAF5FF' }]}>
            <Ionicons name="school-outline" size={18} color="#7C3AED" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shortcutTitle}>Assessment</Text>
            <Text style={styles.shortcutSub}>Test & interview</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push(`/(parent)/applications/${appId}/fees` as any)}
          style={styles.shortcutCard}
          activeOpacity={0.8}
        >
          <View style={[styles.shortcutIconCircle, { backgroundColor: '#FFFBEB' }]}>
            <Ionicons name="card-outline" size={18} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shortcutTitle}>Fees</Text>
            <Text style={styles.shortcutSub}>Admission dues</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    ...DESIGN_TOKENS.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EEF0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  stageBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressInfoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  appNumberText: {
    fontSize: 14,
    fontWeight: '900',
    color: DESIGN_TOKENS.colors.deepNavy,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.royalIndigo,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: DESIGN_TOKENS.colors.royalIndigo,
    borderRadius: 4,
  },
  noticeBox: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  noticeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    flex: 1,
  },
  openHubButton: {
    backgroundColor: DESIGN_TOKENS.colors.royalIndigo,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  openHubButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  checklistHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  checklistTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
  },
  checklistSubtitle: {
    fontSize: 11,
    color: DESIGN_TOKENS.colors.textMuted,
    fontWeight: '600',
  },
  shortcutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  shortcutCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...DESIGN_TOKENS.shadows.subtle,
  },
  shortcutIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
  },
  shortcutSub: {
    fontSize: 10,
    color: DESIGN_TOKENS.colors.textMuted,
  },
});
