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
import { useScheduleVisitMutation, VisitType } from '@/shared/api/crm.api';
import { useGetStaffListQuery } from '@/shared/api/staff.api';
import { Calendar, MapPin, Video, Loader2 } from 'lucide-react';

function toLocalDatetimeInput(d?: Date | string | null): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const formSchema = z.object({
  visit_type: z.enum(['campus', 'virtual'] as const),
  scheduled_at: z.string().min(1, 'Scheduled date and time is required'),
  staff_id: z.string().optional().nullable(),
  meeting_link: z.string().url('Invalid URL format').optional().nullable().or(z.literal('')),
  remarks: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface ScheduleVisitModalProps {
  leadId: string;
  leadNumber?: string;
  studentName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const ScheduleVisitModal: React.FC<ScheduleVisitModalProps> = ({
  leadId,
  leadNumber,
  studentName,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { data: staffList = [] } = useGetStaffListQuery();
  const [scheduleVisit, { isLoading: isScheduling }] = useScheduleVisitMutation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isLoading = isScheduling || isSubmitting;

  const wasOpenRef = React.useRef(false);

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
      visit_type: 'campus',
      scheduled_at: toLocalDatetimeInput(new Date(Date.now() + 24 * 60 * 60 * 1000)),
      staff_id: null,
      meeting_link: '',
      remarks: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (!wasOpenRef.current) {
        wasOpenRef.current = true;
        reset({
          visit_type: 'campus',
          scheduled_at: toLocalDatetimeInput(new Date(Date.now() + 24 * 60 * 60 * 1000)),
          staff_id: null,
          meeting_link: '',
          remarks: '',
        });
      }
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      reset({
        visit_type: 'campus',
        scheduled_at: toLocalDatetimeInput(new Date(Date.now() + 24 * 60 * 60 * 1000)),
        staff_id: null,
        meeting_link: '',
        remarks: '',
      });
    }
  }, [open, reset]);

  const selectedVisitType = watch('visit_type');

  const onSubmit = async (values: FormValues) => {
    if (isSubmitting || isScheduling) return;
    setIsSubmitting(true);
    try {
      await scheduleVisit({
        lead_id: leadId,
        visit_type: values.visit_type as VisitType,
        scheduled_at: new Date(values.scheduled_at).toISOString(),
        staff_id: values.staff_id || null,
        meeting_link: values.meeting_link || null,
        remarks: values.remarks?.trim() || null,
      }).unwrap();

      toast.success(
        `${values.visit_type === 'virtual' ? 'Virtual Counselling' : 'Campus Visit'} scheduled successfully`,
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.data?.error || err?.message || 'Failed to schedule visit';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="z-[60] bg-black/60 backdrop-blur-xs"
        className="max-w-lg w-full p-0 rounded-2xl z-[60] max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden bg-background shadow-2xl border border-border"
      >
        <DialogHeader className="p-6 pb-3 border-b border-border shrink-0">
          <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>Schedule Campus Visit / Counselling</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {leadNumber && studentName ? (
              <>
                For <span className="font-bold text-foreground">{studentName}</span> ({leadNumber})
              </>
            ) : (
              'Plan an in-person campus tour or virtual counselling meeting.'
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1 max-h-[calc(85vh-135px)]">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Visit Mode</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('visit_type', 'campus')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-xs transition-all ${
                    selectedVisitType === 'campus'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'border-border bg-card text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-900'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  Campus Tour
                </button>
                <button
                  type="button"
                  onClick={() => setValue('visit_type', 'virtual')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-xs transition-all ${
                    selectedVisitType === 'virtual'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'border-border bg-card text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-900'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  Virtual Session
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="scheduled_at" className="text-xs font-bold">
                  Date & Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="scheduled_at"
                  type="datetime-local"
                  {...register('scheduled_at')}
                  className={`text-xs h-9 ${errors.scheduled_at ? 'border-red-500' : ''}`}
                />
                {errors.scheduled_at && (
                  <p className="text-[11px] text-red-500 font-medium">
                    {errors.scheduled_at.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="staff_id" className="text-xs font-bold">
                  Host / Counsellor
                </Label>
                <Select
                  value={watch('staff_id') || 'unassigned'}
                  onValueChange={(val) => setValue('staff_id', val === 'unassigned' ? null : val)}
                >
                  <SelectTrigger id="staff_id" className="text-xs font-semibold h-9">
                    <SelectValue placeholder="Select host" />
                  </SelectTrigger>
                  <SelectContent className="text-xs z-[70]">
                    <SelectItem value="unassigned">-- Unassigned --</SelectItem>
                    {staffList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.firstName} {s.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedVisitType === 'virtual' && (
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="meeting_link" className="text-xs font-bold">
                    Meeting Link (Google Meet / Zoom)
                  </Label>
                  <Input
                    id="meeting_link"
                    placeholder="https://meet.google.com/xyz-abc-def"
                    {...register('meeting_link')}
                    className={`text-xs h-9 ${errors.meeting_link ? 'border-red-500' : ''}`}
                  />
                  {errors.meeting_link && (
                    <p className="text-[11px] text-red-500 font-medium">
                      {errors.meeting_link.message}
                    </p>
                  )}
                </div>
              )}

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="remarks" className="text-xs font-bold">
                  Special Instructions & Notes
                </Label>
                <Textarea
                  id="remarks"
                  placeholder="e.g. Lab demonstration requested, discussion regarding scholarships..."
                  rows={3}
                  className="text-xs resize-none"
                  {...register('remarks')}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 sm:p-6 sm:py-3 border-t border-border flex items-center justify-between sm:justify-between shrink-0 bg-muted/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="text-xs font-bold h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/20 h-9 px-4"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
              Schedule Visit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
