import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
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
import { useAssignLeadMutation, useBulkAssignLeadsMutation, LeadItem } from '@/shared/api/crm.api';
import { useGetCounsellorsQuery } from '@/shared/api/staff.api';
import { UserCheck, UserX, Loader2, AlertTriangle, Users, RefreshCw } from 'lucide-react';

interface CounsellorAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: LeadItem | null;
  leadIds?: string[];
  mode?: 'assign' | 'reassign' | 'unassign';
  onSuccess?: () => void;
}

export const CounsellorAssignmentModal: React.FC<CounsellorAssignmentModalProps> = ({
  open,
  onOpenChange,
  lead,
  leadIds = [],
  mode: initialMode = 'assign',
  onSuccess,
}) => {
  const isBulk = leadIds.length > 0 && !lead;
  const currentAssignedId = lead?.assigned_counsellor_id || '';
  const currentAssignedName = lead?.counselor?.name || 'Unassigned';

  const [mode, setMode] = useState<'assign' | 'reassign' | 'unassign'>(initialMode);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [remarks, setAssignmentRemarks] = useState<string>('');

  const {
    data: counsellors = [],
    isLoading: isLoadingCounsellors,
    isError: isErrorCounsellors,
    refetch: refetchCounsellors,
  } = useGetCounsellorsQuery(undefined, {
    skip: !open,
  });

  const [assignLead, { isLoading: isAssigningSingle }] = useAssignLeadMutation();
  const [bulkAssignLeads, { isLoading: isAssigningBulk }] = useBulkAssignLeadsMutation();

  const isSubmitting = isAssigningSingle || isAssigningBulk;

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setSelectedStaffId(lead?.assigned_counsellor_id || '');
      setAssignmentRemarks('');
    }
  }, [open, initialMode, lead]);

  const handleSubmit = async () => {
    try {
      if (mode === 'unassign') {
        if (isBulk) {
          await bulkAssignLeads({
            lead_ids: leadIds,
            assigned_counsellor_id: null,
            remarks: remarks || 'Bulk unassigned counsellor',
          }).unwrap();
          toast.success(`Unassigned counsellor from ${leadIds.length} leads`);
        } else if (lead) {
          await assignLead({
            id: lead.lead_id,
            assigned_counsellor_id: null,
            remarks: remarks || 'Unassigned counsellor',
          }).unwrap();
          toast.success(`Unassigned counsellor from lead ${lead.lead_number}`);
        }
      } else {
        if (!selectedStaffId) {
          toast.error('Please select a counsellor');
          return;
        }

        const selectedCounsellor = counsellors.find(
          (c) => c.staff_id === selectedStaffId || c.id === selectedStaffId,
        );
        const counsellorName = selectedCounsellor
          ? selectedCounsellor.display_name ||
            `${selectedCounsellor.first_name} ${selectedCounsellor.last_name || ''}`.trim()
          : 'Counsellor';

        if (isBulk) {
          await bulkAssignLeads({
            lead_ids: leadIds,
            assigned_counsellor_id: selectedStaffId,
            remarks: remarks || undefined,
          }).unwrap();
          toast.success(`Assigned ${counsellorName} to ${leadIds.length} leads`);
        } else if (lead) {
          await assignLead({
            id: lead.lead_id,
            assigned_counsellor_id: selectedStaffId,
            remarks: remarks || undefined,
          }).unwrap();
          toast.success(`Assigned ${counsellorName} to ${lead.student_name}`);
        }
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.data?.error || err?.message || 'Failed to update assignment';
      toast.error(msg);
    }
  };

  const getTitle = () => {
    if (mode === 'unassign') {
      return isBulk
        ? `Unassign Counsellor (${leadIds.length} Leads)`
        : `Unassign Counsellor from ${lead?.student_name || 'Lead'}`;
    }
    if (mode === 'reassign' || (lead?.assigned_counsellor_id && !isBulk)) {
      return isBulk
        ? `Reassign Counsellor (${leadIds.length} Leads)`
        : `Reassign Counsellor for ${lead?.student_name || 'Lead'}`;
    }
    return isBulk
      ? `Assign Counsellor (${leadIds.length} Leads)`
      : `Assign Counsellor to ${lead?.student_name || 'Lead'}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                mode === 'unassign'
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-600'
                  : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600'
              }`}
            >
              {mode === 'unassign' ? (
                <UserX className="w-4 h-4" />
              ) : isBulk ? (
                <Users className="w-4 h-4" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
            </div>
            <DialogTitle className="text-base font-bold">{getTitle()}</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {isBulk
              ? `Update counsellor ownership for ${leadIds.length} selected leads.`
              : `Manage counsellor allocation and accountability for lead ${lead?.lead_number || ''}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Mode Switcher */}
          {!isBulk && lead?.assigned_counsellor_id && (
            <div className="flex rounded-lg bg-muted p-1 gap-1">
              <button
                type="button"
                onClick={() => setMode('reassign')}
                className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${
                  mode !== 'unassign'
                    ? 'bg-background shadow text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Reassign
              </button>
              <button
                type="button"
                onClick={() => setMode('unassign')}
                className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${
                  mode === 'unassign'
                    ? 'bg-background shadow text-amber-600'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Unassign
              </button>
            </div>
          )}

          {/* Current Assignment Badge */}
          {!isBulk && lead && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Current Counsellor</span>
              <span className="font-bold text-foreground">
                {lead.counselor?.name ? (
                  <span className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    {lead.counselor.name}
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">Unassigned</span>
                )}
              </span>
            </div>
          )}

          {/* Counsellor Selection Dropdown */}
          {mode !== 'unassign' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">
                  Select Counsellor <span className="text-red-500">*</span>
                </Label>
                {isErrorCounsellors && (
                  <button
                    type="button"
                    onClick={() => refetchCounsellors()}
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry
                  </button>
                )}
              </div>

              {isLoadingCounsellors ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-3 px-3 rounded-md bg-muted/40 border border-border">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  Loading counsellors...
                </div>
              ) : isErrorCounsellors ? (
                <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
                  <span>Unable to load counsellors. Try again.</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => refetchCounsellors()}
                    className="h-7 text-xs text-red-700 hover:bg-red-100 dark:hover:bg-red-900"
                  >
                    Retry
                  </Button>
                </div>
              ) : counsellors.length === 0 ? (
                <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-700 dark:text-amber-300">
                  No active counsellors available.
                </div>
              ) : (
                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                  <SelectTrigger className="w-full h-10 text-xs">
                    <SelectValue placeholder="Choose a counsellor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {counsellors.map((c) => (
                      <SelectItem
                        key={c.staff_id || c.id}
                        value={c.staff_id || c.id}
                        className="text-xs"
                      >
                        <div className="flex items-center justify-between gap-3 w-full">
                          <span className="font-bold">
                            {c.display_name || `${c.first_name} ${c.last_name || ''}`.trim()}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {c.email ? `${c.email} • ` : ''}
                            {c.employee_code || c.role || 'Counsellor'}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs flex gap-2.5 items-start">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900 dark:text-amber-300">Confirm Unassignment</p>
                <p className="text-amber-700 dark:text-amber-400 text-[11px] mt-0.5 leading-relaxed">
                  {isBulk
                    ? `Are you sure you want to remove the assigned counsellor from all ${leadIds.length} selected leads? These leads will return to the unassigned pool.`
                    : `Are you sure you want to unassign ${currentAssignedName}? This lead will return to the unassigned queue.`}
                </p>
              </div>
            </div>
          )}

          {/* Remarks Field */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">
              {mode === 'unassign' ? 'Reason for Unassignment' : 'Assignment Notes (Optional)'}
            </Label>
            <Textarea
              value={remarks}
              onChange={(e) => setAssignmentRemarks(e.target.value)}
              placeholder={
                mode === 'unassign'
                  ? 'Enter reason for unassigning (optional)...'
                  : 'Add instructions, handover notes, or special requirements for counsellor...'
              }
              className="text-xs min-h-[70px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || (mode !== 'unassign' && !selectedStaffId)}
            className={`text-xs font-bold gap-1.5 ${
              mode === 'unassign'
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {mode === 'unassign' ? 'Unassign Counsellor' : 'Save Assignment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
