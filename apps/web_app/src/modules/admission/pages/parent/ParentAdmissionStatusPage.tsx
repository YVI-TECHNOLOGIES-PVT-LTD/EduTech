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
} from 'lucide-react';
import { useApplicationList } from '../../hooks/useApplication';
import { formatStatusLabel, getStatusColor } from '../../core/AdmissionStatusMapper';
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

  const primaryApp = applications[0] || null;

  return (
    <PageContainer variant="default">
      {/* Canonical Page Header */}
      <PageHeader
        title="Application Evaluation & Decision Status"
        description="Real-time pipeline tracking, document verification milestones, and decision alerts."
        badge={
          <Badge
            variant="outline"
            className="text-[10px] font-black uppercase text-indigo-600 border-indigo-200"
          >
            Parent Self-Service
          </Badge>
        }
        actions={
          primaryApp && (
            <div className="flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-800">
              <span className="text-[10px] font-bold text-slate-400">ACTIVE APP:</span>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                {primaryApp.application_number || primaryApp.id || 'APP-2026-00368'}
              </span>
            </div>
          )
        }
      />

      {primaryApp ? (
        <Card className="p-6 sm:p-8 rounded-3xl border-slate-200/80 dark:border-border shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-border pb-5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                APPLICATION REF:{' '}
                {primaryApp.application_number || primaryApp.applicationNumber || 'APP-2026-00368'}
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                {primaryApp.student_name ||
                  (primaryApp.leads
                    ? `${primaryApp.leads.student_first_name || ''} ${primaryApp.leads.student_last_name || ''}`.trim()
                    : 'Applicant')}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Grade Applied: {primaryApp.grade_applied_for || 'Grade 1'}
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

          {/* Workflow Stage Progress Timeline */}
          <div className="space-y-4 pt-2">
            <SectionHeader
              title="Admission Workflow Milestones"
              description="Chronological progress through the Stage-1 evaluation desk."
            />

            <div className="space-y-6 relative pl-6 border-l-2 border-indigo-100 dark:border-indigo-900 ml-3">
              {/* Step 1 */}
              <div className="relative">
                <div className="absolute -left-[33px] top-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                  ✓
                </div>
                <h5 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  1. Online Application Registered
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Submitted successfully on{' '}
                  {primaryApp.application_date
                    ? new Date(primaryApp.application_date).toLocaleDateString()
                    : '10 Aug 2026'}
                  .
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="absolute -left-[33px] top-0.5 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                  2
                </div>
                <h5 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  2. Document &amp; Certificate Verification
                </h5>
                <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-0.5">
                  Under review by admissions office desk.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative opacity-60">
                <div className="absolute -left-[33px] top-0.5 w-5 h-5 rounded-full bg-slate-200 dark:bg-muted text-slate-500 flex items-center justify-center text-[10px] font-bold">
                  3
                </div>
                <h5 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  3. Entrance Assessment &amp; Interaction
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Schedule notification will be sent via SMS/email once verification clears.
                </p>
              </div>

              {/* Step 4 */}
              <div className="relative opacity-60">
                <div className="absolute -left-[33px] top-0.5 w-5 h-5 rounded-full bg-slate-200 dark:bg-muted text-slate-500 flex items-center justify-center text-[10px] font-bold">
                  4
                </div>
                <h5 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  4. Final Seat Decision &amp; Offer Letter
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Seat allocation decision and formal offer letter release.
                </p>
              </div>
            </div>
          </div>

          {/* Action Recommendations Box */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h5 className="text-xs font-extrabold text-indigo-950 dark:text-indigo-200">
                Recommended Next Step
              </h5>
              <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80">
                Check and ensure all required verification certificates are uploaded.
              </p>
            </div>
            <Button
              onClick={() => navigate('/app/admissions/documents')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shrink-0"
            >
              <span>Document Center</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </Card>
      ) : (
        <EmptyState
          title="No Active Admission Application Found"
          description="Start your child's enrollment process by completing an online admission application."
          action={
            <Button
              onClick={() => navigate('/app/admissions/wizard')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs px-6"
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
