import React, { useEffect } from 'react';
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
import { useUpdateVisitStatusMutation, LeadVisitItem } from '@/shared/api/crm.api';
import { useGetStaffListQuery } from '@/shared/api/staff.api';
import { Calendar, Clock, Loader2, User, AlertCircle } from 'lucide-react';

const formSchema = z.object({
  scheduled_date: z.string().min(1, 'New date is required'),
  scheduled_time: z.string().min(1, 'New time is required'),
  staff_id: z.string().optional().nullable(),
  meeting_link: z.string().url('Invalid URL format').optional().nullable().or(z.literal('')),
  remarks: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface RescheduleVisitDialogProps {
  visit: LeadVisitItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const RescheduleVisitDialog: React.FC<RescheduleVisitDialogProps> = ({
  visit,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { data: staffList = [] } = useGetStaffListQuery();
  const [updateVisitStatus, { isLoading }] = useUpdateVisitStatusMutation();

  const currentDate = visit?.scheduled_at ? new Date(visit.scheduled_at) : new Date();
  const defaultDate = !isNaN(currentDate.getTime())
    ? currentDate.toISOString().substring(0, 10)
    : '';
  const defaultTime = !isNaN(currentDate.getTime())
    ? currentDate.toISOString().substring(11, 16)
    : '10:30';

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
      scheduled_date: defaultDate,
      scheduled_time: defaultTime,
      staff_id: visit?.staff_id || null,
      meeting_link: visit?.meeting_link || '',
      remarks: visit?.remarks || '',
    },
  });

  useEffect(() => {
    if (visit && open) {
      const d = new Date(visit.scheduled_at);
      reset({
        scheduled_date: !isNaN(d.getTime()) ? d.toISOString().substring(0, 10) : '',
        scheduled_time: !isNaN(d.getTime()) ? d.toISOString().substring(11, 16) : '10:30',
        staff_id: visit.staff_id || null,
        meeting_link: visit.meeting_link || '',
        remarks: visit.remarks || '',
      });
    }
  }, [visit, open, reset]);

  if (!visit) return null;

  const studentName =
    visit.leads?.student_first_name
      ? `${visit.leads.student_first_name} ${visit.leads.student_last_name || ''}`.trim()
      : 'Applicant';
  const leadNumber = visit.leads?.lead_number || 'N/A';

  const onSubmit = async (values: FormValues) => {
    try {
      const newDateTime = new Date(`${values.scheduled_date}T${values.scheduled_time}:00`);
      if (isNaN(newDateTime.getTime())) {
        toast.error('Invalid date or time');
        return;
      }

      await updateVisitStatus({
        visitId: visit.visit_id,
        leadId: visit.lead_id,
        scheduled_at: newDateTime.toISOString(),
        staff_id: values.staff_id || null,
        meeting_link: values.meeting_link || null,
        remarks: values.remarks || null,
      }).unwrap();

      toast.success('Visit rescheduled successfully.');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.data?.error || err?.message || 'Failed to reschedule visit';
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-card border-border rounded-2xl">
        <div className="p-6 bg-slate-950 text-white border-b border-slate-900">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-900/60 text-amber-300 text-xs font-bold border border-amber-700/50 mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Reschedule Visit</span>
          </div>
          <DialogTitle className="text-xl font-extrabold text-white tracking-tight">
            Reschedule Visit Appointment
          </DialogTitle>
          <DialogDescription className="text-slate-300 text-xs mt-1">
            Update the appointment date, time, assigned counsellor, or session notes.
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Current Visit Summary Box */}
          <div className="p-3.5 rounded-xl border border-border bg-muted/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-foreground">{studentName}</span>
              </div>
              <span className="text-xs font-mono font-bold text-muted-foreground">{leadNumber}</span>
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border/60">
              <span>Current Time:</span>
              <span className="font-semibold text-foreground">
                {new Date(visit.scheduled_at).toLocaleString()}
              </span>
            </div>
          </div>

          {/* New Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                New Date <span className="text-red-500">*</span>
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
                New Time <span className="text-red-500">*</span>
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
                <SelectValue placeholder="Select staff" />
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

          {/* Meeting Link for virtual */}
          {visit.visit_type === 'virtual' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Meeting Link</Label>
              <Input
                placeholder="https://meet.google.com/..."
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
            <Label className="text-xs font-bold text-foreground">Reason / Remarks</Label>
            <Textarea
              placeholder="E.g. Rescheduled on guardian request to upcoming weekend..."
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
              className="rounded-xl text-xs h-9 font-bold bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Save New Schedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
