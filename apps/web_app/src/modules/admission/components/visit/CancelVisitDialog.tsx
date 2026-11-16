import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateVisitStatusMutation, LeadVisitItem } from '@/shared/api/crm.api';
import { XCircle, Loader2, User, Calendar, AlertTriangle } from 'lucide-react';

interface CancelVisitDialogProps {
  visit: LeadVisitItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CancelVisitDialog: React.FC<CancelVisitDialogProps> = ({
  visit,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [remarks, setRemarks] = useState('');
  const [updateVisitStatus, { isLoading }] = useUpdateVisitStatusMutation();

  useEffect(() => {
    if (open) {
      setRemarks('');
    }
  }, [open]);

  if (!visit) return null;

  const studentName =
    visit.leads?.student_first_name
      ? `${visit.leads.student_first_name} ${visit.leads.student_last_name || ''}`.trim()
      : 'Applicant';
  const leadNumber = visit.leads?.lead_number || 'N/A';

  const handleCancel = async () => {
    try {
      await updateVisitStatus({
        visitId: visit.visit_id,
        leadId: visit.lead_id,
        status: 'cancelled',
        remarks: remarks.trim() ? `Cancelled: ${remarks.trim()}` : 'Visit cancelled.',
      }).unwrap();

      toast.success('Visit cancelled.');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.data?.error || err?.message || 'Failed to cancel visit';
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-card border-border rounded-2xl">
        <div className="p-6 bg-slate-950 text-white border-b border-slate-900">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-900/60 text-red-300 text-xs font-bold border border-red-700/50 mb-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Cancel Visit</span>
          </div>
          <DialogTitle className="text-xl font-extrabold text-white tracking-tight">
            Cancel Scheduled Visit
          </DialogTitle>
          <DialogDescription className="text-slate-300 text-xs mt-1">
            This will mark the scheduled visit as cancelled.
          </DialogDescription>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 rounded-xl border border-red-100 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-xs font-bold text-foreground">{studentName}</span>
              </div>
              <span className="text-xs font-mono font-bold text-muted-foreground">{leadNumber}</span>
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t border-red-200/50 dark:border-red-800/40">
              <span>Date:</span>
              <span className="font-semibold text-foreground">
                {new Date(visit.scheduled_at).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              Reason for Cancellation (Optional)
            </Label>
            <Textarea
              placeholder="E.g. Guardian called to cancel, family out of town..."
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="text-xs rounded-xl bg-background border-border resize-none"
            />
          </div>

          <DialogFooter className="pt-2 flex items-center justify-end gap-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="rounded-xl text-xs h-9"
            >
              Keep Visit
            </Button>
            <Button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="rounded-xl text-xs h-9 font-bold bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
