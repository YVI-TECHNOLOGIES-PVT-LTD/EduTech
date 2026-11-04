import React from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { applicationsApi } from '../../../src/api/applications.api';
import { QUERY_KEYS } from '../../../src/api/query-keys';
import { getApplicationStatusConfig } from '../../../src/utils/status-mapper';
import { useTheme } from '../../../src/theme';
import { DESIGN_TOKENS } from '../../../src/theme/tokens/designTokens';
import { ParentPortalHeader } from '../../../src/components/common/ParentPortalHeader';
import { ParentLoadingSkeleton } from '../../../src/components/common/ParentLoadingSkeleton';
import { Button } from '../../../src/components/ui/atoms/Button';

export default function ApplicationDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDark } = useTheme();

  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const appId = rawId && rawId !== '[id]' ? rawId : '';

  const {
    data: application,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.applications.detail(appId),
    queryFn: () => applicationsApi.getById(appId),
    enabled: Boolean(appId),
  });

  // Invalid or Missing ID State
  if (!appId) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: isDark ? '#0B0F19' : DESIGN_TOKENS.colors.background },
        ]}
      >
        <ParentPortalHeader title="Application Details" showBack={true} />
        <View style={styles.errorContainer}>
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: isDark ? '#1E293B' : DESIGN_TOKENS.colors.surface,
                borderColor: isDark ? '#334155' : DESIGN_TOKENS.colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.errorIconContainer,
                {
                  backgroundColor: isDark
                    ? 'rgba(245, 158, 11, 0.2)'
                    : DESIGN_TOKENS.colors.warningLight,
                  borderColor: isDark ? 'rgba(245, 158, 11, 0.4)' : '#FDE68A',
                },
              ]}
            >
              <Feather name="alert-triangle" size={28} color={DESIGN_TOKENS.colors.warning} />
            </View>
            <Text
              style={[
                styles.errorTitle,
                { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
              ]}
            >
              Invalid Application Reference
            </Text>
            <Text
              style={[
                styles.errorDescription,
                { color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary },
              ]}
            >
              The application reference is missing or invalid. Please select an application from
              your dashboard.
            </Text>
            <Button
              title="Return to Applications"
              variant="primary"
              size="md"
              onPress={() => router.replace('/(parent)/applications' as any)}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Loading State
  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: isDark ? '#0B0F19' : DESIGN_TOKENS.colors.background },
        ]}
      >
        <ParentPortalHeader title="Loading Application Hub..." showBack={true} />
        <View style={styles.loadingPadding}>
          <ParentLoadingSkeleton type="details" />
        </View>
      </SafeAreaView>
    );
  }

  // Error State (Screen 6 Reference)
  if (isError || !application) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: isDark ? '#0B0F19' : DESIGN_TOKENS.colors.background },
        ]}
      >
        <ParentPortalHeader title="Application Hub" showBack={true} />
        <View style={styles.errorContainer}>
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: isDark ? '#1E293B' : DESIGN_TOKENS.colors.surface,
                borderColor: isDark ? '#334155' : DESIGN_TOKENS.colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.errorIconContainer,
                {
                  backgroundColor: isDark
                    ? 'rgba(220, 38, 38, 0.2)'
                    : DESIGN_TOKENS.colors.errorLight,
                  borderColor: isDark ? 'rgba(220, 38, 38, 0.4)' : '#FECACA',
                },
              ]}
            >
              <Feather name="alert-circle" size={28} color={DESIGN_TOKENS.colors.error} />
            </View>
            <Text
              style={[
                styles.errorTitle,
                { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
              ]}
            >
              Failed to Load Application
            </Text>
            <Text
              style={[
                styles.errorDescription,
                { color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary },
              ]}
            >
              {error?.message ||
                'The application could not be retrieved from the admissions system. Please check your network and try again.'}
            </Text>
            <View style={styles.errorButtonsRow}>
              <Button
                title="Try Again"
                variant="outline"
                size="md"
                onPress={() => refetch()}
                style={{ flex: 1 }}
              />
              <Button
                title="Go Back"
                variant="primary"
                size="md"
                onPress={() => router.back()}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Resolved Data Values
  const studentName =
    application.student_name ||
    (application.student_first_name
      ? `${application.student_first_name} ${application.student_last_name || ''}`.trim()
      : application.leads
        ? `${application.leads.student_first_name || ''} ${application.leads.student_last_name || ''}`.trim()
        : 'Student Applicant');

  const appNumber =
    application.application_number ||
    `APP-${String(application.application_id || appId)
      .slice(0, 8)
      .toUpperCase()}`;

  const statusConfig = getApplicationStatusConfig(application.status);
  const documents = application.admission_documents || (application as any).documents || [];
  const docCount = documents.length;

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? '#0B0F19' : DESIGN_TOKENS.colors.background },
      ]}
    >
      {/* Top Header */}
      <ParentPortalHeader
        title={studentName}
        subtitle={appNumber}
        showBack={true}
        rightAction={
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: isDark
                  ? 'rgba(81, 70, 229, 0.2)'
                  : DESIGN_TOKENS.colors.primaryLight,
                borderColor: isDark ? 'rgba(81, 70, 229, 0.4)' : '#C7D2FE',
              },
            ]}
          >
            <Text style={styles.statusPillText}>{statusConfig.label}</Text>
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Alert Banner */}
        <View
          style={[
            styles.bannerCard,
            { backgroundColor: isDark ? '#1E1B4B' : DESIGN_TOKENS.colors.primary },
          ]}
        >
          <View style={styles.bannerHeaderRow}>
            <Text style={styles.bannerSessionText}>Current Application State</Text>
            <View style={styles.progressPill}>
              <Text style={styles.progressPillText}>{statusConfig.progress}% Completed</Text>
            </View>
          </View>
          <Text style={styles.bannerStatusLabel}>{statusConfig.label}</Text>
          <Text style={styles.bannerDescription}>{statusConfig.description}</Text>
        </View>

        {/* Action Hub Portals */}
        <View style={styles.portalsSection}>
          <Text
            style={[
              styles.portalsTitle,
              { color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary },
            ]}
          >
            Application Portals & Actions
          </Text>

          <View style={styles.portalsList}>
            {/* 1. Document Center */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push(`/(parent)/applications/${appId}/documents` as any)}
              style={[
                styles.portalCard,
                {
                  backgroundColor: isDark ? '#1E293B' : DESIGN_TOKENS.colors.surface,
                  borderColor: isDark ? '#334155' : DESIGN_TOKENS.colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Document Center"
            >
              <View style={styles.portalContent}>
                <View
                  style={[
                    styles.portalIconContainer,
                    {
                      backgroundColor: isDark
                        ? 'rgba(81, 70, 229, 0.2)'
                        : DESIGN_TOKENS.colors.primaryLight,
                    },
                  ]}
                >
                  <Feather
                    name="file-text"
                    size={20}
                    color={isDark ? '#818CF8' : DESIGN_TOKENS.colors.primary}
                  />
                </View>
                <View style={styles.portalTextContainer}>
                  <Text
                    style={[
                      styles.portalHeading,
                      { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
                    ]}
                  >
                    Document Center
                  </Text>
                  <Text
                    style={[
                      styles.portalSubtext,
                      { color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary },
                    ]}
                  >
                    {docCount} {docCount === 1 ? 'document' : 'documents'} attached • View & upload
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>

            {/* 2. Fees & Payments */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push(`/(parent)/applications/${appId}/fees` as any)}
              style={[
                styles.portalCard,
                {
                  backgroundColor: isDark ? '#1E293B' : DESIGN_TOKENS.colors.surface,
                  borderColor: isDark ? '#334155' : DESIGN_TOKENS.colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Fee Statement and Settlement"
            >
              <View style={styles.portalContent}>
                <View
                  style={[
                    styles.portalIconContainer,
                    {
                      backgroundColor: isDark ? 'rgba(13, 148, 136, 0.2)' : '#CCFBF1',
                    },
                  ]}
                >
                  <Feather name="credit-card" size={20} color={isDark ? '#2DD4BF' : '#0D9488'} />
                </View>
                <View style={styles.portalTextContainer}>
                  <Text
                    style={[
                      styles.portalHeading,
                      { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
                    ]}
                  >
                    Fee Statement & Settlement
                  </Text>
                  <Text
                    style={[
                      styles.portalSubtext,
                      { color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary },
                    ]}
                  >
                    Admission charges, payments & receipts
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>

            {/* 3. Assessment Tracker */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push(`/(parent)/applications/${appId}/assessment` as any)}
              style={[
                styles.portalCard,
                {
                  backgroundColor: isDark ? '#1E293B' : DESIGN_TOKENS.colors.surface,
                  borderColor: isDark ? '#334155' : DESIGN_TOKENS.colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Assessment Tracker"
            >
              <View style={styles.portalContent}>
                <View
                  style={[
                    styles.portalIconContainer,
                    {
                      backgroundColor: isDark ? 'rgba(147, 51, 234, 0.2)' : '#F3E8FF',
                    },
                  ]}
                >
                  <Feather name="award" size={20} color={isDark ? '#C084FC' : '#9333EA'} />
                </View>
                <View style={styles.portalTextContainer}>
                  <Text
                    style={[
                      styles.portalHeading,
                      { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
                    ]}
                  >
                    Assessment Tracker
                  </Text>
                  <Text
                    style={[
                      styles.portalSubtext,
                      { color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary },
                    ]}
                  >
                    Entrance test schedule & evaluation results
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>

            {/* 4. Timeline Tracker */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push(`/(parent)/applications/${appId}/timeline` as any)}
              style={[
                styles.portalCard,
                {
                  backgroundColor: isDark ? '#1E293B' : DESIGN_TOKENS.colors.surface,
                  borderColor: isDark ? '#334155' : DESIGN_TOKENS.colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Application Timeline"
            >
              <View style={styles.portalContent}>
                <View
                  style={[
                    styles.portalIconContainer,
                    {
                      backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : '#E0F2FE',
                    },
                  ]}
                >
                  <Feather name="clock" size={20} color={isDark ? '#38BDF8' : '#0284C7'} />
                </View>
                <View style={styles.portalTextContainer}>
                  <Text
                    style={[
                      styles.portalHeading,
                      { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
                    ]}
                  >
                    Application Timeline
                  </Text>
                  <Text
                    style={[
                      styles.portalSubtext,
                      { color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary },
                    ]}
                  >
                    Submission history & admission desk status logs
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>

            {/* 5. Admission Decision */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push(`/(parent)/applications/${appId}/decision` as any)}
              style={[
                styles.portalCard,
                {
                  backgroundColor: isDark ? '#1E293B' : DESIGN_TOKENS.colors.surface,
                  borderColor: isDark ? '#334155' : DESIGN_TOKENS.colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Admission Decision"
            >
              <View style={styles.portalContent}>
                <View
                  style={[
                    styles.portalIconContainer,
                    {
                      backgroundColor: isDark
                        ? 'rgba(245, 158, 11, 0.2)'
                        : DESIGN_TOKENS.colors.warningLight,
                    },
                  ]}
                >
                  <Feather
                    name="check-circle"
                    size={20}
                    color={isDark ? '#FBBF24' : DESIGN_TOKENS.colors.warning}
                  />
                </View>
                <View style={styles.portalTextContainer}>
                  <Text
                    style={[
                      styles.portalHeading,
                      { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
                    ]}
                  >
                    Admission Decision & Offer
                  </Text>
                  <Text
                    style={[
                      styles.portalSubtext,
                      { color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary },
                    ]}
                  >
                    Enrollment offer letter, acceptance & decision letter
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingPadding: {
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  errorCard: {
    padding: 28,
    borderRadius: DESIGN_TOKENS.radius.featureCard,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: DESIGN_TOKENS.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  errorIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 280,
  },
  errorButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bannerCard: {
    borderRadius: DESIGN_TOKENS.radius.featureCard,
    padding: 20,
    marginBottom: 20,
    shadowColor: DESIGN_TOKENS.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  bannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bannerSessionText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  progressPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  progressPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bannerStatusLabel: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  bannerDescription: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 17,
  },
  portalsSection: {
    marginTop: 4,
  },
  portalsTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  portalsList: {
    gap: 12,
  },
  portalCard: {
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: DESIGN_TOKENS.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    minHeight: 68,
  },
  portalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  portalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  portalTextContainer: {
    flex: 1,
  },
  portalHeading: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  portalSubtext: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 16,
  },
});
