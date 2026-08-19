import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  FileText,
  User,
  Calendar,
  Clock,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  FileCheck,
  AlertCircle,
  Loader2,
  HardDrive,
  Copy,
  Check,
} from 'lucide-react';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { VerifyDocumentDialog } from './VerifyDocumentDialog';
import { RejectDocumentDialog } from './RejectDocumentDialog';
import { RequestResubmissionDialog } from './RequestResubmissionDialog';
import { useLazyGetDocumentSignedUrlQuery } from '@/shared/api/admission.api';
import { toast } from '@/components/ui/use-toast';

export interface DocumentReviewData {
  document_id: string;
  application_id: string;
  application_number: string;
  student_name: string;
  lead_number?: string | null;
  grade_name?: string | null;
  academic_year_name?: string | null;
  document_type_id: string;
  document_name: string;
  original_file_name?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  verify_status: string;
  verification_remarks?: string | null;
  uploaded_at: string;
  verified_by?: string | null;
  verified_at?: string | null;
  is_mandatory?: boolean;
  contact_phone?: string | null;
  contact_email?: string | null;
}

interface DocumentReviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentReviewData | null;
  onActionComplete?: () => void;
}

export const DocumentReviewSheet: React.FC<DocumentReviewSheetProps> = ({
  open,
  onOpenChange,
  document,
  onActionComplete,
}) => {
  const [getSignedUrl, { isLoading: isFetchingUrl }] = useLazyGetDocumentSignedUrlQuery();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Dialog triggers
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [resubmitOpen, setResubmitOpen] = useState(false);

  if (!document) return null;

  const handleCopyAppNumber = () => {
    if (!document.application_number) return;
    navigator.clipboard.writeText(document.application_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFetchPreview = async () => {
    try {
      const res = await getSignedUrl(document.document_id).unwrap();
      if (res.signed_url) {
        setPreviewUrl(res.signed_url);
        window.open(res.signed_url, '_blank', 'noopener,noreferrer');
      } else {
        toast({
          title: 'Document URL unavailable',
          description: 'Could not generate secure signed URL for this document.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Preview Failed',
        description: err?.data?.error || err?.message || 'Failed to generate secure preview URL.',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isVerified = document.verify_status === 'verified';
  const isRejected = document.verify_status === 'rejected';
  const isResubmission = document.verify_status === 'resubmission_requested';

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col h-full bg-slate-50 dark:bg-slate-950">
          {/* Header */}
          <div className="p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800">
                  {document.application_number}
                </span>
                <button
                  type="button"
                  onClick={handleCopyAppNumber}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                  title="Copy Application Number"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <DocumentStatusBadge status={document.verify_status} />
            </div>

            <SheetTitle className="text-lg font-black text-slate-900 dark:text-white">
              {document.document_name}
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-500">
              Uploaded for applicant <strong>{document.student_name}</strong>
            </SheetDescription>
          </div>

          {/* Scrollable Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Applicant Summary */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Applicant Information
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Student Name</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {document.student_name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Grade Applying</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {document.grade_name || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Academic Year</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {document.academic_year_name || '—'}
                  </span>
                </div>
                {document.lead_number && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Lead Reference</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      #{document.lead_number}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Document Specifications & Metadata */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Document Metadata
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Requirement Type</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {document.is_mandatory ? (
                      <span className="text-rose-600 dark:text-rose-400 font-bold">
                        Mandatory Required
                      </span>
                    ) : (
                      <span className="text-slate-600 dark:text-slate-400 font-medium">
                        Optional Supporting
                      </span>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Uploaded At</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {document.uploaded_at ? new Date(document.uploaded_at).toLocaleString() : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Original File Name</span>
                  <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200 truncate block">
                    {document.original_file_name || 'file_uploaded'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">File Size & Format</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatFileSize(document.file_size)}{' '}
                    {document.mime_type ? `(${document.mime_type})` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Secure Preview / Download Card */}
            <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/60 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    Secure Document Storage
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pre-signed temporary token access
                  </div>
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={handleFetchPreview}
                disabled={isFetchingUrl}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shrink-0 shadow-sm"
              >
                {isFetchingUrl ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating URL...
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    Preview / Open
                  </>
                )}
              </Button>
            </div>

            {/* Verification Status & History Remarks */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Verification Status & Remarks
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 font-medium">Current Status:</span>
                  <DocumentStatusBadge status={document.verify_status} />
                </div>

                {document.verified_at && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500 font-medium">Verified Timestamp:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(document.verified_at).toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Staff Remarks / Reason
                  </span>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-slate-700 dark:text-slate-300 italic">
                    {document.verification_remarks || 'No remarks recorded yet.'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Action Footer */}
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs font-semibold"
            >
              Close
            </Button>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setResubmitOpen(true)}
                className="text-xs font-bold text-purple-700 border-purple-200 hover:bg-purple-50 dark:text-purple-300 dark:border-purple-800 dark:hover:bg-purple-950/50 gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Request Correction
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRejectOpen(true)}
                className="text-xs font-bold text-rose-700 border-rose-200 hover:bg-rose-50 dark:text-rose-300 dark:border-rose-800 dark:hover:bg-rose-950/50 gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => setVerifyOpen(true)}
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verify Document
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Action Dialogs */}
      <VerifyDocumentDialog
        open={verifyOpen}
        onOpenChange={setVerifyOpen}
        document={document}
        onSuccess={() => {
          onActionComplete?.();
          onOpenChange(false);
        }}
      />

      <RejectDocumentDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        document={document}
        onSuccess={() => {
          onActionComplete?.();
          onOpenChange(false);
        }}
      />

      <RequestResubmissionDialog
        open={resubmitOpen}
        onOpenChange={setResubmitOpen}
        document={document}
        onSuccess={() => {
          onActionComplete?.();
          onOpenChange(false);
        }}
      />
    </>
  );
};
