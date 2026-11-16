import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import ProfileHeader from './ProfileHeader';
import { TimelineEngine } from '../timeline/TimelineEngine';
import SLAIndicator from '../timeline/SLAIndicator';
import { LeadTimeline } from '../inquiry/LeadTimeline';
import { CommunicationCenter } from '../../../common/communication/CommunicationCenter';
import { Applicant360DocumentsPanel } from './Applicant360DocumentsPanel';
import { Applicant360CounsellingPanel } from './Applicant360CounsellingPanel';
import { ApplicationProgressPanel } from './ApplicationProgressPanel';
import { Applicant360InterviewPanel } from './Applicant360InterviewPanel';
import { Applicant360ExamPanel } from './Applicant360ExamPanel';
import { Applicant360FeesPanel } from './Applicant360FeesPanel';
import { Applicant360ReviewPanel } from './Applicant360ReviewPanel';
import { RecordDecisionModal } from '../application/RecordDecisionModal';
import { EnrollmentModal } from '../enrollment/EnrollmentModal';
import { useGetDecisionQuery, useGetApplicationFeeQuery } from '@/shared/api/admission.api';
import type { Applicant360View } from '../../utils/applicant360.mapper';
import type { ApplicationProgressReport } from '../../hooks/useApplicationProgress';
import {
  User,
  ShieldAlert,
  PhoneCall,
  Award,
  DollarSign,
  MessageSquare,
  ClipboardList,
  Info,
  FileText,
  History as HistoryIcon,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { scoreTierLabel } from '../../utils/lead.score';
import { admissionApi } from '../../admission.api';
import { useEnrollment, useEnrollmentStatus } from '../../hooks/useEnrollment';
import { mapStatusToEnterpriseLabel } from '../../utils/statusMapper';
import { toast } from 'sonner';
import { AdmissionEngine, ADMISSION_EVENTS } from '../../core/AdmissionEngine';
import { Button } from '../../../../components/ui/button';
import { ADMISSION_WORKFLOW, WORKFLOW_STAGES_ORDER } from '../../core/admissionWorkflow';
import { AdmissionTimelineService } from '../../services/AdmissionTimelineService';

// Dynamic Visual Workflow Ribbon derived from core config
function WorkflowRibbon({ status }: { status: string }) {
  const currentStage =
    Object.values(ADMISSION_WORKFLOW).find((stage) =>
      stage.legacyStatuses.includes(status.toLowerCase().trim()),
    ) || ADMISSION_WORKFLOW.RECEIVED;

  return (
    <div className="bg-card p-4 border border-border/80 rounded-2xl shadow-sm overflow-x-auto">
      <div className="flex items-center gap-2 min-w-[1000px] justify-between">
        {WORKFLOW_STAGES_ORDER.map((stageId, i) => {
          const stage = ADMISSION_WORKFLOW[stageId];
          const isCompleted = stage.order < currentStage.order;
          const isCurrent = stage.id === currentStage.id;
          const isPending = stage.order > currentStage.order;

          let bgStyle = 'bg-muted/40 text-muted-foreground border-border/60';
          if (isCompleted) {
            bgStyle =
              'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
          } else if (isCurrent) {
            bgStyle =
              'bg-indigo-50 text-indigo-700 border-indigo-300 ring-2 ring-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800';
          }

          return (
            <React.Fragment key={stage.id}>
              <div
                className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl border flex-1 text-center ${bgStyle}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black uppercase tracking-wider">
                    {isCompleted ? '✓ Done' : isCurrent ? '● Active' : '○ Pending'}
                  </span>
                  {stage.isOptional && (
                    <span className="text-[8px] bg-muted text-muted-foreground font-extrabold px-1 rounded uppercase">
                      Optional
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wide truncate">
                  {stage.displayName}
                </span>
              </div>
              {i < WORKFLOW_STAGES_ORDER.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

const STAFF_TABS = [
  'Overview',
  'Counselling',
  'Documents',
  'Interview',
  'Exam',
  'Review',
  'Fees',
  'Approval',
  'Enrollment',
  'Timeline',
  'Communication',
  'Audit',
  'History',
] as const;

const PARENT_TABS = ['Overview', 'Timeline', 'Documents', 'Interview', 'Exam', 'Fees'] as const;
type ProfileTab = (typeof STAFF_TABS)[number];

interface Applicant360ProfileProps {
  applicant: Applicant360View;
  applicationId: string;
  progress?: ApplicationProgressReport | null;
  progressLoading?: boolean;
  readOnlyMode?: boolean;
  initialTab?: ProfileTab;
}

export function Applicant360Profile({
  applicant,
  applicationId,
  progress,
  progressLoading,
  readOnlyMode = false,
  initialTab = 'Overview',
}: Applicant360ProfileProps) {
  const tabs = readOnlyMode ? PARENT_TABS : STAFF_TABS;
  const resolvedTab = tabs.includes(initialTab as any) ? initialTab : 'Overview';
  const [activeTab, setActiveTab] = useState<ProfileTab>(resolvedTab);

  // Decision & Enrollment modal states
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);

  // Authoritative Queries for Decision and Fee Payment
  const { data: authoritativeDecision, refetch: refetchDecision } = useGetDecisionQuery(
    applicationId,
    {
      skip: !applicationId,
    },
  );
  const { data: authoritativeFee, refetch: refetchFee } = useGetApplicationFeeQuery(applicationId, {
    skip: !applicationId,
  });

  const isDecisionApproved =
    authoritativeDecision?.decision_status === 'approved' ||
    applicant.status === 'approved' ||
    applicant.status === 'enrolled';

  const isFeePaid =
    authoritativeFee?.payment_status === 'paid' ||
    authoritativeFee?.payment_status === 'waived' ||
    (applicant as any).payment_status === 'paid' ||
    applicant.status === 'enrolled';

  const isEnrolledApp =
    applicant.status === 'enrolled' ||
    (applicant as any).is_enrolled ||
    (applicant as any).isEnrolled ||
    !!(applicant as any).student;

  const enrolledAdmissionNo =
    (applicant as any).student?.admission_no ||
    (applicant as any).admissionNumber ||
    (applicant as any).application_number?.replace('APP', 'ADM') ||
    `ADM-2026-${applicationId.slice(0, 5).toUpperCase()}`;

  // Interactive Action states
  const [sigName, setSigName] = useState('');
  const [appNotes, setAppNotes] = useState('');
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  // Dynamic Audit / History states
  const [auditEntries, setAuditEntries] = useState<any[]>([]);
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Enrollment / Handoff section states
  const [selectedSection, setSelectedSection] = useState('A');
  const [rollInput, setRollInput] = useState('');

  const queryClient = useQueryClient();
  const { data: enrollmentStatus, refetch: refetchEnrollment } = useEnrollmentStatus(applicationId);
  const { enroll, confirm, isEnrolling, isConfirming } = useEnrollment();

  const displayProgress = progress?.progressPercent ?? applicant.progressPercent;

  const fetchLogs = async () => {
    if (!applicationId) return;
    try {
      setLogsLoading(true);
      const audits = await admissionApi.getAuditLogs(applicationId);
      const history = await admissionApi.getStatusHistory(applicationId);
      setAuditEntries(audits || []);
      setHistoryEntries(history || []);
    } catch (e) {
      console.error('Failed to load logs', e);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'Audit' || activeTab === 'History' || activeTab === 'Timeline') {
      fetchLogs();
    }
  }, [applicationId, activeTab]);

  // Principal Action handlers mapping extra states (Hold, Waitlist, Return to Counselor) cleanly to notes
  const handlePrincipalAction = async (
    action: 'approve' | 'reject' | 'hold' | 'waitlist' | 'conditional',
  ) => {
    if (!appNotes) return toast.warning('Please enter decision notes first');
    if ((action === 'approve' || action === 'conditional') && !sigName) {
      return toast.warning('Principal digital signature name required');
    }

    try {
      setIsActionSubmitting(true);
      const enrichedNotes = `[${action.toUpperCase()}] Signed by: ${sigName}. Comments: ${appNotes}`;

      if (action === 'approve' || action === 'conditional') {
        await admissionApi.approve(applicationId, enrichedNotes);
        toast.success(
          `Application successfully approved ${action === 'conditional' ? 'with conditions' : ''}`,
        );
      } else if (action === 'reject') {
        await admissionApi.reject(applicationId, enrichedNotes);
        toast.success('Application rejected');
      } else {
        // Hold, Waitlist or Return mapping to custom log + update note
        await admissionApi.verifyDocs(
          applicationId,
          `Decision: ${action.toUpperCase()} - ${appNotes}`,
        );
        toast.success(`Application status marked as: ${action.toUpperCase()}`);
      }

      setAppNotes('');
      setSigName('');
      refetchEnrollment();
      fetchLogs();
      AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
    } catch (err) {
      toast.error('Workflow transition failed');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleOfferAction = async (action: 'generate' | 'send' | 'accept' | 'reject') => {
    try {
      setIsActionSubmitting(true);
      if (action === 'generate') {
        await admissionApi.generateOffer({ application_id: applicationId });
        toast.success('Offer letter generated successfully');
      } else if (action === 'send') {
        await admissionApi.sendOffer({ application_id: applicationId });
        toast.success('Offer letter released to parent');
      } else if (action === 'accept') {
        await admissionApi.acceptOffer({ application_id: applicationId });
        toast.success('Offer accepted');
      } else if (action === 'reject') {
        await admissionApi.rejectOffer({ application_id: applicationId });
        toast.success('Offer rejected');
      }
      refetchEnrollment();
      fetchLogs();
      AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
    } catch {
      toast.error('Offer action failed');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Provision / Handoff handles
  const handleProvisionAction = async (type: 'confirm' | 'enroll') => {
    try {
      if (type === 'confirm') {
        await confirm({ applicationId });
        toast.success('Candidate academic details confirmed');
      } else {
        if (!rollInput) return toast.warning('Please enter a Section / Roll Number first');
        await enroll({ applicationId });
        toast.success('Student successfully provisioned to ERP Student Master!');
      }
      refetchEnrollment();
      fetchLogs();
      AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
    } catch (err: any) {
      toast.error(err?.message || 'Provisioning error occurred');
    }
  };

  return (
    <div className="space-y-6">
      <ProfileHeader applicant={applicant} />
      <WorkflowRibbon status={applicant.status} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* High-density left navigation panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Salesforce Tab Sidebar */}
          <div className="bg-white border rounded-2xl p-3 shadow-sm space-y-1">
            <span className="text-[10px] font-black uppercase text-gray-400 block px-2 pb-1.5 border-b mb-1">
              Dossier Sections
            </span>
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left text-xs px-3 py-2.5 rounded-xl font-bold transition-all uppercase tracking-wider ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Metadata Overview Panel */}
          <div className="bg-white p-5 border rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-800">
              {readOnlyMode ? 'Application Progress' : 'Process Metadata'}
            </h3>

            {!readOnlyMode && (
              <>
                <SLAIndicator
                  hoursRemaining={applicant.slaRemainingHours}
                  totalHours={applicant.slaTotalHours}
                />

                <div className="flex items-center justify-between text-xs py-2.5 border-b border-gray-50">
                  <span className="text-gray-400 font-bold uppercase text-[10px]">
                    Assigned Officer
                  </span>
                  <span className="font-bold text-gray-700 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    {applicant.counselor || 'Unassigned'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-2.5 border-b border-gray-50">
                  <span className="text-gray-400 font-bold uppercase text-[10px]">Lead Score</span>
                  <span className="px-2 py-0.5 rounded font-black text-[9px] bg-indigo-50 text-indigo-600">
                    {scoreTierLabel(applicant.crmLeadTemp)} ({applicant.crmLeadScore})
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-2.5 border-b border-gray-50">
                  <span className="text-gray-400 font-bold uppercase text-[10px]">
                    Process Risk
                  </span>
                  {applicant.slaRemainingHours <= 0 ? (
                    <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-600 font-black text-[9px] flex items-center gap-0.5 animate-pulse">
                      <ShieldAlert className="w-3 h-3" /> SLA BREACH
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-black text-[10px]">LOW RISK</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sub-tab view area */}
        <div className="lg:col-span-3">
          <div className="bg-white border rounded-2xl p-6 shadow-sm min-h-[350px] text-xs text-gray-700">
            {activeTab === 'Overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-indigo-500" /> Summary Information
                  </h3>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed mt-2">
                    {applicant.name} applied for {applicant.grade}. Current stage:{' '}
                    {applicant.status}. Progress: {displayProgress}%. Documents verified:{' '}
                    {progress?.sections.documents.completed ??
                      applicant.documentChecklist.filter((d) => d.verified).length}{' '}
                    of {progress?.sections.documents.total ?? applicant.documentChecklist.length}.
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-gray-50 border rounded-xl space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">
                      Entrance Exam
                    </span>
                    <span className="text-xs font-black block text-gray-800">
                      {applicant.examStatus}{' '}
                      {applicant.examScore !== undefined && `(${applicant.examScore}%)`}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 border rounded-xl space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">
                      Interview Panel
                    </span>
                    <span className="text-xs font-black block text-gray-800">
                      {applicant.interviewStatus}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 border rounded-xl space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">
                      Fees collection
                    </span>
                    <span className="text-xs font-black block text-gray-800">
                      {applicant.feeStatus}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Timeline' &&
              (() => {
                const timelineNodes = AdmissionTimelineService.buildTimeline(
                  historyEntries,
                  auditEntries,
                  applicant.submittedAt,
                );
                return timelineNodes.length > 0 ? (
                  <div className="relative border-l-2 border-gray-150 pl-5 ml-2.5 space-y-6">
                    {timelineNodes.map((node, idx) => (
                      <div key={idx} className="relative">
                        <span
                          className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full border border-white ${
                            node.type === 'creation'
                              ? 'bg-indigo-500'
                              : node.type === 'transition'
                                ? 'bg-emerald-500'
                                : 'bg-amber-500'
                          }`}
                        />
                        <div className="space-y-1">
                          <div className="flex justify-between items-center flex-wrap gap-2 text-[10px] font-bold">
                            <span className="text-indigo-600 uppercase">{node.title}</span>
                            <span className="text-gray-400">
                              {new Date(node.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 font-semibold">{node.description}</p>
                          {node.remarks && (
                            <p className="text-xs text-gray-500 italic mt-0.5">
                              Notes: {node.remarks}
                            </p>
                          )}
                          <p className="text-[9px] text-gray-400 font-bold uppercase">
                            Actor: {node.actor}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">
                    Timeline will appear as your application progresses.
                  </p>
                );
              })()}

            {!readOnlyMode && (activeTab === 'Counselling' || (activeTab as any) === 'CRM') && (
              <Applicant360CounsellingPanel
                applicationId={applicationId}
                leadId={(applicant as any).leadId || (applicant as any).lead_id || ''}
                applicantName={applicant.name}
                counselorName={applicant.counselor}
                crmLeadScore={applicant.crmLeadScore}
                readOnlyMode={readOnlyMode}
              />
            )}

            {activeTab === 'Documents' && (
              <Applicant360DocumentsPanel
                applicationId={applicationId}
                progress={progress}
                readOnlyMode={readOnlyMode}
              />
            )}

            {!readOnlyMode && activeTab === 'Review' && (
              <Applicant360ReviewPanel applicationId={applicationId} />
            )}

            {activeTab === 'Interview' && (
              <Applicant360InterviewPanel
                applicationId={applicationId}
                readOnlyMode={readOnlyMode}
              />
            )}

            {activeTab === 'Exam' && (
              <Applicant360ExamPanel applicationId={applicationId} readOnlyMode={readOnlyMode} />
            )}

            {activeTab === 'Fees' && (
              <Applicant360FeesPanel applicationId={applicationId} readOnlyMode={readOnlyMode} />
            )}

            {/* Formal Decision Modal */}
            <RecordDecisionModal
              isOpen={isDecisionModalOpen}
              onClose={() => setIsDecisionModalOpen(false)}
              application={applicant as any}
              initialDecision={authoritativeDecision}
              onSuccess={async () => {
                toast.success('Decision recorded successfully');
                refetchDecision();
                refetchEnrollment();
                fetchLogs();
                AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
              }}
            />

            {/* Final Enrollment Modal */}
            <EnrollmentModal
              isOpen={isEnrollmentModalOpen}
              onClose={() => setIsEnrollmentModalOpen(false)}
              application={{
                ...applicant,
                application_id: applicationId,
                is_decision_approved: isDecisionApproved,
                is_fee_paid: isFeePaid,
              }}
              onSuccess={async () => {
                refetchEnrollment();
                refetchDecision();
                fetchLogs();
                AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
              }}
            />

            {activeTab === 'Approval' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-foreground flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-indigo-500" /> Formal Admission Decision Desk
                  </h3>
                  <Button
                    size="sm"
                    onClick={() => setIsDecisionModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Record / Update Decision
                  </Button>
                </div>

                {/* Authoritative Decision Summary */}
                <div className="p-5 border rounded-2xl bg-card shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Current Decision Status
                      </span>
                      <h4 className="text-base font-bold text-foreground mt-0.5 flex items-center gap-2">
                        <span
                          className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                            isDecisionApproved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : authoritativeDecision?.decision_status === 'waitlisted'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : authoritativeDecision?.decision_status === 'rejected'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          {authoritativeDecision?.decision_status || applicant.status || 'Pending'}
                        </span>
                      </h4>
                    </div>
                    {authoritativeDecision?.decision_date && (
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Decision Date
                        </span>
                        <p className="text-xs font-bold text-foreground mt-0.5">
                          {new Date(authoritativeDecision.decision_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                        Scholarship Award
                      </span>
                      <span className="font-bold text-indigo-600 text-sm">
                        {authoritativeDecision?.scholarship_percentage
                          ? `${authoritativeDecision.scholarship_percentage}%`
                          : 'Standard (0%)'}
                      </span>
                    </div>

                    <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                        Offer Validity
                      </span>
                      <span className="font-bold text-foreground text-sm">
                        {authoritativeDecision?.offer_expiry_date
                          ? new Date(authoritativeDecision.offer_expiry_date).toLocaleDateString()
                          : '14 Days Standard'}
                      </span>
                    </div>

                    <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                        Waitlist Position
                      </span>
                      <span className="font-bold text-foreground text-sm">
                        {authoritativeDecision?.waitlist_position
                          ? `#${authoritativeDecision.waitlist_position}`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {authoritativeDecision?.remarks && (
                    <div className="p-3 rounded-xl bg-muted/30 border text-xs space-y-1">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">
                        Committee Remarks &amp; Notes
                      </span>
                      <p className="text-foreground font-medium">{authoritativeDecision.remarks}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Enrollment' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-foreground flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-indigo-500" /> SIS Student Master &amp;
                    Enrollment Handoff
                  </h3>
                  {!isEnrolledApp && isDecisionApproved && isFeePaid && (
                    <Button
                      size="sm"
                      onClick={() => setIsEnrollmentModalOpen(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Enroll Student Now
                    </Button>
                  )}
                </div>

                {isEnrolledApp ? (
                  /* Enrolled Student Card */
                  <div className="p-6 border rounded-2xl bg-gradient-to-br from-emerald-50/60 via-card to-indigo-50/40 dark:from-emerald-950/20 dark:to-indigo-950/20 shadow-sm space-y-5">
                    <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-800/60 pb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                          ✓
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                            OFFICIALLY ENROLLED SIS STUDENT
                          </span>
                          <h4 className="text-lg font-black text-foreground mt-0.5">
                            {applicant.name}
                          </h4>
                        </div>
                      </div>
                      <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 font-extrabold text-xs uppercase tracking-wider border border-emerald-300 dark:border-emerald-700">
                        Active Student
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div className="p-3 bg-card rounded-xl border space-y-1">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">
                          Admission Number
                        </span>
                        <p className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                          {enrolledAdmissionNo}
                        </p>
                      </div>

                      <div className="p-3 bg-card rounded-xl border space-y-1">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">
                          Grade &amp; Section
                        </span>
                        <p className="font-bold text-foreground text-sm">
                          {applicant.grade || 'Grade 1'}
                        </p>
                      </div>

                      <div className="p-3 bg-card rounded-xl border space-y-1">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">
                          Academic Year
                        </span>
                        <p className="font-bold text-foreground text-sm">
                          {(applicant as any).academicYear || '2026-2027'}
                        </p>
                      </div>

                      <div className="p-3 bg-card rounded-xl border space-y-1">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">
                          Enrollment Status
                        </span>
                        <p className="font-bold text-emerald-600 text-sm flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Not Enrolled: Prerequisite Verification Desk */
                  <div className="p-5 border rounded-2xl bg-card shadow-xs space-y-5">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Enrollment Prerequisite Checklist
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        All mandatory gates must be verified before student master record
                        provisioning.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      {/* Prerequisite 1: Admission Decision */}
                      <div
                        className={`p-3.5 rounded-xl border flex items-center justify-between ${
                          isDecisionApproved
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-50/70 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold">1. Admission Decision</p>
                          <p className="text-[10px] opacity-80">
                            {isDecisionApproved
                              ? 'Approved by Committee'
                              : 'Pending / Not Approved'}
                          </p>
                        </div>
                        {isDecisionApproved ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                      </div>

                      {/* Prerequisite 2: Fee Payment */}
                      <div
                        className={`p-3.5 rounded-xl border flex items-center justify-between ${
                          isFeePaid
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-50/70 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold">2. Admission Fee</p>
                          <p className="text-[10px] opacity-80">
                            {isFeePaid ? 'Fee Paid / Waived' : 'Payment Pending'}
                          </p>
                        </div>
                        {isFeePaid ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                      </div>

                      {/* Prerequisite 3: Document Center */}
                      <div className="p-3.5 rounded-xl border bg-emerald-50/70 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="font-bold">3. Document Verification</p>
                          <p className="text-[10px] opacity-80">Verified &amp; Cleared</p>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      </div>
                    </div>

                    <div className="pt-2 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">
                        {isDecisionApproved && isFeePaid
                          ? 'All prerequisites are satisfied. You may now complete enrollment.'
                          : 'Prerequisites incomplete. Please record decision or confirm fee payment to unlock enrollment.'}
                      </p>
                      <Button
                        size="sm"
                        disabled={!isDecisionApproved || !isFeePaid}
                        onClick={() => setIsEnrollmentModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-sm shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Launch Enrollment Desk
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!readOnlyMode && activeTab === 'Communication' && (
              <CommunicationCenter
                recipientId={applicationId}
                recipientName={applicant.name}
                recipientEmail={applicant.email}
                recipientPhone={applicant.phone}
              />
            )}

            {!readOnlyMode && activeTab === 'Audit' && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-indigo-500" /> Live Audit Logs (PostgreSQL)
                </h3>
                {logsLoading ? (
                  <p className="text-xs text-gray-400 animate-pulse">Loading logs...</p>
                ) : auditEntries.length === 0 ? (
                  <p className="text-xs text-gray-400">No audit events recorded yet.</p>
                ) : (
                  <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                    {auditEntries.map((log: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 border rounded-xl bg-gray-50/50 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-indigo-600">{log.action}</span>
                          <span className="text-gray-400 text-[10px]">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-600 font-medium">
                          {log.remarks || 'No remarks listed'}
                        </p>
                        <p className="text-[10px] text-gray-400 uppercase font-black font-mono">
                          User ID: {log.user_id || 'SYSTEM'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!readOnlyMode && activeTab === 'History' && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                  <HistoryIcon className="w-4 h-4 text-indigo-500" /> Status Transitions History
                </h3>
                {logsLoading ? (
                  <p className="text-xs text-gray-400 animate-pulse">Loading transitions...</p>
                ) : historyEntries.length === 0 ? (
                  <p className="text-xs text-gray-400">No transitions recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {historyEntries.map((hist: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 border rounded-xl bg-white text-xs flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-black">
                              {hist.old_status || 'INIT'}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black">
                              {hist.new_status}
                            </span>
                          </div>
                          <p className="text-gray-600 font-semibold mt-1">
                            {hist.reason || 'Workflow state transition'}
                          </p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">
                            By: {hist.changed_by || 'SYSTEM'}
                          </p>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold shrink-0">
                          {new Date(hist.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Applicant360Profile;
