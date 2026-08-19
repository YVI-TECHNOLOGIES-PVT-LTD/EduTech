import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateApplicationStatusMutation, ApplicationItem } from '@/shared/api/admission.api';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface WithdrawApplicationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  application: ApplicationItem | null;
  onSuccess?: () => void;
}

export const WithdrawApplicationDialog: React.FC<WithdrawApplicationDialogProps> = ({
  isOpen,
  onClose,
  application,
  onSuccess,
}) => {
  const [remarks, setRemarks] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [updateStatus, { isLoading }] = useUpdateApplicationStatusMutation();

  const handleWithdraw = async () => {
    if (!application) return;

    setErrorMsg(null);
    try {
      await updateStatus({
        id: application.application_id || application.id,
        status: 'withdrawn',
        remarks: remarks.trim() || 'Application withdrawn by Front Office staff.',
      }).unwrap();

      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('[WithdrawApplication Error]:', err);
      setErrorMsg(
        err?.data?.error ||
          err?.data?.message ||
          'Failed to withdraw application. Please check status rules.',
      );
    }
  };

  if (!application) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center mb-1 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
            Withdraw Application
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Are you sure you want to withdraw application <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{application.application_number}</span> for <strong>{application.student_name || application.lead?.student_name || 'Applicant'}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300">
            Withdrawing will transition the application status to <strong>Withdrawn</strong>. This retains historical audit and prevents downstream processing.
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Withdrawal Reason / Remarks
            </Label>
            <Textarea
              placeholder="Provide reason for withdrawal (e.g. parent relocated, chose another school, etc.)..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="text-xs min-h-[70px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="pt-3 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs h-9"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleWithdraw}
            disabled={isLoading}
            className="text-xs h-9 font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Withdrawing...
              </>
            ) : (
              'Confirm Withdrawal'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
