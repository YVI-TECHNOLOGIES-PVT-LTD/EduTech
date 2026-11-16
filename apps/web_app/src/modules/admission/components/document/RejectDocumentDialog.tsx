import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useVerifyAdmissionDocumentMutation } from '@/shared/api/admission.api';
import { toast } from '@/components/ui/use-toast';

export interface RejectDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    document_id: string;
    application_id?: string;
    application_number?: string;
    student_name?: string;
    document_name?: string;
    original_file_name?: string | null;
  } | null;
  onSuccess?: () => void;
}

export const RejectDocumentDialog: React.FC<RejectDocumentDialogProps> = ({
  open,
  onOpenChange,
  document,
  onSuccess,
}) => {
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verifyDocument, { isLoading }] = useVerifyAdmissionDocumentMutation();

  const handleReject = async () => {
    if (!document?.document_id) return;
    if (!remarks.trim()) {
      setError('Please provide a mandatory reason for rejecting this document.');
      return;
    }

    try {
      setError(null);
      await verifyDocument({
        documentId: document.document_id,
        applicationId: document.application_id,
        verify_status: 'rejected',
        verification_remarks: remarks.trim(),
      }).unwrap();

      toast({
        title: 'Document Rejected',
        description: `"${document.document_name || 'Document'}" has been marked as rejected.`,
        variant: 'destructive',
      });

      setRemarks('');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast({
        title: 'Action Failed',
        description:
          err?.data?.error || err?.message || 'Failed to reject document. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isLoading && onOpenChange(val)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                Reject Document
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Mark document as rejected with mandatory justification.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-3 space-y-4">
          {document && (
            <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Document:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {document.document_name || 'Admission Document'}
                </span>
              </div>
              {document.student_name && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Applicant:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {document.student_name} ({document.application_number || 'App'})
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>
                Rejection Reason / Remarks <span className="text-rose-500">*</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Mandatory</span>
            </label>
            <Textarea
              placeholder="Detail why this document cannot be accepted (e.g. Document is blurred/illegible, name mismatch, missing seal)..."
              value={remarks}
              onChange={(e) => {
                setRemarks(e.target.value);
                if (error) setError(null);
              }}
              rows={3}
              className="text-xs resize-none"
              disabled={isLoading}
            />
            {error && (
              <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                {error}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setError(null);
              onOpenChange(false);
            }}
            disabled={isLoading}
            className="text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleReject}
            disabled={isLoading || !remarks.trim()}
            className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Rejecting...
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5" />
                Reject Document
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
