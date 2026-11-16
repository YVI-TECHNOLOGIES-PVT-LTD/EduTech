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
import { CheckCircle2, Loader2, User, Calendar, MapPin, Video } from 'lucide-react';

interface CompleteVisitDialogProps {
  visit: LeadVisitItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CompleteVisitDialog: React.FC<CompleteVisitDialogProps> = ({
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

  const handleComplete = async () => {
    try {
      await updateVisitStatus({
        visitId: visit.visit_id,
        leadId: visit.lead_id,
        status: 'completed',
        remarks: remarks.trim() || visit.remarks || 'Campus visit completed successfully.',
      }).unwrap();

      toast.success('Visit marked as completed.');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.data?.error || err?.message || 'Failed to complete visit';
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-card border-border rounded-2xl">
        <div className="p-6 bg-slate-950 text-white border-b border-slate-900">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 text-xs font-bold border border-emerald-700/50 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Complete Visit</span>
          </div>
          <DialogTitle className="text-xl font-extrabold text-white tracking-tight">
            Mark Visit as Completed
          </DialogTitle>
          <DialogDescription className="text-slate-300 text-xs mt-1">
            Confirm that the campus tour or counselling session has concluded.
          </DialogDescription>
        </div>

        <div className="p-6 space-y-4">
          {/* Visit details summary */}
          <div className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-foreground">{studentName}</span>
              </div>
              <span className="text-xs font-mono font-bold text-muted-foreground">{leadNumber}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/50 dark:border-emerald-800/40 text-[11px]">
              <div className="flex items-center gap-1 text-muted-foreground">
                {visit.visit_type === 'virtual' ? (
                  <Video className="w-3.5 h-3.5 text-indigo-500" />
                ) : (
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                )}
                <span className="capitalize">{visit.visit_type} Session</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground justify-end">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(visit.scheduled_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Outcome Notes / Remarks */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              Outcome Remarks & Feedback (Optional)
            </Label>
            <Textarea
              placeholder="E.g. Parent visited campus, highly impressed with science lab, interested in enrolling..."
              rows={3}
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
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleComplete}
              disabled={isLoading}
              className="rounded-xl text-xs h-9 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Confirm Completed
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
