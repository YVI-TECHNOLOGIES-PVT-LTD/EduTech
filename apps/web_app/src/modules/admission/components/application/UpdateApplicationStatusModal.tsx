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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateApplicationStatusMutation, ApplicationItem } from '@/shared/api/admission.api';
import { ApplicationStatusBadge, getApplicationStatusConfig } from './ApplicationStatusBadge';
import { ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

interface UpdateApplicationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: ApplicationItem | null;
  onSuccess?: () => void;
}

const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  submitted: [
    'documents_pending',
    'assessment_pending',
    'under_review',
    'rejected',
    'withdrawn',
  ],
  documents_pending: [
    'assessment_pending',
    'under_review',
    'rejected',
    'withdrawn',
  ],
  assessment_pending: [
    'under_review',
    'approved',
    'waitlisted',
    'rejected',
    'withdrawn',
  ],
  under_review: [
    'approved',
    'waitlisted',
    'rejected',
    'withdrawn',
  ],
  approved: ['withdrawn'],
  waitlisted: [
    'approved',
    'rejected',
    'withdrawn',
  ],
  rejected: ['submitted'],
  withdrawn: [],
};

export const UpdateApplicationStatusModal: React.FC<UpdateApplicationStatusModalProps> = ({
  isOpen,
  onClose,
  application,
  onSuccess,
}) => {
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [updateStatus, { isLoading }] = useUpdateApplicationStatusMutation();

  const currentStatus = (application?.status || 'submitted').toLowerCase();
  const allowedNextStatuses = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

  React.useEffect(() => {
    if (isOpen) {
      setTargetStatus(allowedNextStatuses[0] || '');
      setRemarks('');
      setErrorMsg(null);
    }
  }, [isOpen, application]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application || !targetStatus) return;

    setErrorMsg(null);
    try {
      await updateStatus({
        id: application.application_id || application.id,
        status: targetStatus,
        remarks: remarks.trim() || undefined,
      }).unwrap();

      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('[UpdateStatus Error]:', err);
      setErrorMsg(
        err?.data?.error ||
          err?.data?.message ||
          'Failed to update application status. Please try again.',
      );
    }
  };

  if (!application) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Update Application Status
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Progress application <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{application.application_number}</span> through the admission pipeline.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current vs Target Status Visualizer */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Status Progression
            </div>
            <div className="flex items-center gap-2">
              <ApplicationStatusBadge status={application.status} />
              <ArrowRight className="w-4 h-4 text-slate-400" />
              {targetStatus ? (
                <ApplicationStatusBadge status={targetStatus} />
              ) : (
                <span className="text-xs text-slate-400 italic">Select target</span>
              )}
            </div>
          </div>

          {/* Target Status Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              New Status <span className="text-red-500">*</span>
            </Label>
            {allowedNextStatuses.length > 0 ? (
              <Select value={targetStatus} onValueChange={setTargetStatus}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select target status" />
                </SelectTrigger>
                <SelectContent>
                  {allowedNextStatuses.map((st) => {
                    const cfg = getApplicationStatusConfig(st);
                    return (
                      <SelectItem key={st} value={st}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${cfg.dotClass}`} />
                          <span className="font-medium text-xs">{cfg.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
                This application is in a terminal state (<strong>{currentStatus}</strong>) and cannot be transitioned further.
              </div>
            )}
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Remarks / Justification
            </Label>
            <Textarea
              placeholder="Provide reason or operational notes for this status update..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="text-xs min-h-[80px] resize-none"
            />
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
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
              type="submit"
              disabled={isLoading || !targetStatus || allowedNextStatuses.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Updating...
                </>
              ) : (
                'Confirm Status Update'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
