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
import { RotateCcw, Loader2, AlertTriangle, Send } from 'lucide-react';
import { useVerifyAdmissionDocumentMutation } from '@/shared/api/admission.api';
import { toast } from '@/components/ui/use-toast';

export interface RequestResubmissionDialogProps {
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

export const RequestResubmissionDialog: React.FC<RequestResubmissionDialogProps> = ({
  open,
  onOpenChange,
  document,
  onSuccess,
}) => {
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verifyDocument, { isLoading }] = useVerifyAdmissionDocumentMutation();

  const handleRequest = async () => {
    if (!document?.document_id) return;
    if (!remarks.trim()) {
      setError('Please provide specific correction instructions for the parent.');
      return;
    }

    try {
      setError(null);
      await verifyDocument({
        documentId: document.document_id,
        applicationId: document.application_id,
        verify_status: 'resubmission_requested',
        verification_remarks: remarks.trim(),
      }).unwrap();

      toast({
        title: 'Resubmission Requested',
        description: `Correction request sent for "${document.document_name || 'Document'}".`,
      });

      setRemarks('');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast({
        title: 'Action Failed',
        description:
          err?.data?.error || err?.message || 'Failed to request resubmission. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isLoading && onOpenChange(val)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                Request Document Resubmission
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Notify applicant/parent to upload a corrected or clearer version.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-3 space-y-4">
          {document && (
            <div className="p-3.5 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 rounded-xl space-y-1.5 text-xs">
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
                Instructions / Reason for Resubmission <span className="text-purple-500">*</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Mandatory</span>
            </label>
            <Textarea
              placeholder="Provide clear guidance on what the parent must correct (e.g. Please re-scan in high resolution, ensure all 4 corners are visible, upload both sides)..."
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
            onClick={handleRequest}
            disabled={isLoading || !remarks.trim()}
            className="text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Request Resubmission
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
