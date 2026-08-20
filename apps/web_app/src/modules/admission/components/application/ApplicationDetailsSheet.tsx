import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ApplicationItem } from '@/shared/api/admission.api';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import { DocumentStatusBadge } from '../document/DocumentStatusBadge';
import { DocumentPreviewDialog, DocumentPreviewItem } from '../document/DocumentPreviewDialog';
import { VerifyDocumentDialog } from '../document/VerifyDocumentDialog';
import { RejectDocumentDialog } from '../document/RejectDocumentDialog';
import { RequestResubmissionDialog } from '../document/RequestResubmissionDialog';
import { PaymentStatusBadge } from '../fee/PaymentStatusBadge';
import { CollectAdmissionFeeDialog } from '../fee/CollectAdmissionFeeDialog';
import { AdmissionFeeReceiptDialog } from '../fee/AdmissionFeeReceiptDialog';
import { toast } from '@/components/ui/use-toast';
import {
  User,
  Phone,
  Mail,
  Calendar,
  GraduationCap,
  School,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  CreditCard,
  Award,
  ExternalLink,
  Edit3,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Eye,
  RotateCcw,
  Loader2,
  Printer,
  Banknote,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ApplicationDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  application: ApplicationItem | null;
  onOpenUpdateStatus?: (app: ApplicationItem) => void;
  onOpenEdit?: (app: ApplicationItem) => void;
  onOpenWithdraw?: (app: ApplicationItem) => void;
}

export const ApplicationDetailsSheet: React.FC<ApplicationDetailsSheetProps> = ({
  isOpen,
  onClose,
  application,
  onOpenUpdateStatus,
  onOpenEdit,
  onOpenWithdraw,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'documents' | 'assessment' | 'decision' | 'payment'
  >('overview');
  const [previewDoc, setPreviewDoc] = useState<DocumentPreviewItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedVerifyDoc, setSelectedVerifyDoc] = useState<any | null>(null);
  const [selectedRejectDoc, setSelectedRejectDoc] = useState<any | null>(null);
  const [selectedResubmitDoc, setSelectedResubmitDoc] = useState<any | null>(null);
  const [isCollectFeeOpen, setIsCollectFeeOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Safe normalized application data
  const lead = application?.lead ?? null;
  const docs = application?.documents ?? [];
  const docsSummary = application?.documents_summary ?? {
    total: docs.length,
    verified: docs.filter((d) => d.verify_status === 'verified').length,
    pending: docs.filter((d) => d.verify_status === 'pending').length,
    rejected: docs.filter(
      (d) => d.verify_status === 'rejected' || d.verify_status === 'resubmission_requested',
    ).length,
  };
  const completionPercentage =
    docsSummary.total > 0 ? Math.round((docsSummary.verified / docsSummary.total) * 100) : 0;
  const assessment = application?.assessment ?? null;
  const decision = application?.decision ?? null;
  const payment = application?.payment ?? null;

  const studentName =
    application?.student_name ||
    lead?.student_name ||
    [lead?.student_first_name, lead?.student_last_name].filter(Boolean).join(' ') ||
    'Applicant';

  const gradeName = application?.grade_name || lead?.grade_name || 'N/A';
  const academicYearName = application?.academic_year?.academic_year_name || 'Current Year';

  const handlePreviewDocument = (doc: any) => {
    if (!application) return;
    setPreviewDoc({
      document_id: doc.document_id,
      application_id: application.application_id || application.id,
      application_number: application.application_number || 'APP-PENDING',
      student_name: studentName,
      grade_name: gradeName,
      academic_year_name: academicYearName,
      document_name: doc.document_type_name || 'Admission Document',
      original_file_name: doc.original_file_name,
      mime_type: doc.mime_type,
      file_size: doc.file_size,
      verify_status: doc.verify_status || 'pending',
      verification_remarks: doc.verification_remarks,
      uploaded_at: doc.uploaded_at,
      verified_by: doc.verified_by,
      verified_at: doc.verified_at,
    });
    setIsPreviewOpen(true);
  };

  if (!application) return null;

  // Determine stage progression active step
  const status = (application.status || 'submitted').toLowerCase();
  const getStepStatus = (stepName: string) => {
    switch (stepName) {
      case 'lead':
        return 'completed';
      case 'application':
        return 'completed';
      case 'documents':
        if (status === 'submitted') return 'current';
        if (['documents_pending'].includes(status)) return 'current';
        if (['rejected', 'withdrawn'].includes(status)) return 'stopped';
        return docsSummary.verified > 0 ? 'completed' : 'current';
      case 'assessment':
        if (['submitted', 'documents_pending'].includes(status)) return 'upcoming';
        if (status === 'assessment_pending') return 'current';
        if (['rejected', 'withdrawn'].includes(status)) return 'stopped';
        return assessment ? 'completed' : 'upcoming';
      case 'decision':
        if (['submitted', 'documents_pending', 'assessment_pending'].includes(status))
          return 'upcoming';
        if (status === 'under_review') return 'current';
        if (['approved', 'waitlisted', 'rejected'].includes(status)) return 'completed';
        if (status === 'withdrawn') return 'stopped';
        return decision ? 'completed' : 'upcoming';
      case 'payment':
        if (['approved'].includes(status))
          return payment?.payment_status === 'paid' ? 'completed' : 'current';
        if (['rejected', 'withdrawn'].includes(status)) return 'stopped';
        return 'upcoming';
      default:
        return 'upcoming';
    }
  };

  const steps = [
    { key: 'lead', label: 'Lead Created' },
    { key: 'application', label: 'Application' },
    { key: 'documents', label: 'Documents' },
    { key: 'assessment', label: 'Assessment' },
    { key: 'decision', label: 'Decision' },
    { key: 'payment', label: 'Payment' },
  ];

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col h-full bg-card text-card-foreground border-l border-border">
          {/* Header Bar */}
          <div className="p-5 border-b border-border bg-card shrink-0 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                    {application.application_number}
                  </span>
                  <ApplicationStatusBadge status={application.status} />
                </div>
                <SheetTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  {studentName}
                </SheetTitle>
                <SheetDescription className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                  <span>
                    Applied:{' '}
                    {new Date(
                      application.application_date || application.created_at,
                    ).toLocaleDateString()}
                  </span>
                  <span>•</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {gradeName}
                  </span>
                  <span>•</span>
                  <span>{academicYearName}</span>
                </SheetDescription>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenEdit?.(application)}
                  className="h-8 text-xs font-semibold gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  onClick={() => onOpenUpdateStatus?.(application)}
                  className="h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Update Status
                </Button>
              </div>
            </div>

            {/* Admission Lifecycle Step Bar */}
            <div className="pt-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Admission Pipeline Progress
              </div>
              <div className="grid grid-cols-6 gap-1">
                {steps.map((step) => {
                  const st = getStepStatus(step.key);
                  return (
                    <div key={step.key} className="space-y-1 text-center">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          st === 'completed'
                            ? 'bg-emerald-500'
                            : st === 'current'
                              ? 'bg-blue-600 animate-pulse'
                              : st === 'stopped'
                                ? 'bg-slate-300 dark:bg-slate-700'
                                : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      />
                      <div
                        className={`text-[10px] truncate ${
                          st === 'completed'
                            ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                            : st === 'current'
                              ? 'text-blue-600 dark:text-blue-400 font-bold'
                              : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-5 pt-3 bg-card border-b border-border shrink-0">
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
              <TabsList className="grid grid-cols-5 h-9 bg-card border border-border p-1 text-xs">
                <TabsTrigger value="overview" className="text-xs font-semibold">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="documents" className="text-xs font-semibold">
                  Docs ({docsSummary.total})
                </TabsTrigger>
                <TabsTrigger value="assessment" className="text-xs font-semibold">
                  Assessment
                </TabsTrigger>
                <TabsTrigger value="decision" className="text-xs font-semibold">
                  Decision
                </TabsTrigger>
                <TabsTrigger value="payment" className="text-xs font-semibold">
                  Payment
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Student Details Card */}
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Applicant Profile
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Full Name</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {studentName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Gender</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                        {lead?.gender || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Date of Birth</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {lead?.dob ? new Date(lead.dob).toLocaleDateString() : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Target Grade</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {gradeName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Curriculum</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {lead?.curriculum_preference || 'CBSE'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Nationality</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {application.nationality || 'Indian'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Parent / Guardian Contact Card */}
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    Parent / Guardian Contact
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Guardian Name</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {lead?.contact_name || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Relationship</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                        {lead?.contact_relationship || 'Parent'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Phone Number</span>
                      <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                        {lead?.contact_phone || 'N/A'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[11px]">Email Address</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {lead?.contact_email || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Assigned Counsellor</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {lead?.counselor_name || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Previous Schooling Card */}
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b pb-2">
                    <School className="w-4 h-4 text-purple-600" />
                    Previous School History
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[11px]">School Name</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {application.previous_school_name || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Board</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {application.previous_school_board || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Last Grade</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {application.previous_grade || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Academic Year</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {application.previous_school_year || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Address / City</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {application.previous_school_address || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lead Reference Card */}
                {lead?.lead_number && (
                  <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-blue-900 dark:text-blue-300">
                        Converted from Lead #{lead.lead_number}
                      </div>
                      <div className="text-[11px] text-blue-600 dark:text-blue-400">
                        Original enquiry converted into this formal application.
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onClose();
                        navigate(`/app/admissions/inquiries?searchText=${lead.lead_number}`);
                      }}
                      className="h-8 text-xs font-semibold gap-1 bg-white dark:bg-slate-900"
                    >
                      View Lead
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-4">
                {/* Document Status Summary Header & Progress Bar */}
                <div className="p-4 bg-card border border-border rounded-xl space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        Document Verification Checklist
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        <strong>{docsSummary.verified}</strong> of{' '}
                        <strong>{docsSummary.total}</strong> documents verified (
                        {docsSummary.pending} pending, {docsSummary.rejected} action needed)
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate('/app/admissions/verification')}
                      className="text-xs h-8 font-semibold gap-1"
                    >
                      Open Queue
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                      <span>Verification Completion</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">
                        {completionPercentage}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Documents List */}
                {docs.length > 0 ? (
                  <div className="space-y-2.5">
                    {docs.map((doc) => {
                      const isVerified = doc.verify_status === 'verified';
                      const docPayload = {
                        document_id: doc.document_id,
                        application_id: application.application_id || application.id,
                        application_number: application.application_number,
                        student_name: studentName,
                        document_name: doc.document_type_name || 'Admission Document',
                        original_file_name: doc.original_file_name,
                      };

                      return (
                        <div
                          key={doc.document_id}
                          className="p-4 bg-card border border-border rounded-xl space-y-2.5 shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                                {doc.document_type_name || 'Admission Document'}
                                {doc.original_file_name && (
                                  <span className="text-[11px] font-normal text-slate-400 font-mono truncate max-w-[180px]">
                                    ({doc.original_file_name})
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                                <span>
                                  Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                                </span>
                                {doc.verified_at && (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                    • Verified {new Date(doc.verified_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>

                            <DocumentStatusBadge status={doc.verify_status} />
                          </div>

                          {doc.verification_remarks && (
                            <div className="text-[11px] bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg text-slate-600 dark:text-slate-300 italic">
                              Remarks: {doc.verification_remarks}
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreviewDocument(doc)}
                              className="h-7 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 gap-1 px-2"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Preview File
                            </Button>

                            <div className="flex items-center gap-1.5">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedResubmitDoc(docPayload)}
                                className="h-7 px-2 text-[11px] font-bold text-purple-700 border-purple-200 hover:bg-purple-50 dark:text-purple-300 dark:border-purple-800"
                              >
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Resubmit
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedRejectDoc(docPayload)}
                                className="h-7 px-2 text-[11px] font-bold text-rose-700 border-rose-200 hover:bg-rose-50 dark:text-rose-300 dark:border-rose-800"
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Reject
                              </Button>

                              {!isVerified && (
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => setSelectedVerifyDoc(docPayload)}
                                  className="h-7 px-2.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Verify
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white dark:bg-slate-900 border border-dashed rounded-xl space-y-2">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      No documents uploaded yet
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Required admission documents can be uploaded in the downstream Document
                      Verification desk.
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'assessment' && (
              <div className="space-y-4">
                <div className="p-4 bg-card border border-border rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-indigo-600" />
                      Entrance Assessment Summary
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {assessment
                        ? `Recorded on ${new Date(assessment.assessment_date).toLocaleDateString()}`
                        : 'No entrance test recorded yet'}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/app/admissions/interviews')}
                    className="text-xs h-8 font-semibold gap-1"
                  >
                    View Assessment Desk
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>

                {assessment ? (
                  <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Marks Obtained</span>
                        <span className="text-base font-bold text-slate-900 dark:text-white">
                          {assessment.marks_obtained ?? '—'} / {assessment.maximum_marks ?? '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Percentage</span>
                        <span className="text-base font-bold text-blue-600">
                          {assessment.percentage !== null && assessment.percentage !== undefined
                            ? `${assessment.percentage}%`
                            : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Evaluation Result</span>
                        <span className="inline-flex px-2 py-0.5 mt-1 rounded text-xs font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {assessment.result || 'Pending'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Assessment Date</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {new Date(assessment.assessment_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {assessment.remarks && (
                      <div className="pt-2 border-t text-xs text-slate-600 dark:text-slate-300">
                        <strong>Remarks:</strong> {assessment.remarks}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white dark:bg-slate-900 border border-dashed rounded-xl space-y-2">
                    <Award className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Assessment not yet recorded
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Applicant can be scheduled for written, oral, or observation evaluation in the
                      assessment desk.
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'decision' && (
              <div className="space-y-4">
                <div className="p-4 bg-card border border-border rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Admission Decision Summary
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {decision
                        ? `Status: ${decision.decision_status}`
                        : 'Pending committee / principal decision'}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/app/admissions/review')}
                    className="text-xs h-8 font-semibold gap-1"
                  >
                    View Decision Desk
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>

                {decision ? (
                  <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Decision Status</span>
                        <span className="inline-flex px-2 py-0.5 mt-1 rounded text-xs font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {decision.decision_status}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Decision Date</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {new Date(decision.decision_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Scholarship</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {decision.scholarship_percentage
                            ? `${decision.scholarship_percentage}%`
                            : 'None'}
                        </span>
                      </div>
                      {decision.offer_expiry_date && (
                        <div>
                          <span className="text-slate-400 block text-[11px]">Offer Expiry</span>
                          <span className="font-semibold text-rose-600">
                            {new Date(decision.offer_expiry_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    {decision.remarks && (
                      <div className="pt-2 border-t text-xs text-slate-600 dark:text-slate-300">
                        <strong>Remarks:</strong> {decision.remarks}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white dark:bg-slate-900 border border-dashed rounded-xl space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Decision pending
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Final committee decision (Approve, Waitlist, Reject) will be reflected once
                      review concludes.
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="space-y-4">
                <div className="p-4 bg-card border border-border rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      Admission Fee Payment Summary
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {payment?.payment_status === 'paid'
                        ? 'Admission fee has been collected and settled.'
                        : 'Pending front office fee collection.'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {payment?.payment_status === 'paid' ? (
                      <Button
                        size="sm"
                        onClick={() => setIsReceiptOpen(true)}
                        className="text-xs h-8 font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        View Receipt
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setIsCollectFeeOpen(true)}
                        className="text-xs h-8 font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Collect Fee
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate('/app/admissions/fees')}
                      className="text-xs h-8 font-semibold gap-1"
                    >
                      Fee Desk
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {payment ? (
                  <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Fee Status</span>
                        <div className="mt-1">
                          <PaymentStatusBadge status={payment.payment_status} />
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Amount Collected</span>
                        <span className="text-base font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
                          ₹{payment.amount?.toLocaleString('en-IN') ?? '0'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Payment Date</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 mt-1 block">
                          {payment.payment_date
                            ? new Date(payment.payment_date).toLocaleDateString('en-IN')
                            : '—'}
                        </span>
                      </div>

                      {payment.payment_mode && (
                        <div>
                          <span className="text-slate-400 block text-[11px]">Payment Mode</span>
                          <span className="font-bold uppercase text-slate-800 dark:text-slate-200 mt-1 block">
                            {payment.payment_mode.replace('_', ' ')}
                          </span>
                        </div>
                      )}

                      {payment.transaction_reference && (
                        <div className="col-span-2">
                          <span className="text-slate-400 block text-[11px]">
                            Transaction Reference
                          </span>
                          <span className="font-mono font-medium text-slate-700 dark:text-slate-300 mt-1 block">
                            {payment.transaction_reference}
                          </span>
                        </div>
                      )}
                    </div>

                    {payment.remarks && (
                      <div className="pt-3 border-t text-xs text-slate-600 dark:text-slate-300">
                        <strong>Remarks:</strong> {payment.remarks}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-white dark:bg-slate-900 border border-dashed rounded-xl space-y-3">
                    <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Fee payment not recorded yet
                    </div>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Admission fee can be collected directly from this sheet or in the Front Office
                      Fee desk.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setIsCollectFeeOpen(true)}
                      className="text-xs h-8 font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Collect Admission Fee Now
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-4 border-t border-border bg-card shrink-0 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenWithdraw?.(application)}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-semibold"
            >
              Withdraw Application
            </Button>

            <Button variant="outline" size="sm" onClick={onClose} className="text-xs font-semibold">
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Verification Action Dialogs */}
      <VerifyDocumentDialog
        open={!!selectedVerifyDoc}
        onOpenChange={(open) => !open && setSelectedVerifyDoc(null)}
        document={selectedVerifyDoc}
      />

      <RejectDocumentDialog
        open={!!selectedRejectDoc}
        onOpenChange={(open) => !open && setSelectedRejectDoc(null)}
        document={selectedRejectDoc}
      />

      <RequestResubmissionDialog
        open={!!selectedResubmitDoc}
        onOpenChange={(open) => !open && setSelectedResubmitDoc(null)}
        document={selectedResubmitDoc}
      />

      {/* Production Document Viewer Modal */}
      <DocumentPreviewDialog
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        document={previewDoc}
      />

      {/* Collect Fee Dialog */}
      <CollectAdmissionFeeDialog
        open={isCollectFeeOpen}
        onOpenChange={setIsCollectFeeOpen}
        application={application}
      />

      {/* View Receipt Dialog */}
      <AdmissionFeeReceiptDialog
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        application={application}
      />
    </>
  );
};
