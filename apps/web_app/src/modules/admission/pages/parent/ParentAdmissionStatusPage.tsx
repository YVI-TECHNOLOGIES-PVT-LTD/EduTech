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
} from 'lucide-react';
import { useApplicationList } from '../../hooks/useApplication';
import { formatStatusLabel, getStatusColor } from '../../core/AdmissionStatusMapper';
import { useGetDecisionQuery, useGetApplicationFeeQuery } from '@/shared/api/admission.api';
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
  const { applications, isLoading, refetch } = useApplicationList({ limit: 10 }, { mine: true });

  const primaryApp = applications[0] || null;
  const appId = primaryApp?.application_id || primaryApp?.id || '';

  const { data: decisionData } = useGetDecisionQuery(appId, {
    skip: !appId,
  });
  const { data: feeData } = useGetApplicationFeeQuery(appId, {
    skip: !appId,
  });

  if (isLoading) {
    return (
      <PageContainer variant="default">
        <div className="p-12 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Loading evaluation status...</p>
        </div>
      </PageContainer>
    );
  }

  const isApproved =
    decisionData?.decision_status === 'approved' ||
    (primaryApp?.status as string) === 'approved' ||
    (primaryApp?.status as string) === 'enrolled';

  const isWaitlisted =
    decisionData?.decision_status === 'waitlisted' ||
    (primaryApp?.status as string) === 'waitlisted';

  const isRejected =
    decisionData?.decision_status === 'rejected' || (primaryApp?.status as string) === 'rejected';

  const isEnrolled =
    (primaryApp?.status as string) === 'enrolled' ||
    (primaryApp as any)?.is_enrolled ||
    !!(primaryApp as any)?.students;

  const isFeePaid =
    feeData?.payment_status === 'paid' ||
    feeData?.payment_status === 'waived' ||
    primaryApp?.is_fee_paid ||
    primaryApp?.payment_status === 'paid' ||
    isEnrolled;

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
            Parent Self-Service
          </Badge>
        }
        actions={
          primaryApp && (
            <div className="flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-800">
              <span className="text-[10px] font-bold text-muted-foreground">ACTIVE APP:</span>
              <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {primaryApp.application_number ||
                  primaryApp.applicationNumber ||
                  primaryApp.id ||
                  'APP-2026-00368'}
              </span>
            </div>
          )
        }
      />

      {primaryApp ? (
        <Card className="p-6 sm:p-8 rounded-2xl border-border/80 bg-card shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                APPLICATION REF:{' '}
                <span className="font-mono">
                  {primaryApp.application_number ||
                    primaryApp.applicationNumber ||
                    'APP-2026-00368'}
                </span>
              </span>
              <h3 className="text-lg font-bold text-foreground mt-0.5">
                {primaryApp.student_name ||
                  (primaryApp.leads
                    ? `${primaryApp.leads.student_first_name || ''} ${primaryApp.leads.student_last_name || ''}`.trim()
                    : 'Applicant')}
              </h3>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Grade Applied: {primaryApp.grade_applied_for || primaryApp.grade_name || 'Grade 1'}
              </p>
            </div>
            <span
              className={`px-3.5 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${getStatusColor(
                primaryApp.status || 'submitted',
              )}`}
            >
              {formatStatusLabel(primaryApp.status || 'submitted')}
            </span>
          </div>

          {/* Enrolled Student SIS Card (if enrolled) */}
          {isEnrolled && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-card to-indigo-50/50 dark:from-emerald-950/30 dark:to-indigo-950/30 border border-emerald-200 dark:border-emerald-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-emerald-600 text-white rounded-xl font-black shadow-xs">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      OFFICIAL ENROLLMENT COMPLETE
                    </span>
                    <h4 className="text-base font-bold text-foreground mt-0.5">
                      Student SIS Master Record Created
                    </h4>
                  </div>
                </div>
                <Badge className="bg-emerald-600 text-white font-bold text-xs">
                  Active Student
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-emerald-200/50 dark:border-emerald-800/50">
                <div className="p-2.5 bg-background rounded-xl border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Admission Number
                  </span>
                  <p className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm mt-0.5">
                    {primaryApp.students?.admission_no ||
                      `ADM-2026-${appId.slice(0, 5).toUpperCase()}`}
                  </p>
                </div>
                <div className="p-2.5 bg-background rounded-xl border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Grade &amp; Section
                  </span>
                  <p className="font-bold text-foreground text-sm mt-0.5">
                    {primaryApp.grade_applied_for || primaryApp.grade_name || 'Grade 1'}
                  </p>
                </div>
                <div className="p-2.5 bg-background rounded-xl border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Academic Year
                  </span>
                  <p className="font-bold text-foreground text-sm mt-0.5">
                    {primaryApp.academic_year_name || '2026-2027'}
                  </p>
                </div>
                <div className="p-2.5 bg-background rounded-xl border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Enrollment Status
                  </span>
                  <p className="font-bold text-emerald-600 text-sm mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Workflow Stage Progress Timeline */}
          <div className="space-y-4 pt-2">
            <SectionHeader
              title="Admission Workflow Milestones"
              description="Chronological progress through the Stage-1 evaluation desk."
            />

            <div className="space-y-6 relative pl-6 border-l-2 border-indigo-200 dark:border-indigo-900 ml-3">
              {/* Step 1 */}
              <div className="relative">
                <div className="absolute -left-[33px] top-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                  ✓
                </div>
                <h5 className="text-sm font-bold text-foreground">
                  1. Online Application Registered
                </h5>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Submitted successfully on{' '}
                  {primaryApp.application_date
                    ? new Date(primaryApp.application_date).toLocaleDateString()
                    : '10 Aug 2026'}
                  .
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="absolute -left-[33px] top-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                  ✓
                </div>
                <h5 className="text-sm font-bold text-foreground">
                  2. Document &amp; Certificate Verification
                </h5>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  Documents verified and cleared by admissions office desk.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="absolute -left-[33px] top-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                  ✓
                </div>
                <h5 className="text-sm font-bold text-foreground">
                  3. Entrance Assessment &amp; Interaction
                </h5>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Evaluation and examiner scoring completed.
                </p>
              </div>

              {/* Step 4: Decision */}
              <div className="relative">
                <div
                  className={`absolute -left-[33px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                    isApproved
                      ? 'bg-emerald-500 text-white'
                      : isWaitlisted
                        ? 'bg-amber-500 text-white'
                        : isRejected
                          ? 'bg-rose-500 text-white'
                          : 'bg-indigo-600 text-white animate-pulse'
                  }`}
                >
                  {isApproved ? '✓' : isWaitlisted ? 'W' : isRejected ? '✕' : '4'}
                </div>
                <h5 className="text-sm font-bold text-foreground flex items-center gap-2">
                  4. Final Seat Decision &amp; Offer Letter
                  {isApproved && (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                      Seat Offered
                    </Badge>
                  )}
                  {isWaitlisted && (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                      Waitlisted{' '}
                      {decisionData?.waitlist_position ? `#${decisionData.waitlist_position}` : ''}
                    </Badge>
                  )}
                  {isRejected && (
                    <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">
                      Application Not Selected
                    </Badge>
                  )}
                </h5>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isApproved
                    ? `Congratulations! Seat confirmed by Admissions Committee.${decisionData?.offer_expiry_date ? ` Offer valid until ${new Date(decisionData.offer_expiry_date).toLocaleDateString()}.` : ''}`
                    : isWaitlisted
                      ? 'Your application has been placed on the waiting list. You will be notified if a seat becomes available.'
                      : isRejected
                        ? decisionData?.reason ||
                          'Application was not selected in the current intake cycle.'
                        : 'Under review by Admissions Committee & Principal desk.'}
                </p>
              </div>

              {/* Step 5: Enrollment */}
              <div className={`relative ${isEnrolled ? '' : 'opacity-60'}`}>
                <div
                  className={`absolute -left-[33px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                    isEnrolled ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isEnrolled ? '✓' : '5'}
                </div>
                <h5 className="text-sm font-bold text-foreground">
                  5. Academic Enrollment &amp; SIS Provisioning
                </h5>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isEnrolled
                    ? 'Student officially enrolled in the Student Information System (SIS).'
                    : 'Formal enrollment occurs upon fee confirmation and section allocation.'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Recommendations Box */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h5 className="text-xs font-bold text-foreground">
                {isEnrolled
                  ? 'Enrollment Complete'
                  : isApproved
                    ? isFeePaid
                      ? 'Ready for Class Assignment'
                      : 'Complete Fee Payment'
                    : 'Recommended Next Step'}
              </h5>
              <p className="text-xs text-muted-foreground">
                {isEnrolled
                  ? 'Your child is officially registered. Access your student portal dashboard anytime.'
                  : isApproved
                    ? isFeePaid
                      ? 'Admission fee is cleared. Front office is processing section allocation.'
                      : 'Please proceed to fee remittance to secure the admission seat.'
                    : 'Check and ensure all required verification certificates are uploaded.'}
              </p>
            </div>
            {isApproved && !isFeePaid && (
              <Button
                onClick={() => navigate('/app/admissions/fees')}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 shadow-sm gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Pay Admission Fee</span>
              </Button>
            )}
            {!isApproved && (
              <Button
                onClick={() => navigate('/app/admissions/documents')}
                size="sm"
                className="font-bold text-xs shrink-0 shadow-sm"
              >
                <span>Document Center</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <EmptyState
          title="No Active Admission Application Found"
          description="Start your child's enrollment process by completing an online admission application."
          action={
            <Button
              onClick={() => navigate('/app/admissions/wizard')}
              className="font-bold text-xs px-6 shadow-md"
            >
              Start New Application
            </Button>
          }
        />
      )}
    </PageContainer>
  );
}

export default ParentAdmissionStatusPage;
