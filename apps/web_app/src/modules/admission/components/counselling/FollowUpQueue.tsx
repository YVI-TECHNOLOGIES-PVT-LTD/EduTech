import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  useGetDueFollowUpsQuery,
  useUpdateLeadActivityMutation,
  LeadActivityItem,
} from '@/shared/api/crm.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Phone,
  Eye,
  Activity,
  Loader2,
  RotateCcw,
  User,
  ArrowRight,
} from 'lucide-react';

interface FollowUpQueueProps {
  onViewLead: (leadId: string) => void;
  onLogActivity?: (leadId: string) => void;
}

export const FollowUpQueue: React.FC<FollowUpQueueProps> = ({ onViewLead, onLogActivity }) => {
  const {
    data: followUpsData,
    isLoading,
    isError,
    refetch,
  } = useGetDueFollowUpsQuery({
    limit: 100,
  });

  const [updateActivity, { isLoading: isUpdating }] = useUpdateLeadActivityMutation();

  // Completion Dialog State
  const [completingActivity, setCompletingActivity] = useState<LeadActivityItem | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');

  // Reschedule Dialog State
  const [reschedulingActivity, setReschedulingActivity] = useState<LeadActivityItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleNotes, setRescheduleNotes] = useState('');

  // Active Tab State for FollowUp queues
  const [activeQueueTab, setActiveQueueTab] = useState<'overdue' | 'today' | 'upcoming'>('today');

  // Date-safe classification
  const classifiedFollowUps = useMemo(() => {
    const items = followUpsData?.items || [];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const overdue: LeadActivityItem[] = [];
    const today: LeadActivityItem[] = [];
    const upcoming: LeadActivityItem[] = [];

    items.forEach((item) => {
      if (!item.next_followup_date) return;
      if (item.status === 'completed' || item.status === 'cancelled') return;

      const fDate = new Date(item.next_followup_date);

      if (fDate < todayStart) {
        overdue.push(item);
      } else if (fDate >= todayStart && fDate <= todayEnd) {
        today.push(item);
      } else {
        upcoming.push(item);
      }
    });

    return { overdue, today, upcoming };
  }, [followUpsData]);

  // Handle Completion
  const handleCompleteSubmit = async () => {
    if (!completingActivity) return;
    try {
      const combinedNotes = completionNotes.trim()
        ? completingActivity.notes
          ? `${completingActivity.notes}\n[Completed]: ${completionNotes.trim()}`
          : `[Completed]: ${completionNotes.trim()}`
        : completingActivity.notes;

      await updateActivity({
        activityId: completingActivity.activity_id,
        leadId: completingActivity.lead_id,
        data: {
          status: 'completed',
          notes: combinedNotes,
        },
      }).unwrap();

      toast.success('Follow-up marked as completed');
      setCompletingActivity(null);
      setCompletionNotes('');
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to complete follow-up');
    }
  };

  // Handle Reschedule
  const handleRescheduleSubmit = async () => {
    if (!reschedulingActivity) return;
    if (!rescheduleDate) {
      toast.error('Please select a new follow-up date');
      return;
    }

    const selectedD = new Date(rescheduleDate);
    if (isNaN(selectedD.getTime())) {
      toast.error('Invalid date selected');
      return;
    }

    try {
      const combinedNotes = rescheduleNotes.trim()
        ? reschedulingActivity.notes
          ? `${reschedulingActivity.notes}\n[Rescheduled to ${selectedD.toLocaleDateString()}]: ${rescheduleNotes.trim()}`
          : `[Rescheduled to ${selectedD.toLocaleDateString()}]: ${rescheduleNotes.trim()}`
        : reschedulingActivity.notes;

      await updateActivity({
        activityId: reschedulingActivity.activity_id,
        leadId: reschedulingActivity.lead_id,
        data: {
          next_followup_date: selectedD.toISOString(),
          status: 'scheduled',
          notes: combinedNotes,
        },
      }).unwrap();

      toast.success('Follow-up rescheduled successfully');
      setReschedulingActivity(null);
      setRescheduleDate('');
      setRescheduleNotes('');
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to reschedule follow-up');
    }
  };

  const getLeadName = (item: LeadActivityItem) => {
    return item.leads?.student_first_name
      ? `${item.leads.student_first_name} ${item.leads.student_last_name || ''}`.trim()
      : item.leads?.student_name || item.lead?.student_name || 'Lead Contact';
  };

  const getLeadNumber = (item: LeadActivityItem) => {
    return item.leads?.lead_number || item.lead?.lead_number || 'LEAD';
  };

  const getContactPhone = (item: LeadActivityItem) => {
    return item.leads?.contact_phone || item.lead?.contact_phone || '';
  };

  const currentList =
    activeQueueTab === 'overdue'
      ? classifiedFollowUps.overdue
      : activeQueueTab === 'today'
        ? classifiedFollowUps.today
        : classifiedFollowUps.upcoming;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header & Section Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div>
          <h3 className="text-sm font-black text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Admission Follow-up Management
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track, complete, and reschedule time-critical parent & student follow-ups.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveQueueTab('overdue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeQueueTab === 'overdue'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Overdue</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeQueueTab === 'overdue'
                  ? 'bg-white/20 text-white'
                  : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
              }`}
            >
              {classifiedFollowUps.overdue.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveQueueTab('today')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeQueueTab === 'today'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Today</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeQueueTab === 'today'
                  ? 'bg-white/20 text-white'
                  : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
              }`}
            >
              {classifiedFollowUps.today.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveQueueTab('upcoming')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeQueueTab === 'upcoming'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Upcoming</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeQueueTab === 'upcoming'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {classifiedFollowUps.upcoming.length}
            </span>
          </button>
        </div>
      </div>

      {/* Queue List Content */}
      {isLoading ? (
        <div className="py-10 text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
          <p className="text-xs text-muted-foreground font-medium">Loading follow-ups queue...</p>
        </div>
      ) : isError ? (
        <div className="py-8 text-center space-y-2 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl p-4">
          <AlertCircle className="w-6 h-6 mx-auto text-rose-500" />
          <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
            Failed to load follow-up items
          </p>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs h-7">
            <RotateCcw className="w-3 h-3 mr-1" /> Retry
          </Button>
        </div>
      ) : currentList.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-border rounded-xl space-y-1.5">
          <CheckCircle2 className="w-8 h-8 mx-auto text-muted-foreground/40" />
          <p className="text-xs font-bold text-foreground">
            No {activeQueueTab} follow-ups pending
          </p>
          <p className="text-[11px] text-muted-foreground">
            {activeQueueTab === 'overdue'
              ? 'Great job! No follow-up deadlines have been breached.'
              : activeQueueTab === 'today'
                ? 'All of today’s follow-up tasks are cleared.'
                : 'No upcoming follow-up tasks currently scheduled.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {currentList.map((item) => {
            const studentName = getLeadName(item);
            const leadNumber = getLeadNumber(item);
            const phone = getContactPhone(item);
            const fDate = item.next_followup_date ? new Date(item.next_followup_date) : null;

            return (
              <div
                key={item.activity_id}
                className="p-3.5 rounded-xl border border-border bg-card/70 hover:bg-card hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-black font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {leadNumber}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[9px] font-bold uppercase px-1.5 py-0"
                        >
                          {item.activity_type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <h4
                        className="text-xs font-black text-foreground hover:text-indigo-600 transition-colors cursor-pointer"
                        onClick={() => onViewLead(item.lead_id)}
                      >
                        {studentName}
                      </h4>
                    </div>

                    {fDate && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap ${
                          activeQueueTab === 'overdue'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : activeQueueTab === 'today'
                              ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {fDate.toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    )}
                  </div>

                  {/* Notes / Details */}
                  {item.notes && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed bg-muted/40 p-2 rounded-lg">
                      {item.notes}
                    </p>
                  )}

                  {/* Phone and Staff Contact */}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                    {phone ? (
                      <a
                        href={`tel:${phone}`}
                        className="font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        {phone}
                      </a>
                    ) : (
                      <span className="italic">No phone listed</span>
                    )}

                    {item.users_lead_activities_created_byTousers && (
                      <span className="truncate max-w-[120px]">
                        By: {item.users_lead_activities_created_byTousers.first_name || 'Staff'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Action Bar */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-border/60">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] font-bold flex-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-1"
                    onClick={() => {
                      setCompletingActivity(item);
                      setCompletionNotes('');
                    }}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Complete
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] font-bold flex-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 gap-1"
                    onClick={() => {
                      setReschedulingActivity(item);
                      setRescheduleDate(
                        item.next_followup_date
                          ? new Date(item.next_followup_date).toISOString().substring(0, 10)
                          : '',
                      );
                      setRescheduleNotes('');
                    }}
                  >
                    <Calendar className="w-3 h-3" />
                    Reschedule
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[10px] font-bold text-muted-foreground hover:text-indigo-600"
                    onClick={() => onViewLead(item.lead_id)}
                    title="View Lead Details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* COMPLETE FOLLOW-UP DIALOG */}
      <Dialog
        open={!!completingActivity}
        onOpenChange={(open) => !open && setCompletingActivity(null)}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <DialogTitle className="text-base font-bold">Complete Follow-up</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Record outcome notes and mark this follow-up as completed for{' '}
              <span className="font-bold text-foreground">
                {completingActivity ? getLeadName(completingActivity) : 'Lead'}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Completion Notes / Outcome</Label>
              <Textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Document parent discussion, answers given, interest level, or next step..."
                className="text-xs min-h-[90px] resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCompletingActivity(null)}
              disabled={isUpdating}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCompleteSubmit}
              disabled={isUpdating}
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save & Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RESCHEDULE FOLLOW-UP DIALOG */}
      <Dialog
        open={!!reschedulingActivity}
        onOpenChange={(open) => !open && setReschedulingActivity(null)}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <DialogTitle className="text-base font-bold">Reschedule Follow-up</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Select a new follow-up date and add any rescheduling remarks for{' '}
              <span className="font-bold text-foreground">
                {reschedulingActivity ? getLeadName(reschedulingActivity) : 'Lead'}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">
                New Follow-up Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={rescheduleDate}
                min={new Date().toISOString().substring(0, 10)}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Reschedule Note (Optional)</Label>
              <Textarea
                value={rescheduleNotes}
                onChange={(e) => setRescheduleNotes(e.target.value)}
                placeholder="Reason for postponing or parent requested callback time..."
                className="text-xs min-h-[75px] resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReschedulingActivity(null)}
              disabled={isUpdating}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleRescheduleSubmit}
              disabled={isUpdating || !rescheduleDate}
              className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
            >
              {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save New Date
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
