import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useMyApplications } from '../../src/features/admission/hooks/useMyApplications';
import { useDocumentTypes } from '../../src/features/admission/hooks/useDocumentTypes';
import { useApplicationDocuments } from '../../src/features/admission/hooks/useApplicationDocuments';
import { useApplicationAssessment } from '../../src/features/admission/hooks/useApplicationAssessment';
import { useApplicationDecision } from '../../src/features/admission/hooks/useApplicationDecision';
import { useApplicationFee } from '../../src/features/admission/hooks/useApplicationFee';
import { useApplicationTimeline } from '../../src/features/admission/hooks/useApplicationTimeline';
import {
  AdmissionApplication,
  DocumentType,
  AdmissionDocument,
} from '../../src/types/admission.types';
import { getApplicationStatusConfig } from '../../src/utils/status-mapper';
import { useTheme } from '../../src/theme';
import { DESIGN_TOKENS } from '../../src/theme/tokens/designTokens';
import { ParentPortalHeader } from '../../src/components/common/ParentPortalHeader';
import { ParentEmptyState } from '../../src/components/common/ParentEmptyState';
import { ParentLoadingSkeleton } from '../../src/components/common/ParentLoadingSkeleton';
import { Button } from '../../src/components/ui/atoms/Button';

type TimelineStageState =
  'COMPLETED' | 'CURRENT' | 'ACTION_REQUIRED' | 'PENDING' | 'REJECTED' | 'WAITLISTED';

interface TimelineStage {
  id: string;
  title: string;
  statusLabel: string;
  state: TimelineStageState;
  dateStr?: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export default function AdmissionStatusScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { isDark } = useTheme();

  // 1. Applications Query
  const {
    data: applications = [],
    isLoading: loadingApps,
    isError: errorApps,
    error: appsError,
    refetch: refetchApps,
    isRefetching: refetchingApps,
  } = useMyApplications();

  // Active Selected Application ID
  const [selectedAppId, setSelectedAppId] = useState<string>('');

  const activeAppId = useMemo(() => {
    if (selectedAppId) return selectedAppId;
    if (params.id && params.id !== '[id]') return params.id;
    if (applications.length > 0) {
      return applications[0].application_id || (applications[0] as any).id || '';
    }
    return '';
  }, [selectedAppId, params.id, applications]);

  const activeApplication: AdmissionApplication | null = useMemo(() => {
    if (!activeAppId || applications.length === 0) return null;
    return (
      applications.find(
        (app: AdmissionApplication) => (app.application_id || (app as any).id) === activeAppId,
      ) || applications[0]
    );
  }, [activeAppId, applications]);

  // 2. Sub-entity Queries for Active Application
  const { data: documentTypes = [], refetch: refetchDocTypes } = useDocumentTypes();

  const { data: uploadedDocs = [], refetch: refetchDocs } = useApplicationDocuments(activeAppId);

  const { data: assessment, refetch: refetchAssessment } = useApplicationAssessment(activeAppId);

  const { data: decision, refetch: refetchDecision } = useApplicationDecision(activeAppId);

  const { data: feeSummary, refetch: refetchFee } = useApplicationFee(activeAppId);

  const { refetch: refetchTimeline } = useApplicationTimeline(activeAppId);

  const isGlobalRefetching = refetchingApps;

  const handleGlobalRefresh = () => {
    refetchApps();
    if (activeAppId) {
      refetchDocTypes();
      refetchDocs();
      refetchAssessment();
      refetchDecision();
      refetchFee();
      refetchTimeline();
    }
  };

  // Status mapping
  const appStatus = (activeApplication?.status || 'draft').toLowerCase();
  const statusConfig = getApplicationStatusConfig(appStatus);

  // Student & Academic Info
  const studentName =
    activeApplication?.student_name ||
    (activeApplication?.student_first_name
      ? `${activeApplication.student_first_name} ${activeApplication.student_last_name || ''}`.trim()
      : activeApplication?.leads
        ? `${activeApplication.leads.student_first_name || ''} ${activeApplication.leads.student_last_name || ''}`.trim()
        : 'Student Applicant');

  const appNumber =
    activeApplication?.application_number ||
    (activeAppId ? `APP-${activeAppId.slice(0, 8).toUpperCase()}` : 'APP-PENDING');

  const appliedGrade =
    activeApplication?.grade_applied_for ||
    (activeApplication as any)?.grade ||
    activeApplication?.leads?.academic_year_grades?.grades?.grade_name ||
    'Grade 1';

  const academicSession = (activeApplication as any)?.academic_session || 'Academic Year 2026–2027';

  const lastUpdated =
    activeApplication?.updated_at || activeApplication?.created_at
      ? new Date(activeApplication.updated_at || activeApplication.created_at!).toLocaleDateString(
          undefined,
          {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          },
        )
      : 'Recently';

  // Document Verification Aggregates
  const totalRequiredDocs = documentTypes.filter(
    (d: DocumentType) => d.is_mandatory !== false,
  ).length;
  const verifiedDocsCount = uploadedDocs.filter(
    (d: AdmissionDocument) => d.verify_status === 'verified',
  ).length;
  const rejectedDocsCount = uploadedDocs.filter(
    (d: AdmissionDocument) => d.verify_status === 'rejected' || (d as any).resubmission_requested,
  ).length;
  const allMandatoryVerified = totalRequiredDocs > 0 && verifiedDocsCount >= totalRequiredDocs;

  // Compute fee summary amounts safely
  const feeBalanceDue = useMemo(() => {
    if (!feeSummary) return 500;
    if (feeSummary.payment_status === 'paid') return 0;
    return Math.max(0, (feeSummary.total_fee || 0) - (feeSummary.payment?.amount || 0));
  }, [feeSummary]);

  const isFeePaid = useMemo(() => {
    if (!feeSummary) return false;
    return feeSummary.payment_status === 'paid' || feeBalanceDue <= 0;
  }, [feeSummary, feeBalanceDue]);

  // Determine Dynamic "Next Step"
  const nextStep = useMemo(() => {
    if (appStatus === 'enrolled' || appStatus === 'admitted') {
      return {
        title: 'Student Successfully Enrolled',
        description:
          'Welcome to EduTrack! Your child is enrolled. Official credentials and orientation materials will be sent to your registered email.',
        actionText: undefined,
        onAction: undefined,
        icon: 'check-circle' as keyof typeof Feather.glyphMap,
        badgeColor: DESIGN_TOKENS.colors.success,
      };
    }

    if (decision?.decision_status === 'approved' || appStatus === 'approved') {
      if (!isFeePaid) {
        return {
          title: 'Admission Approved — Fee Settlement Required',
          description:
            'Congratulations! Admission has been approved. Please pay the admission fee to confirm your seat.',
          actionText: 'Proceed to Payment',
          onAction: () => router.push(`/(parent)/applications/${activeAppId}/fees` as any),
          icon: 'credit-card' as keyof typeof Feather.glyphMap,
          badgeColor: DESIGN_TOKENS.colors.primary,
        };
      }
      return {
        title: 'Enrollment Formalities In Progress',
        description:
          'Admission fee has been settled. The registrar office is generating the final enrollment number.',
        actionText: 'View Decision Letter',
        onAction: () => router.push(`/(parent)/applications/${activeAppId}/decision` as any),
        icon: 'award' as keyof typeof Feather.glyphMap,
        badgeColor: DESIGN_TOKENS.colors.primary,
      };
    }

    if (decision?.decision_status === 'rejected' || appStatus === 'rejected') {
      return {
        title: 'Application Not Approved',
        description:
          decision?.remarks ||
          'The admission panel was unable to offer enrollment at this time based on academic capacity.',
        actionText: 'View Decision Details',
        onAction: () => router.push(`/(parent)/applications/${activeAppId}/decision` as any),
        icon: 'alert-circle' as keyof typeof Feather.glyphMap,
        badgeColor: DESIGN_TOKENS.colors.error,
      };
    }

    if (rejectedDocsCount > 0) {
      return {
        title: 'Document Resubmission Requested',
        description:
          'One or more certificates were rejected or need replacement. Please re-upload clear copies.',
        actionText: 'Replace Documents',
        onAction: () => router.push(`/(parent)/applications/${activeAppId}/documents` as any),
        icon: 'alert-triangle' as keyof typeof Feather.glyphMap,
        badgeColor: DESIGN_TOKENS.colors.warning,
      };
    }

    if (uploadedDocs.length < totalRequiredDocs) {
      return {
        title: 'Mandatory Documents Required',
        description: `Please upload your remaining certificates (${uploadedDocs.length} of ${totalRequiredDocs} submitted).`,
        actionText: 'Upload Documents',
        onAction: () => router.push(`/(parent)/applications/${activeAppId}/documents` as any),
        icon: 'upload' as keyof typeof Feather.glyphMap,
        badgeColor: DESIGN_TOKENS.colors.primary,
      };
    }

    if (assessment && (assessment.result === 'pending' || !assessment.result)) {
      const dateStr = assessment.assessment_date
        ? new Date(assessment.assessment_date).toLocaleDateString()
        : 'Scheduled Date TBA';
      return {
        title: 'Entrance Assessment Scheduled',
        description: `Scheduled for ${dateStr}. Please review venue and exam guidelines.`,
        actionText: 'View Assessment Details',
        onAction: () => router.push(`/(parent)/applications/${activeAppId}/assessment` as any),
        icon: 'calendar' as keyof typeof Feather.glyphMap,
        badgeColor: DESIGN_TOKENS.colors.primary,
      };
    }

    return {
      title: 'Academic Review in Progress',
      description:
        'Your application credentials and documentation are currently under evaluation by the admission committee.',
      actionText: undefined,
      onAction: undefined,
      icon: 'clock' as keyof typeof Feather.glyphMap,
      badgeColor: DESIGN_TOKENS.colors.primary,
    };
  }, [
    appStatus,
    decision,
    feeSummary,
    rejectedDocsCount,
    uploadedDocs.length,
    totalRequiredDocs,
    assessment,
    activeAppId,
    router,
  ]);

  // Build Vertical Timeline Stages
  const timelineStages: TimelineStage[] = useMemo(() => {
    const isSubmitted = appStatus !== 'draft';
    const submissionDate =
      activeApplication?.application_date || activeApplication?.created_at
        ? new Date(
            activeApplication.application_date || activeApplication.created_at!,
          ).toLocaleDateString()
        : undefined;

    // Stage 1: Application Submission
    const stage1: TimelineStage = {
      id: 'submission',
      title: '1. Application Submission',
      statusLabel: isSubmitted ? 'Completed' : 'Draft Incomplete',
      state: isSubmitted ? 'COMPLETED' : 'ACTION_REQUIRED',
      dateStr: submissionDate,
      description: isSubmitted
        ? 'Online application form filled and registered in the system.'
        : 'Please complete all steps in the admission wizard.',
      actionText: isSubmitted ? undefined : 'Complete Wizard',
      onAction: isSubmitted ? undefined : () => router.push('/(parent)/applications/wizard' as any),
    };

    // Stage 2: Document Verification
    let stage2State: TimelineStageState = 'PENDING';
    let stage2Label = 'Pending';
    let stage2Desc = 'Mandatory certificates uploaded will be reviewed by the admissions desk.';

    if (!isSubmitted) {
      stage2State = 'PENDING';
    } else if (allMandatoryVerified) {
      stage2State = 'COMPLETED';
      stage2Label = 'Verified';
      stage2Desc = `All ${totalRequiredDocs} required certificates verified by admissions desk.`;
    } else if (rejectedDocsCount > 0) {
      stage2State = 'ACTION_REQUIRED';
      stage2Label = 'Resubmission Required';
      stage2Desc = `${rejectedDocsCount} document(s) need replacement.`;
    } else if (uploadedDocs.length > 0) {
      stage2State = 'CURRENT';
      stage2Label = 'Under Review';
      stage2Desc = `${uploadedDocs.length} certificate(s) uploaded. Under desk verification.`;
    } else {
      stage2State = 'ACTION_REQUIRED';
      stage2Label = 'Documents Missing';
      stage2Desc = `Please upload ${totalRequiredDocs} mandatory certificates.`;
    }

    const stage2: TimelineStage = {
      id: 'docs',
      title: '2. Document Verification',
      statusLabel: stage2Label,
      state: stage2State,
      description: stage2Desc,
      actionText: stage2State === 'ACTION_REQUIRED' ? 'Upload Documents' : undefined,
      onAction:
        stage2State === 'ACTION_REQUIRED'
          ? () => router.push(`/(parent)/applications/${activeAppId}/documents` as any)
          : undefined,
    };

    // Stage 3: Entrance Assessment
    let stage3State: TimelineStageState = 'PENDING';
    let stage3Label = 'Pending';
    let stage3Desc =
      'Academic evaluation or entrance assessment scheduled if required for this grade.';

    if (assessment) {
      if (
        assessment.result === 'pass' ||
        (assessment.marks_obtained !== undefined && assessment.result !== 'fail')
      ) {
        stage3State = 'COMPLETED';
        stage3Label = 'Completed';
        const scoreStr =
          assessment.marks_obtained !== undefined
            ? ` with score: ${assessment.marks_obtained}${assessment.maximum_marks ? `/${assessment.maximum_marks}` : ''}`
            : '';
        stage3Desc = `Evaluation completed${scoreStr}.`;
      } else if (assessment.result === 'fail') {
        stage3State = 'REJECTED';
        stage3Label = 'Unsuccessful';
        stage3Desc = 'Assessment benchmark criteria not met.';
      } else {
        stage3State = 'CURRENT';
        stage3Label = 'Scheduled';
        const dateStr = assessment.assessment_date
          ? new Date(assessment.assessment_date).toLocaleDateString()
          : 'Date TBA';
        stage3Desc = `Assessment scheduled for ${dateStr}.`;
      }
    } else if (allMandatoryVerified) {
      stage3State = 'CURRENT';
      stage3Label = 'In Evaluation';
      stage3Desc = 'Admissions desk is reviewing scheduling eligibility.';
    }

    const stage3: TimelineStage = {
      id: 'assessment',
      title: '3. Entrance Assessment',
      statusLabel: stage3Label,
      state: stage3State,
      dateStr: assessment?.assessment_date
        ? new Date(assessment.assessment_date).toLocaleDateString()
        : undefined,
      description: stage3Desc,
      actionText: assessment?.result === 'pending' ? 'View Schedule' : undefined,
      onAction:
        assessment?.result === 'pending'
          ? () => router.push(`/(parent)/applications/${activeAppId}/assessment` as any)
          : undefined,
    };

    // Stage 4: Admission Review
    let stage4State: TimelineStageState = 'PENDING';
    let stage4Label = 'Pending';
    let stage4Desc = 'Comprehensive evaluation by the Head of Institute and Admission Committee.';

    if (decision) {
      stage4State = 'COMPLETED';
      stage4Label = 'Completed';
      stage4Desc = 'Admission Committee review completed.';
    } else if (stage3State === 'COMPLETED' || appStatus === 'under_review') {
      stage4State = 'CURRENT';
      stage4Label = 'Under Review';
      stage4Desc = 'Application file is currently with the admission panel for review.';
    }

    const stage4: TimelineStage = {
      id: 'review',
      title: '4. Admission Review',
      statusLabel: stage4Label,
      state: stage4State,
      description: stage4Desc,
    };

    // Stage 5: Admission Decision
    let stage5State: TimelineStageState = 'PENDING';
    let stage5Label = 'Pending';
    let stage5Desc = 'Formal offer letter or decision published by the institution.';

    if (
      decision?.decision_status === 'approved' ||
      appStatus === 'approved' ||
      appStatus === 'admitted' ||
      appStatus === 'enrolled'
    ) {
      stage5State = 'COMPLETED';
      stage5Label = 'Approved';
      stage5Desc = 'Admission approved. Official seat offer granted.';
    } else if (decision?.decision_status === 'waitlisted' || appStatus === 'waitlisted') {
      stage5State = 'WAITLISTED';
      stage5Label = 'Waitlisted';
      stage5Desc = 'Application placed on the academic waiting list pending vacancy.';
    } else if (decision?.decision_status === 'rejected' || appStatus === 'rejected') {
      stage5State = 'REJECTED';
      stage5Label = 'Not Offered';
      stage5Desc = decision?.remarks || 'Seat offer could not be extended at this time.';
    } else if (stage4State === 'CURRENT' || stage4State === 'COMPLETED') {
      stage5State = 'CURRENT';
      stage5Label = 'Decision Pending';
      stage5Desc = 'Admission decision is being prepared by the institute.';
    }

    const stage5: TimelineStage = {
      id: 'decision',
      title: '5. Admission Decision',
      statusLabel: stage5Label,
      state: stage5State,
      dateStr: decision?.decision_date
        ? new Date(decision.decision_date).toLocaleDateString()
        : undefined,
      description: stage5Desc,
      actionText: decision ? 'View Decision' : undefined,
      onAction: decision
        ? () => router.push(`/(parent)/applications/${activeAppId}/decision` as any)
        : undefined,
    };

    // Stage 6: Admission Fee Payment
    let stage6State: TimelineStageState = 'PENDING';
    let stage6Label = 'Pending';
    let stage6Desc = 'Settlement of admission processing & acceptance fees to confirm seat.';

    if (isFeePaid || appStatus === 'enrolled' || appStatus === 'admitted') {
      stage6State = 'COMPLETED';
      stage6Label = 'Paid';
      stage6Desc = 'Admission acceptance fees paid and receipt generated.';
    } else if (stage5State === 'COMPLETED') {
      stage6State = 'ACTION_REQUIRED';
      stage6Label = 'Payment Pending';
      stage6Desc = `Amount payable: ₹${feeBalanceDue.toLocaleString()}.`;
    }

    const stage6: TimelineStage = {
      id: 'fees',
      title: '6. Admission Fee Payment',
      statusLabel: stage6Label,
      state: stage6State,
      description: stage6Desc,
      actionText: stage6State === 'ACTION_REQUIRED' ? 'Pay Fees' : undefined,
      onAction:
        stage6State === 'ACTION_REQUIRED'
          ? () => router.push(`/(parent)/applications/${activeAppId}/fees` as any)
          : undefined,
    };

    // Stage 7: Student Enrollment
    let stage7State: TimelineStageState = 'PENDING';
    let stage7Label = 'Pending';
    let stage7Desc = 'Final SIS enrollment and student registration.';

    if (appStatus === 'enrolled' || appStatus === 'admitted') {
      stage7State = 'COMPLETED';
      stage7Label = 'Enrolled';
      stage7Desc = 'Student successfully enrolled into the academic directory.';
    } else if (stage6State === 'COMPLETED') {
      stage7State = 'CURRENT';
      stage7Label = 'Finalizing';
      stage7Desc = 'Registrar desk is generating school roll number & student ID.';
    }

    const stage7: TimelineStage = {
      id: 'enrollment',
      title: '7. Student Enrollment',
      statusLabel: stage7Label,
      state: stage7State,
      description: stage7Desc,
    };

    return [stage1, stage2, stage3, stage4, stage5, stage6, stage7];
  }, [
    appStatus,
    activeApplication,
    totalRequiredDocs,
    allMandatoryVerified,
    rejectedDocsCount,
    uploadedDocs.length,
    assessment,
    decision,
    feeSummary,
    activeAppId,
    router,
  ]);

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? '#0B0F19' : DESIGN_TOKENS.colors.background },
      ]}
    >
      {/* Top Header */}
      <ParentPortalHeader
        title="Admission Status"
        subtitle="Track your child's admission journey."
        rightAction={
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleGlobalRefresh}
            style={[styles.refreshButton, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh admission status"
          >
            <Feather
              name="refresh-cw"
              size={16}
              color={isDark ? '#F1F5F9' : DESIGN_TOKENS.colors.textPrimary}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isGlobalRefetching}
            onRefresh={handleGlobalRefresh}
            tintColor={DESIGN_TOKENS.colors.primary}
            colors={[DESIGN_TOKENS.colors.primary]}
          />
        }
      >
        {/* Loading State */}
        {loadingApps && <ParentLoadingSkeleton type="details" />}

        {/* Error State */}
        {!loadingApps && errorApps && (
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: isDark
                  ? 'rgba(220, 38, 38, 0.15)'
                  : DESIGN_TOKENS.colors.errorLight,
                borderColor: isDark ? 'rgba(220, 38, 38, 0.4)' : '#FECACA',
              },
            ]}
          >
            <View style={styles.errorHeader}>
              <Feather name="alert-circle" size={20} color={DESIGN_TOKENS.colors.error} />
              <Text
                style={[
                  styles.errorTitle,
                  { color: isDark ? '#FCA5A5' : DESIGN_TOKENS.colors.error },
                ]}
              >
                Failed to load admission status
              </Text>
            </View>
            <Text style={[styles.errorMessage, { color: isDark ? '#F87171' : '#991B1B' }]}>
              {appsError?.message || 'A network error occurred while retrieving admission status.'}
            </Text>
            <Button title="Try Again" variant="outline" size="sm" onPress={handleGlobalRefresh} />
          </View>
        )}

        {/* Empty State */}
        {!loadingApps && !errorApps && applications.length === 0 && (
          <ParentEmptyState
            ionIcon="clipboard-outline"
            title="No Admission Status Available"
            description="Start an admission application to track your child's enrollment progress here."
            actionText="Start Admission Application"
            onAction={() => router.push('/(parent)/applications/wizard' as any)}
          />
        )}

        {/* Active Application Content */}
        {!loadingApps && !errorApps && activeApplication && (
          <>
            {/* Section A: Multi-Application Selector */}
            {applications.length > 1 && (
              <View style={styles.selectorSection}>
                <Text
                  style={[
                    styles.sectionHeaderTitle,
                    { color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary },
                  ]}
                >
                  Select Child / Application
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.selectorList}
                >
                  {applications.map((app: AdmissionApplication) => {
                    const id = app.application_id || (app as any).id;
                    const isSelected = id === activeAppId;
                    const name =
                      app.student_name ||
                      (app.student_first_name
                        ? `${app.student_first_name} ${app.student_last_name || ''}`.trim()
                        : 'Child');
                    const grade = app.grade_applied_for || 'Grade 1';

                    return (
                      <TouchableOpacity
                        key={id}
                        activeOpacity={0.8}
                        onPress={() => setSelectedAppId(id)}
                        style={[
                          styles.appSelectorChip,
                          {
                            backgroundColor: isSelected
                              ? DESIGN_TOKENS.colors.primary
                              : isDark
                                ? '#1E293B'
                                : DESIGN_TOKENS.colors.surface,
                            borderColor: isSelected
                              ? DESIGN_TOKENS.colors.primary
                              : isDark
                                ? '#334155'
                                : DESIGN_TOKENS.colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.appSelectorName,
                            {
                              color: isSelected
                                ? '#FFFFFF'
                                : isDark
                                  ? '#F8FAFC'
                                  : DESIGN_TOKENS.colors.textPrimary,
                            },
                          ]}
                        >
                          {name}
                        </Text>
                        <Text
                          style={[
                            styles.appSelectorGrade,
                            {
                              color: isSelected
                                ? 'rgba(255, 255, 255, 0.85)'
                                : DESIGN_TOKENS.colors.textMuted,
                            },
                          ]}
                        >
                          {grade}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Section B: Overall Admission Status Card */}
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: isDark ? '#1E1B4B' : DESIGN_TOKENS.colors.primary },
              ]}
            >
              <View style={styles.summaryTopRow}>
                <View style={styles.summaryBadge}>
                  <Text style={styles.summaryBadgeText}>{academicSession}</Text>
                </View>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>{statusConfig.label}</Text>
                </View>
              </View>

              <Text style={styles.summaryStudentName}>{studentName}</Text>
              <Text style={styles.summaryAppNumber}>
                {appNumber} • {appliedGrade}
              </Text>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryBottomRow}>
                <View>
                  <Text style={styles.summaryMetaLabel}>Current Stage</Text>
                  <Text style={styles.summaryMetaValue}>{statusConfig.label}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.summaryMetaLabel}>Last Updated</Text>
                  <Text style={styles.summaryMetaValue}>{lastUpdated}</Text>
                </View>
              </View>
            </View>

            {/* Section H: "Your Next Step" Action Card */}
            <View
              style={[
                styles.nextStepCard,
                {
                  backgroundColor: isDark ? '#1E293B' : DESIGN_TOKENS.colors.surface,
                  borderColor: isDark ? '#334155' : DESIGN_TOKENS.colors.border,
                },
              ]}
            >
              <View style={styles.nextStepHeaderRow}>
                <View
                  style={[
                    styles.nextStepIconContainer,
                    { backgroundColor: DESIGN_TOKENS.colors.primaryLight },
                  ]}
                >
                  <Feather name={nextStep.icon} size={20} color={DESIGN_TOKENS.colors.primary} />
                </View>
                <View style={styles.nextStepTextContainer}>
                  <View style={styles.nextStepPillRow}>
                    <Text style={[styles.nextStepSectionTag, { color: nextStep.badgeColor }]}>
                      Your Next Step
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.nextStepTitle,
                      { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
                    ]}
                  >
                    {nextStep.title}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.nextStepDescription,
                  { color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary },
                ]}
              >
                {nextStep.description}
              </Text>

              {nextStep.actionText && nextStep.onAction && (
                <View style={styles.nextStepActionRow}>
                  <Button
                    title={nextStep.actionText}
                    variant="primary"
                    size="md"
                    onPress={nextStep.onAction}
                  />
                </View>
              )}
            </View>

            {/* Section C: Admission Journey – Visual Progress Tracker */}
            <View
              style={[
                styles.journeyCard,
                {
                  backgroundColor: isDark ? '#1E293B' : DESIGN_TOKENS.colors.surface,
                  borderColor: isDark ? '#334155' : DESIGN_TOKENS.colors.border,
                },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <Text
                  style={[
                    styles.cardHeaderTitle,
                    { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
                  ]}
                >
                  Admission Journey
                </Text>
                <Text style={styles.cardHeaderSubtitle}>7 Milestone Process</Text>
              </View>

              <View style={styles.timelineContainer}>
                {timelineStages.map((stage: TimelineStage, index: number) => {
                  const isLast = index === timelineStages.length - 1;

                  let iconColor = '#94A3B8';
                  let iconBg = isDark ? '#0F172A' : '#F1F5F9';
                  let iconName: keyof typeof Feather.glyphMap = 'circle';
                  let badgeBg = '#F1F5F9';
                  let badgeColor = '#64748B';

                  if (stage.state === 'COMPLETED') {
                    iconColor = '#FFFFFF';
                    iconBg = DESIGN_TOKENS.colors.success;
                    iconName = 'check';
                    badgeBg = DESIGN_TOKENS.colors.successLight;
                    badgeColor = DESIGN_TOKENS.colors.success;
                  } else if (stage.state === 'CURRENT') {
                    iconColor = '#FFFFFF';
                    iconBg = DESIGN_TOKENS.colors.primary;
                    iconName = 'loader';
                    badgeBg = DESIGN_TOKENS.colors.primaryLight;
                    badgeColor = DESIGN_TOKENS.colors.primary;
                  } else if (stage.state === 'ACTION_REQUIRED') {
                    iconColor = '#FFFFFF';
                    iconBg = DESIGN_TOKENS.colors.warning;
                    iconName = 'alert-triangle';
                    badgeBg = DESIGN_TOKENS.colors.warningLight;
                    badgeColor = '#B45309';
                  } else if (stage.state === 'REJECTED') {
                    iconColor = '#FFFFFF';
                    iconBg = DESIGN_TOKENS.colors.error;
                    iconName = 'x';
                    badgeBg = DESIGN_TOKENS.colors.errorLight;
                    badgeColor = DESIGN_TOKENS.colors.error;
                  } else if (stage.state === 'WAITLISTED') {
                    iconColor = '#FFFFFF';
                    iconBg = DESIGN_TOKENS.colors.warning;
                    iconName = 'clock';
                    badgeBg = DESIGN_TOKENS.colors.warningLight;
                    badgeColor = '#B45309';
                  }

                  // Connector Line Color
                  const nextStage = timelineStages[index + 1];
                  const connectorColor =
                    stage.state === 'COMPLETED' && nextStage && nextStage.state === 'COMPLETED'
                      ? DESIGN_TOKENS.colors.success
                      : stage.state === 'COMPLETED' && nextStage && nextStage.state === 'CURRENT'
                        ? DESIGN_TOKENS.colors.primary
                        : isDark
                          ? '#334155'
                          : '#E2E8F0';

                  return (
                    <View key={stage.id} style={styles.timelineRow}>
                      {/* Left: Icon Indicator & Vertical Connector */}
                      <View style={styles.timelineColLeft}>
                        <View style={[styles.timelineIconWrapper, { backgroundColor: iconBg }]}>
                          <Feather name={iconName} size={13} color={iconColor} />
                        </View>
                        {!isLast && (
                          <View
                            style={[styles.timelineConnector, { backgroundColor: connectorColor }]}
                          />
                        )}
                      </View>

                      {/* Right: Stage Content */}
                      <View style={[styles.timelineColRight, isLast ? { paddingBottom: 0 } : null]}>
                        <View style={styles.stageTitleRow}>
                          <Text
                            style={[
                              styles.stageTitle,
                              { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
                            ]}
                          >
                            {stage.title}
                          </Text>
                          <View style={[styles.stageBadge, { backgroundColor: badgeBg }]}>
                            <Text style={[styles.stageBadgeText, { color: badgeColor }]}>
                              {stage.statusLabel}
                            </Text>
                          </View>
                        </View>

                        {stage.dateStr && (
                          <Text style={styles.stageDateText}>Recorded: {stage.dateStr}</Text>
                        )}

                        <Text
                          style={[
                            styles.stageDescription,
                            { color: isDark ? '#94A3B8' : DESIGN_TOKENS.colors.textSecondary },
                          ]}
                        >
                          {stage.description}
                        </Text>

                        {stage.actionText && stage.onAction && (
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={stage.onAction}
                            style={styles.stageActionButton}
                          >
                            <Text style={styles.stageActionText}>{stage.actionText}</Text>
                            <Feather
                              name="arrow-right"
                              size={13}
                              color={DESIGN_TOKENS.colors.primary}
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Section D: Document Verification Status */}
            <View
              style={[
                styles.moduleCard,
                {
                  backgroundColor: isDark ? '#1E293B' : DESIGN_TOKENS.colors.surface,
                  borderColor: isDark ? '#334155' : DESIGN_TOKENS.colors.border,
                },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text
                    style={[
                      styles.cardHeaderTitle,
                      { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
                    ]}
                  >
                    Document Vault Status
                  </Text>
                  <Text style={styles.cardHeaderSubtitle}>
                    {verifiedDocsCount} of {documentTypes.length} Verified
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    router.push(`/(parent)/applications/${activeAppId}/documents` as any)
                  }
                  style={styles.cardHeaderLink}
                >
                  <Text style={styles.cardHeaderLinkText}>Open Vault</Text>
                  <Feather name="chevron-right" size={14} color={DESIGN_TOKENS.colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.itemsList}>
                {documentTypes.slice(0, 4).map((type: DocumentType) => {
                  const typeId = type.document_type_id || (type as any).id;
                  const uploaded = uploadedDocs.find(
                    (d: AdmissionDocument) => (d.document_type_id || (d as any).type_id) === typeId,
                  );

                  let statusText = 'Not Uploaded';
                  let statusBg = isDark ? '#334155' : '#F1F5F9';
                  let statusColor = '#64748B';

                  if (uploaded) {
                    if (uploaded.verify_status === 'verified') {
                      statusText = 'Verified';
                      statusBg = DESIGN_TOKENS.colors.successLight;
                      statusColor = DESIGN_TOKENS.colors.success;
                    } else if (uploaded.verify_status === 'rejected') {
                      statusText = 'Rejected';
                      statusBg = DESIGN_TOKENS.colors.errorLight;
                      statusColor = DESIGN_TOKENS.colors.error;
                    } else {
                      statusText = 'Pending Verification';
                      statusBg = DESIGN_TOKENS.colors.primaryLight;
                      statusColor = DESIGN_TOKENS.colors.primary;
                    }
                  }

                  return (
                    <View
                      key={typeId}
                      style={[
                        styles.itemRow,
                        { borderBottomColor: isDark ? '#334155' : '#F1F5F9' },
                      ]}
                    >
                      <View style={styles.itemRowLeft}>
                        <Feather name="file-text" size={15} color={DESIGN_TOKENS.colors.primary} />
                        <Text
                          style={[
                            styles.itemRowTitle,
                            { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
                          ]}
                        >
                          {type.document_name}
                        </Text>
                      </View>
                      <View style={[styles.itemStatusPill, { backgroundColor: statusBg }]}>
                        <Text style={[styles.itemStatusPillText, { color: statusColor }]}>
                          {statusText}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Section E: Assessment Status */}
            <View
              style={[
                styles.moduleCard,
                {
                  backgroundColor: isDark ? '#1E293B' : DESIGN_TOKENS.colors.surface,
                  borderColor: isDark ? '#334155' : DESIGN_TOKENS.colors.border,
                },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text
                    style={[
                      styles.cardHeaderTitle,
                      { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
                    ]}
                  >
                    Assessment Status
                  </Text>
                  <Text style={styles.cardHeaderSubtitle}>Entrance Test & Evaluation</Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    router.push(`/(parent)/applications/${activeAppId}/assessment` as any)
                  }
                  style={styles.cardHeaderLink}
                >
                  <Text style={styles.cardHeaderLinkText}>View Details</Text>
                  <Feather name="chevron-right" size={14} color={DESIGN_TOKENS.colors.primary} />
                </TouchableOpacity>
              </View>

              {assessment ? (
                <View style={styles.detailsBox}>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsKey}>Evaluation Type:</Text>
                    <Text style={styles.detailsVal}>Academic Entrance Assessment</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsKey}>Scheduled Date:</Text>
                    <Text style={styles.detailsVal}>
                      {assessment.assessment_date
                        ? new Date(assessment.assessment_date).toLocaleDateString()
                        : 'Date TBA'}
                    </Text>
                  </View>
                  {assessment.result && (
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsKey}>Result Outcome:</Text>
                      <Text
                        style={[
                          styles.detailsVal,
                          {
                            color:
                              assessment.result === 'pass'
                                ? DESIGN_TOKENS.colors.success
                                : assessment.result === 'fail'
                                  ? DESIGN_TOKENS.colors.error
                                  : DESIGN_TOKENS.colors.primary,
                            fontWeight: '800',
                          },
                        ]}
                      >
                        {assessment.result.toUpperCase()}
                      </Text>
                    </View>
                  )}
                  {assessment.marks_obtained !== undefined && (
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsKey}>Marks Obtained:</Text>
                      <Text style={styles.detailsVal}>
                        {assessment.marks_obtained}
                        {assessment.maximum_marks ? ` / ${assessment.maximum_marks}` : ''}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.emptyModuleRow}>
                  <Feather name="info" size={16} color={DESIGN_TOKENS.colors.textMuted} />
                  <Text style={styles.emptyModuleText}>No assessment scheduled at this time.</Text>
                </View>
              )}
            </View>

            {/* Section F: Admission Decision Card */}
            <View
              style={[
                styles.moduleCard,
                {
                  backgroundColor: isDark ? '#1E293B' : DESIGN_TOKENS.colors.surface,
                  borderColor: isDark ? '#334155' : DESIGN_TOKENS.colors.border,
                },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text
                    style={[
                      styles.cardHeaderTitle,
                      { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
                    ]}
                  >
                    Admission Decision
                  </Text>
                  <Text style={styles.cardHeaderSubtitle}>Official Offer & Status</Text>
                </View>
                {decision && (
                  <TouchableOpacity
                    onPress={() =>
                      router.push(`/(parent)/applications/${activeAppId}/decision` as any)
                    }
                    style={styles.cardHeaderLink}
                  >
                    <Text style={styles.cardHeaderLinkText}>View Letter</Text>
                    <Feather name="chevron-right" size={14} color={DESIGN_TOKENS.colors.primary} />
                  </TouchableOpacity>
                )}
              </View>

              {decision ? (
                <View style={styles.detailsBox}>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsKey}>Decision:</Text>
                    <Text
                      style={[
                        styles.detailsVal,
                        {
                          color:
                            decision.decision_status === 'approved'
                              ? DESIGN_TOKENS.colors.success
                              : decision.decision_status === 'rejected'
                                ? DESIGN_TOKENS.colors.error
                                : DESIGN_TOKENS.colors.warning,
                          fontWeight: '800',
                        },
                      ]}
                    >
                      {decision.decision_status.toUpperCase()}
                    </Text>
                  </View>
                  {decision.decision_date && (
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsKey}>Decision Date:</Text>
                      <Text style={styles.detailsVal}>
                        {new Date(decision.decision_date).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                  {decision.offer_expiry_date && (
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsKey}>Offer Expiry:</Text>
                      <Text style={styles.detailsVal}>
                        {new Date(decision.offer_expiry_date).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.emptyModuleRow}>
                  <Feather name="clock" size={16} color={DESIGN_TOKENS.colors.textMuted} />
                  <Text style={styles.emptyModuleText}>
                    Decision pending. Results will be published following review.
                  </Text>
                </View>
              )}
            </View>

            {/* Section G: Admission Fee Payment */}
            <View
              style={[
                styles.moduleCard,
                {
                  backgroundColor: isDark ? '#1E293B' : DESIGN_TOKENS.colors.surface,
                  borderColor: isDark ? '#334155' : DESIGN_TOKENS.colors.border,
                },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text
                    style={[
                      styles.cardHeaderTitle,
                      { color: isDark ? '#F8FAFC' : DESIGN_TOKENS.colors.textPrimary },
                    ]}
                  >
                    Admission Fee Payment
                  </Text>
                  <Text style={styles.cardHeaderSubtitle}>Tuition & Registration Fee</Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push(`/(parent)/applications/${activeAppId}/fees` as any)}
                  style={styles.cardHeaderLink}
                >
                  <Text style={styles.cardHeaderLinkText}>View Ledger</Text>
                  <Feather name="chevron-right" size={14} color={DESIGN_TOKENS.colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.detailsBox}>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsKey}>Fee Status:</Text>
                  <Text
                    style={[
                      styles.detailsVal,
                      {
                        color:
                          feeSummary?.payment_status === 'paid'
                            ? DESIGN_TOKENS.colors.success
                            : DESIGN_TOKENS.colors.primary,
                        fontWeight: '800',
                      },
                    ]}
                  >
                    {(feeSummary?.payment_status || 'PENDING').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsKey}>Total Amount:</Text>
                  <Text style={styles.detailsVal}>
                    ₹{feeSummary?.total_fee ? feeSummary.total_fee.toLocaleString() : '500'}
                  </Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsKey}>Balance Due:</Text>
                  <Text style={styles.detailsVal}>₹{feeBalanceDue.toLocaleString()}</Text>
                </View>
              </View>

              {feeSummary && feeBalanceDue > 0 && decision?.decision_status === 'approved' && (
                <View style={{ marginTop: 12 }}>
                  <Button
                    title="Proceed to Payment"
                    variant="primary"
                    size="md"
                    onPress={() => router.push(`/(parent)/applications/${activeAppId}/fees` as any)}
                  />
                </View>
              )}
            </View>
          </>
        )}
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
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: DESIGN_TOKENS.radius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCard: {
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: 16,
    marginBottom: 16,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  errorMessage: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  selectorSection: {
    marginBottom: 16,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  selectorList: {
    gap: 8,
  },
  appSelectorChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: DESIGN_TOKENS.radius.input,
    borderWidth: 1,
    marginRight: 8,
  },
  appSelectorName: {
    fontSize: 13,
    fontWeight: '800',
  },
  appSelectorGrade: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  summaryCard: {
    borderRadius: DESIGN_TOKENS.radius.featureCard,
    padding: 22,
    marginBottom: 18,
    shadowColor: DESIGN_TOKENS.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  summaryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statusPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: DESIGN_TOKENS.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryStudentName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  summaryAppNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 14,
  },
  summaryBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryMetaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryMetaValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  nextStepCard: {
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: 18,
    borderWidth: 1,
    marginBottom: 18,
    shadowColor: DESIGN_TOKENS.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  nextStepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nextStepIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nextStepTextContainer: {
    flex: 1,
  },
  nextStepPillRow: {
    marginBottom: 2,
  },
  nextStepSectionTag: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  nextStepTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  nextStepDescription: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 12,
  },
  nextStepActionRow: {
    marginTop: 2,
  },
  journeyCard: {
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: 20,
    borderWidth: 1,
    marginBottom: 18,
    shadowColor: DESIGN_TOKENS.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardHeaderSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: DESIGN_TOKENS.colors.textMuted,
    marginTop: 1,
  },
  cardHeaderLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.primary,
    marginRight: 2,
  },
  timelineContainer: {
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineColLeft: {
    alignItems: 'center',
    width: 28,
  },
  timelineIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  timelineColRight: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 20,
  },
  stageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  stageTitle: {
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stageBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  stageDateText: {
    fontSize: 10,
    fontWeight: '600',
    color: DESIGN_TOKENS.colors.textMuted,
    marginBottom: 4,
  },
  stageDescription: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  stageActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  stageActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.primary,
  },
  moduleCard: {
    borderRadius: DESIGN_TOKENS.radius.card,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: DESIGN_TOKENS.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  itemsList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  itemRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  itemRowTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
  },
  itemStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  itemStatusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  detailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: DESIGN_TOKENS.radius.small,
    padding: 12,
    gap: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailsKey: {
    fontSize: 12,
    fontWeight: '600',
    color: DESIGN_TOKENS.colors.textSecondary,
  },
  detailsVal: {
    fontSize: 12,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.textPrimary,
  },
  emptyModuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  emptyModuleText: {
    fontSize: 12,
    fontWeight: '500',
    color: DESIGN_TOKENS.colors.textMuted,
  },
});
