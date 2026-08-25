import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Calendar,
  GraduationCap,
  ArrowRight,
  FileText,
  Award,
  AlertCircle,
  CreditCard,
  UserCheck,
  Users,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { useActiveAdmissionApplication } from '../../hooks/useActiveAdmissionApplication';
import { formatStatusLabel, getStatusColor } from '../../core/AdmissionStatusMapper';
import {
  useGetDecisionQuery,
  useGetApplicationFeeQuery,
  useGetApplicationAssessmentQuery,
  useGetApplicationDocumentsQuery,
} from '@/shared/api/admission.api';
import {
  PageContainer,
  PageHeader,
  SectionHeader,
  EmptyState,
} from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export function ParentAdmissionStatusPage() {
  const navigate = useNavigate();
  const {
    activeApplication,
    activeApplicationId,
    applications,
    setActiveApplicationId,
    hasMultiple,
    studentName,
    appNumber,
    gradeApplied,
    isLoading: isAppLoading,
    error: appError,
    refetch: refetchApps,
  } = useActiveAdmissionApplication();

  const {
    data: decisionData,
    isLoading: isDecisionLoading,
    refetch: refetchDecision,
  } = useGetDecisionQuery(activeApplicationId, {
    skip: !activeApplicationId,
  });

  const {
    data: feeData,
    isLoading: isFeeLoading,
    refetch: refetchFee,
  } = useGetApplicationFeeQuery(activeApplicationId, {
    skip: !activeApplicationId,
  });

  const {
    data: assessmentData,
    isLoading: isAssessmentLoading,
    refetch: refetchAssessment,
  } = useGetApplicationAssessmentQuery(activeApplicationId, {
    skip: !activeApplicationId,
  });

  const {
    data: uploadedDocs = [],
    isLoading: isDocsLoading,
    refetch: refetchDocs,
  } = useGetApplicationDocumentsQuery(activeApplicationId, {
    skip: !activeApplicationId,
  });

  if (isAppLoading) {
    return (
      <PageContainer variant="default">
        <div className="p-12 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-muted-foreground">Loading evaluation status...</p>
        </div>
      </PageContainer>
    );
  }

  if (appError) {
    return (
      <PageContainer variant="default">
        <div className="p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Failed to load status</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Unable to retrieve admission status. Please try again.
            </p>
          </div>
          <Button
            onClick={() => refetchApps()}
            variant="outline"
            size="sm"
            className="font-bold text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (!activeApplication) {
    return (
      <PageContainer variant="default">
        <PageHeader
          title="Application Evaluation & Decision Status"
          description="Real-time pipeline tracking, document verification milestones, and decision alerts."
          badge={
            <Badge
              variant="outline"
              className="text-[10px] font-black uppercase tracking-wider text-indigo-600 border-indigo-200"
            >
              Admission Self-Service
            </Badge>
          }
        />
        <EmptyState
          title="No Admission Applications Found"
          description="You need an active admission application to track evaluation and decision progress."
          action={
            <Button
              onClick={() => navigate('/app/admissions/wizard')}
              className="font-bold text-xs px-6 shadow-md"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Start New Application
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const rawStatus = (activeApplication.status || 'submitted').toLowerCase();
  const decisionStatus = (
    decisionData?.decision_status ||
    activeApplication.admission_decisions?.decision_status ||
    ''
  ).toLowerCase();

  const isApproved =
    decisionStatus === 'approved' || rawStatus === 'approved' || rawStatus === 'enrolled';
  const isWaitlisted = decisionStatus === 'waitlisted' || rawStatus === 'waitlisted';
  const isRejected = decisionStatus === 'rejected' || rawStatus === 'rejected';
  const isEnrolled =
    rawStatus === 'enrolled' ||
    (activeApplication as any)?.is_enrolled ||
    !!(activeApplication as any)?.students;

  const isFeePaid =
    feeData?.payment_status === 'paid' ||
    feeData?.payment_status === 'waived' ||
    activeApplication.is_fee_paid ||
    activeApplication.payment_status === 'paid' ||
    isEnrolled;

  // Document verification stage calculation
  const hasDocCorrection = uploadedDocs.some(
    (d) => d.verify_status === 'rejected' || d.verify_status === 'resubmission_requested',
  );
  const allDocsVerified =
    uploadedDocs.length > 0 && uploadedDocs.every((d) => d.verify_status === 'verified');
  const hasDocsUploaded = uploadedDocs.length > 0;

  // Assessment stage calculation
  const hasAssessmentScore =
    assessmentData?.marks_obtained !== null && assessmentData?.marks_obtained !== undefined;
  const assessmentPassed =
    assessmentData?.result === 'pass' ||
    assessmentData?.result === 'recommended' ||
    (assessmentData?.percentage ?? 0) >= 40;

  const submittedDate =
    activeApplication.application_date ||
    activeApplication.submitted_at ||
    activeApplication.created_at;
  const formattedSubmittedDate = submittedDate
    ? new Date(submittedDate).toLocaleDateString()
    : 'Recently';

  const refetchAll = () => {
    refetchApps();
    refetchDecision();
    refetchFee();
    refetchAssessment();
    refetchDocs();
  };

  return (
    <PageContainer variant="default">
      {/* Canonical Page Header */}
      <PageHeader
        title="Application Evaluation & Decision Status"
        description="Real-time pipeline tracking, document verification milestones, and decision alerts."
        badge={
          <Badge
            variant="outline"
            className="text-[10px] font-black uppercase tracking-wider text-indigo-600 border-indigo-200"
          >
            Admission Self-Service
          </Badge>
        }
        actions={
          <div className="flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-800">
            <span className="text-[10px] font-bold text-muted-foreground">ACTIVE APP:</span>
            <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {appNumber}
            </span>
          </div>
        }
      />

      {/* Multi-Application Selector Banner */}
      {hasMultiple && (
        <div className="p-4 bg-muted/40 rounded-2xl border border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">Multiple Applications Registered</p>
              <p className="text-[11px] text-muted-foreground">
                Tracking admission status for{' '}
                <span className="font-bold text-foreground">{studentName}</span> ({gradeApplied}).
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <label className="text-xs font-bold text-muted-foreground shrink-0">
              Switch Child:
            </label>
            <select
              value={activeApplicationId}
              onChange={(e) => setActiveApplicationId(e.target.value)}
              aria-label="Select Active Admission Application"
              className="bg-card text-foreground text-xs font-bold px-3 py-1.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[180px]"
            >
              {applications.map((app) => {
                const name =
                  app.student_name ||
                  (app.leads
                    ? `${app.leads.student_first_name || ''} ${app.leads.student_last_name || ''}`.trim()
                    : app.lead
                      ? `${app.lead.student_first_name || ''} ${app.lead.student_last_name || ''}`.trim()
                      : 'Applicant');
                const num =
                  app.application_number ||
                  app.applicationNumber ||
                  app.application_id?.slice(0, 8);
                const id = app.application_id || app.id;
                return (
                  <option key={id} value={id}>
                    {name} ({num})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      )}

      {/* Application Details Summary Card */}
      <Card className="p-6 sm:p-8 rounded-2xl border-border/80 bg-card shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              APPLICATION REF: <span className="font-mono">{appNumber}</span>
            </span>
            <h3 className="text-lg font-bold text-foreground mt-0.5">{studentName}</h3>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Grade Applied: {gradeApplied} • Submitted on {formattedSubmittedDate}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={refetchAll}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
            <span
              className={`px-3.5 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${getStatusColor(
                rawStatus,
              )}`}
            >
              {formatStatusLabel(rawStatus)}
            </span>
          </div>
        </div>

        {/* Enrolled Student SIS Card (if enrolled) */}
        {isEnrolled && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-card to-indigo-50/50 dark:from-emerald-950/30 dark:to-indigo-950/30 border border-emerald-200 dark:border-emerald-800 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Official Student Enrollment Cleared
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  Welcome to EduTrack ERP! Student records and academic seat provisioning are
                  active.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-2.5 bg-background rounded-xl border border-border">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  Student Name
                </span>
                <p className="font-bold text-foreground text-sm mt-0.5">{studentName}</p>
              </div>
              <div className="p-2.5 bg-background rounded-xl border border-border">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  Class / Grade
                </span>
                <p className="font-bold text-foreground text-sm mt-0.5">{gradeApplied}</p>
              </div>
              <div className="p-2.5 bg-background rounded-xl border border-border">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  Enrollment Status
                </span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Admission Milestones Timeline */}
        <div className="space-y-4 pt-2">
          <SectionHeader
            title="Admission Workflow Milestones"
            description="Chronological progress through the Stage-1 evaluation desk."
          />

          <div className="space-y-6 relative pl-6 border-l-2 border-indigo-200 dark:border-indigo-900 ml-3">
            {/* Step 1: Application Registered */}
            <div className="relative">
              <div className="absolute -left-[33px] top-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                ✓
              </div>
              <h5 className="text-sm font-bold text-foreground">
                1. Online Application Registered
              </h5>
              <p className="text-xs text-muted-foreground mt-0.5">
                Submitted successfully on {formattedSubmittedDate}.
              </p>
            </div>

            {/* Step 2: Document Verification */}
            <div className="relative">
              <div
                className={`absolute -left-[33px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                  allDocsVerified || isApproved || isEnrolled
                    ? 'bg-emerald-500 text-white'
                    : hasDocCorrection
                      ? 'bg-rose-500 text-white'
                      : hasDocsUploaded
                        ? 'bg-amber-500 text-white'
                        : 'bg-muted text-muted-foreground border'
                }`}
              >
                {allDocsVerified || isApproved || isEnrolled ? '✓' : hasDocCorrection ? '!' : '2'}
              </div>
              <h5 className="text-sm font-bold text-foreground">
                2. Document &amp; Certificate Verification
              </h5>
              {hasDocCorrection ? (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
                  Action required: One or more documents require correction or re-upload. Please
                  check Document Center.
                </p>
              ) : allDocsVerified || isApproved || isEnrolled ? (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  All submitted certificates verified and cleared by the admissions office desk.
                </p>
              ) : hasDocsUploaded ? (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                  {uploadedDocs.length} documents uploaded. Currently under verification review.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Please upload required documents in the Document Center.
                </p>
              )}
            </div>

            {/* Step 3: Entrance Assessment & Interaction */}
            <div className="relative">
              <div
                className={`absolute -left-[33px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                  hasAssessmentScore || isApproved || isEnrolled
                    ? 'bg-emerald-500 text-white'
                    : rawStatus === 'assessment_pending'
                      ? 'bg-amber-500 text-white'
                      : 'bg-muted text-muted-foreground border'
                }`}
              >
                {hasAssessmentScore || isApproved || isEnrolled ? '✓' : '3'}
              </div>
              <h5 className="text-sm font-bold text-foreground">
                3. Entrance Assessment &amp; Interaction
              </h5>
              {hasAssessmentScore ? (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  Assessment completed. Result:{' '}
                  <span className="uppercase font-bold">
                    {assessmentData?.result || (assessmentPassed ? 'Cleared' : 'Evaluated')}
                  </span>
                  {assessmentData?.percentage !== null &&
                    assessmentData?.percentage !== undefined && (
                      <span> ({assessmentData.percentage}%)</span>
                    )}
                </p>
              ) : rawStatus === 'assessment_pending' ? (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                  Assessment session scheduled / awaiting examiner score entry.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Stage pending — schedule will be notified by the evaluation desk.
                </p>
              )}
            </div>

            {/* Step 4: Admission Decision & Offer */}
            <div className="relative">
              <div
                className={`absolute -left-[33px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                  isApproved || isEnrolled
                    ? 'bg-emerald-500 text-white'
                    : isWaitlisted
                      ? 'bg-amber-500 text-white'
                      : isRejected
                        ? 'bg-rose-500 text-white'
                        : 'bg-indigo-600 text-white animate-pulse'
                }`}
              >
                {isApproved || isEnrolled ? '✓' : isWaitlisted ? 'W' : isRejected ? '✕' : '4'}
              </div>
              <h5 className="text-sm font-bold text-foreground">
                4. Committee Decision &amp; Offer Status
              </h5>
              {isApproved || isEnrolled ? (
                <div className="mt-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                    <Award className="w-4 h-4" />
                    <span>CONGRATULATIONS — ADMISSION OFFER ISSUED</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The admissions committee has approved admission for {studentName} in{' '}
                    {gradeApplied}.
                  </p>
                  {decisionData?.offer_expiry_date && (
                    <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                      Offer valid until:{' '}
                      {new Date(decisionData.offer_expiry_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : isWaitlisted ? (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                  Application Waitlisted.{' '}
                  {decisionData?.waitlist_position
                    ? `Current Waitlist Position: #${decisionData.waitlist_position}`
                    : 'Awaiting seat availability clearance.'}
                </p>
              ) : isRejected ? (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
                  Application Not Accepted.{' '}
                  {decisionData?.reason
                    ? `Reason: ${decisionData.reason}`
                    : 'Criteria not fulfilled.'}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Application is under committee review. Decision alerts will update here in real
                  time.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Action Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-border/60">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/app/admissions/documents?appId=${activeApplicationId}`)}
            className="w-full sm:w-auto font-bold text-xs"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            <span>Document Center</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/app/admissions/fees?appId=${activeApplicationId}`)}
            className="w-full sm:w-auto font-bold text-xs"
          >
            <CreditCard className="w-3.5 h-3.5 mr-1.5" />
            <span>Fee Statement</span>
          </Button>
          <Button
            size="sm"
            onClick={() => navigate(`/app/admissions/${activeApplicationId}`)}
            className="w-full sm:w-auto font-bold text-xs shadow-sm"
          >
            <span>View Full Details</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
}

export default ParentAdmissionStatusPage;
