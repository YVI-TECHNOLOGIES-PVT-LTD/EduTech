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
import { CheckCircle2, Loader2, AlertCircle, FileCheck } from 'lucide-react';
import { useVerifyAdmissionDocumentMutation } from '@/shared/api/admission.api';
import { toast } from '@/components/ui/use-toast';

export interface VerifyDocumentDialogProps {
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

export const VerifyDocumentDialog: React.FC<VerifyDocumentDialogProps> = ({
  open,
  onOpenChange,
  document,
  onSuccess,
}) => {
  const [remarks, setRemarks] = useState('');
  const [verifyDocument, { isLoading }] = useVerifyAdmissionDocumentMutation();

  const handleVerify = async () => {
    if (!document?.document_id) return;

    try {
      await verifyDocument({
        documentId: document.document_id,
        applicationId: document.application_id,
        verify_status: 'verified',
        verification_remarks: remarks.trim() || 'Document verified by front office staff',
      }).unwrap();

      toast({
        title: 'Document Verified',
        description: `"${document.document_name || 'Document'}" has been successfully marked as verified.`,
      });

      setRemarks('');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast({
        title: 'Verification Failed',
        description:
          err?.data?.error || err?.message || 'Failed to verify document. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isLoading && onOpenChange(val)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                Verify Document
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Confirm validity and approve applicant document.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-3 space-y-4">
          {document && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Document:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {document.document_name || 'Admission Document'}
                </span>
              </div>
              {document.original_file_name && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">File:</span>
                  <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                    {document.original_file_name}
                  </span>
                </div>
              )}
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
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Verification Remarks <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <Textarea
              placeholder="Add any verification observations or notes (e.g. Original verified, legible)..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              className="text-xs resize-none"
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleVerify}
            disabled={isLoading}
            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirm Verification
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
