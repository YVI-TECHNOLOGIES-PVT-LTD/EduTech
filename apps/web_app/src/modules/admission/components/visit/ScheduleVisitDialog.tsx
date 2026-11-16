import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useScheduleVisitMutation,
  useGetLeadsQuery,
  VisitType,
  LeadItem,
} from '@/shared/api/crm.api';
import { useGetStaffListQuery } from '@/shared/api/staff.api';
import { Calendar, MapPin, Video, Loader2, User, Search } from 'lucide-react';

const formSchema = z.object({
  lead_id: z.string().min(1, 'Please select a lead'),
  visit_type: z.enum(['campus', 'virtual'] as const),
  scheduled_date: z.string().min(1, 'Date is required'),
  scheduled_time: z.string().min(1, 'Time is required'),
  staff_id: z.string().optional().nullable(),
  meeting_link: z.string().url('Invalid URL format').optional().nullable().or(z.literal('')),
  remarks: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface ScheduleVisitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: string;
  leadNumber?: string;
  studentName?: string;
  onSuccess?: () => void;
}

export const ScheduleVisitDialog: React.FC<ScheduleVisitDialogProps> = ({
  open,
  onOpenChange,
  leadId,
  leadNumber,
  studentName,
  onSuccess,
}) => {
  const [leadSearchText, setLeadSearchText] = useState('');
  const { data: staffList = [] } = useGetStaffListQuery();
  const { data: leadsResponse, isLoading: isLoadingLeads } = useGetLeadsQuery(
    leadId ? undefined : { searchText: leadSearchText || undefined, pageSize: 20 },
    { skip: !!leadId || !open },
  );

  const leads = leadsResponse?.data || [];

  const [scheduleVisit, { isLoading }] = useScheduleVisitMutation();

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const defaultDate = tomorrow.toISOString().substring(0, 10);
  const defaultTime = '10:30';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lead_id: leadId || '',
      visit_type: 'campus',
      scheduled_date: defaultDate,
      scheduled_time: defaultTime,
      staff_id: null,
      meeting_link: '',
      remarks: '',
    },
  });

  const selectedVisitType = watch('visit_type');
  const selectedLeadId = watch('lead_id');

  useEffect(() => {
    if (open) {
      if (leadId) {
        setValue('lead_id', leadId);
      }
    } else {
      reset({
        lead_id: leadId || '',
        visit_type: 'campus',
        scheduled_date: defaultDate,
        scheduled_time: defaultTime,
        staff_id: null,
        meeting_link: '',
        remarks: '',
      });
      setLeadSearchText('');
    }
  }, [open, leadId, setValue, reset, defaultDate]);

  const onSubmit = async (values: FormValues) => {
    try {
      const scheduledDateTime = new Date(`${values.scheduled_date}T${values.scheduled_time}:00`);
      if (isNaN(scheduledDateTime.getTime())) {
        toast.error('Invalid date or time');
        return;
      }

      await scheduleVisit({
        lead_id: values.lead_id,
        visit_type: values.visit_type as VisitType,
        scheduled_at: scheduledDateTime.toISOString(),
        staff_id: values.staff_id || null,
        meeting_link: values.meeting_link || null,
        remarks: values.remarks || null,
      }).unwrap();

      toast.success(
        `${values.visit_type === 'virtual' ? 'Virtual Counselling' : 'Campus Visit'} scheduled successfully.`,
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.data?.error || err?.message || 'Failed to schedule visit';
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-card border-border rounded-2xl">
        <div className="p-6 bg-slate-950 text-white border-b border-slate-900 relative">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 text-xs font-bold border border-indigo-700/50 mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>Front Office Scheduling</span>
          </div>
          <DialogTitle className="text-xl font-extrabold text-white tracking-tight">
            Schedule Campus Visit / Counselling
          </DialogTitle>
          <DialogDescription className="text-slate-300 text-xs mt-1">
            Book an in-person campus tour or virtual counselling session with a guardian.
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Lead Selection (if not fixed) */}
          {leadId ? (
            <div className="p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    {studentName || 'Selected Lead'}
                  </p>
                  <p className="text-[11px] font-mono text-muted-foreground">{leadNumber}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200">
                Target Lead
              </span>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground">
                  Select Lead / Applicant <span className="text-red-500">*</span>
                </Label>
                {isLoadingLeads && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Searching...
                  </span>
                )}
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={leadSearchText}
                  onChange={(e) => setLeadSearchText(e.target.value)}
                  placeholder="Search by student, lead #, phone..."
                  className="h-8 pl-8 text-xs rounded-xl bg-muted/40 border-border mb-1.5"
                />
              </div>
              <Select
                value={selectedLeadId || ''}
                onValueChange={(val) => setValue('lead_id', val, { shouldValidate: true })}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl bg-background border-border">
                  <SelectValue placeholder="Choose a lead for this visit" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {leads.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      No leads found matching &quot;{leadSearchText}&quot;
                    </div>
                  ) : (
                    leads.map((l: LeadItem) => (
                      <SelectItem key={l.lead_id} value={l.lead_id} className="text-xs">
                        <span className="font-bold">{l.student_name}</span>
                        <span className="font-mono text-muted-foreground ml-2">({l.lead_number})</span>
                        {l.contact_phone && (
                          <span className="text-muted-foreground ml-2">· {l.contact_phone}</span>
                        )}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.lead_id && (
                <p className="text-[11px] font-medium text-red-500">{errors.lead_id.message}</p>
              )}
            </div>
          )}

          {/* Visit Type Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              Visit Type <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue('visit_type', 'campus')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  selectedVisitType === 'campus'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-sm'
                    : 'border-border bg-card hover:bg-muted/50 text-foreground'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    selectedVisitType === 'campus'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">Campus Tour</p>
                  <p className="text-[10px] text-muted-foreground">In-person walk-in</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setValue('visit_type', 'virtual')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  selectedVisitType === 'virtual'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-sm'
                    : 'border-border bg-card hover:bg-muted/50 text-foreground'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    selectedVisitType === 'virtual'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">Virtual Session</p>
                  <p className="text-[10px] text-muted-foreground">Online counselling</p>
                </div>
              </button>
            </div>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                {...register('scheduled_date')}
                className="h-10 text-xs rounded-xl bg-background border-border"
              />
              {errors.scheduled_date && (
                <p className="text-[11px] font-medium text-red-500">
                  {errors.scheduled_date.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Time <span className="text-red-500">*</span>
              </Label>
              <Input
                type="time"
                {...register('scheduled_time')}
                className="h-10 text-xs rounded-xl bg-background border-border"
              />
              {errors.scheduled_time && (
                <p className="text-[11px] font-medium text-red-500">
                  {errors.scheduled_time.message}
                </p>
              )}
            </div>
          </div>

          {/* Assigned Staff */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Assigned Counsellor / Staff</Label>
            <Select
              value={watch('staff_id') || 'unassigned'}
              onValueChange={(val) =>
                setValue('staff_id', val === 'unassigned' ? null : val, { shouldValidate: true })
              }
            >
              <SelectTrigger className="h-10 text-xs rounded-xl bg-background border-border">
                <SelectValue placeholder="Assign a counsellor (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned" className="text-xs text-muted-foreground">
                  Unassigned
                </SelectItem>
                {staffList.map((s: any) => (
                  <SelectItem key={s.staff_id || s.id} value={s.staff_id || s.id} className="text-xs">
                    {s.name ||
                      (s.first_name ? `${s.first_name} ${s.last_name || ''}`.trim() : s.employee_code)}
                    {s.designation ? ` (${s.designation})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Meeting Link (for virtual) */}
          {selectedVisitType === 'virtual' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Meeting Link / URL</Label>
              <Input
                placeholder="https://meet.google.com/... or Zoom link"
                {...register('meeting_link')}
                className="h-10 text-xs rounded-xl bg-background border-border"
              />
              {errors.meeting_link && (
                <p className="text-[11px] font-medium text-red-500">
                  {errors.meeting_link.message}
                </p>
              )}
            </div>
          )}

          {/* Remarks */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Remarks / Special Notes</Label>
            <Textarea
              placeholder="E.g. Parent wants to inspect science lab and sports facilities..."
              rows={2}
              {...register('remarks')}
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
              type="submit"
              disabled={isLoading}
              className="rounded-xl text-xs h-9 font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Schedule Visit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
