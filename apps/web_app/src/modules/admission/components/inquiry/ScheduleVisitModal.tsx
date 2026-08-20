import React from 'react';
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
  const [scheduleVisit, { isLoading }] = useScheduleVisitMutation();

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
      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().substring(0, 16),
      staff_id: null,
      meeting_link: '',
      remarks: '',
    },
  });

  const selectedVisitType = watch('visit_type');

  const onSubmit = async (values: FormValues) => {
    try {
      await scheduleVisit({
        lead_id: leadId,
        visit_type: values.visit_type as VisitType,
        scheduled_at: new Date(values.scheduled_at).toISOString(),
        staff_id: values.staff_id || null,
        meeting_link: values.meeting_link || null,
        remarks: values.remarks || null,
      }).unwrap();

      toast.success(
        `${values.visit_type === 'virtual' ? 'Virtual Counselling' : 'Campus Visit'} scheduled successfully`,
      );
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.data?.error || err?.message || 'Failed to schedule visit';
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 rounded-2xl">
        <DialogHeader className="p-6 pb-3 border-b border-border">
          <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Schedule Campus Visit / Counselling
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

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Visit Mode</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('visit_type', 'campus')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-xs transition-all ${
                    selectedVisitType === 'campus'
                      ? 'border-black dark:border-white bg-black text-white dark:bg-white dark:text-black shadow-sm'
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
                      ? 'border-black dark:border-white bg-black text-white dark:bg-white dark:text-black shadow-sm'
                      : 'border-border bg-card text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-900'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  Virtual Session
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="scheduled_at" className="text-xs font-bold">
                  Date & Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="scheduled_at"
                  type="datetime-local"
                  {...register('scheduled_at')}
                  className={errors.scheduled_at ? 'border-red-500' : ''}
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
                  <SelectTrigger id="staff_id">
                    <SelectValue placeholder="Select host" />
                  </SelectTrigger>
                  <SelectContent>
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
                <div className="md:col-span-2 space-y-1.5">
                  <Label htmlFor="meeting_link" className="text-xs font-bold">
                    Meeting Link (Google Meet / Zoom)
                  </Label>
                  <Input
                    id="meeting_link"
                    placeholder="https://meet.google.com/xyz-abc-def"
                    {...register('meeting_link')}
                    className={errors.meeting_link ? 'border-red-500' : ''}
                  />
                  {errors.meeting_link && (
                    <p className="text-[11px] text-red-500 font-medium">
                      {errors.meeting_link.message}
                    </p>
                  )}
                </div>
              )}

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="remarks" className="text-xs font-bold">
                  Instructions / Remarks
                </Label>
                <Textarea
                  id="remarks"
                  placeholder="e.g. Needs boarding tour and meeting with Science department head."
                  rows={2}
                  {...register('remarks')}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-3 border-t border-border flex justify-between sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/20"
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
