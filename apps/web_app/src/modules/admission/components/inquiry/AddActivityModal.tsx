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
import {
  useCreateLeadActivityMutation,
  useUpdateLeadActivityMutation,
  useGetLeadEnumsQuery,
  ActivityType,
  ActivityStatus,
  LeadActivityItem,
} from '@/shared/api/crm.api';
import { Activity, Loader2, Edit3 } from 'lucide-react';

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

const formSchema = z
  .object({
    activity_type: z.enum([
      'phone_call',
      'email',
      'whatsapp',
      'chatbot',
      'follow_up',
      'counselling',
      'application_submitted',
      'note',
    ] as const),
    status: z.enum(['scheduled', 'completed', 'cancelled'] as const),
    activity_date: z.string().min(1, 'Activity date & time is required'),
    next_followup_date: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.next_followup_date && data.activity_date) {
        const actTime = new Date(data.activity_date).getTime();
        const followTime = new Date(data.next_followup_date).getTime();
        if (!isNaN(actTime) && !isNaN(followTime) && followTime < actTime) {
          return false;
        }
      }
      return true;
    },
    {
      message: 'Next follow-up cannot be earlier than activity date',
      path: ['next_followup_date'],
    },
  );

type FormValues = z.infer<typeof formSchema>;

interface AddActivityModalProps {
  leadId: string;
  leadNumber?: string;
  studentName?: string;
  initialActivity?: LeadActivityItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddActivityModal: React.FC<AddActivityModalProps> = ({
  leadId,
  leadNumber,
  studentName,
  initialActivity,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [createActivity, { isLoading: isCreating }] = useCreateLeadActivityMutation();
  const [updateActivity, { isLoading: isUpdating }] = useUpdateLeadActivityMutation();
  const { data: enumsResponse } = useGetLeadEnumsQuery(undefined, { skip: !open });
  const dbEnums = enumsResponse?.data;

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isEditing = !!initialActivity;
  const isLoading = isCreating || isUpdating || isSubmitting;

  const wasOpenRef = React.useRef(false);
  const currentEditingIdRef = React.useRef<string | null | undefined>(undefined);

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
      activity_type: 'phone_call',
      status: 'completed',
      activity_date: toLocalDatetimeInput(new Date()),
      next_followup_date: '',
      notes: '',
    },
  });

  // Re-initialize or reset only once on open or when switching target activity
  useEffect(() => {
    const activityId = initialActivity?.activity_id || null;
    if (open) {
      if (!wasOpenRef.current || currentEditingIdRef.current !== activityId) {
        wasOpenRef.current = true;
        currentEditingIdRef.current = activityId;
        if (initialActivity) {
          reset({
            activity_type: initialActivity.activity_type || 'phone_call',
            status: initialActivity.status || 'completed',
            activity_date:
              toLocalDatetimeInput(initialActivity.activity_date) ||
              toLocalDatetimeInput(new Date()),
            next_followup_date: toLocalDatetimeInput(initialActivity.next_followup_date),
            notes: initialActivity.notes || '',
          });
        } else {
          reset({
            activity_type: 'phone_call',
            status: 'completed',
            activity_date: toLocalDatetimeInput(new Date()),
            next_followup_date: '',
            notes: '',
          });
        }
      }
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      currentEditingIdRef.current = undefined;
      reset({
        activity_type: 'phone_call',
        status: 'completed',
        activity_date: toLocalDatetimeInput(new Date()),
        next_followup_date: '',
        notes: '',
      });
    }
  }, [open, initialActivity, reset]);

  const onSubmit = async (values: FormValues) => {
    if (isSubmitting || isCreating || isUpdating) return;
    setIsSubmitting(true);
    try {
      const activityIsoDate = new Date(values.activity_date).toISOString();
      const followUpIsoDate = values.next_followup_date
        ? new Date(values.next_followup_date).toISOString()
        : null;

      if (isEditing && initialActivity?.activity_id) {
        await updateActivity({
          activityId: initialActivity.activity_id,
          leadId,
          data: {
            activity_type: values.activity_type as ActivityType,
            status: values.status as ActivityStatus,
            activity_date: activityIsoDate,
            next_followup_date: followUpIsoDate,
            notes: values.notes?.trim() || null,
          },
        }).unwrap();
        toast.success('Activity updated successfully');
      } else {
        await createActivity({
          leadId,
          data: {
            activity_type: values.activity_type as ActivityType,
            status: values.status as ActivityStatus,
            activity_date: activityIsoDate,
            next_followup_date: followUpIsoDate,
            notes: values.notes?.trim() || null,
          },
        }).unwrap();
        toast.success('Activity logged successfully');
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      const msg =
        err?.data?.error || err?.data?.message || err?.message || 'Failed to save activity';
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
            {isEditing ? (
              <Edit3 className="w-5 h-5 text-indigo-600 shrink-0" />
            ) : (
              <Activity className="w-5 h-5 text-indigo-600 shrink-0" />
            )}
            <span>{isEditing ? 'Edit Activity' : 'Log Activity / Follow-up'}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {leadNumber && studentName ? (
              <>
                For <span className="font-bold text-foreground">{studentName}</span> ({leadNumber})
              </>
            ) : (
              'Record or edit a call, message, email, counseling session, or note.'
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1 max-h-[calc(85vh-135px)]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="activity_type" className="text-xs font-bold">
                  Activity Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={watch('activity_type')}
                  onValueChange={(val) => setValue('activity_type', val as ActivityType)}
                >
                  <SelectTrigger id="activity_type" className="text-xs font-semibold h-9">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="text-xs z-[70]">
                    {(
                      dbEnums?.lead_activity_types || [
                        { value: 'phone_call', label: 'Phone Call' },
                        { value: 'whatsapp', label: 'WhatsApp Message' },
                        { value: 'email', label: 'Email' },
                        { value: 'counselling', label: 'Counselling Session' },
                        { value: 'chatbot', label: 'Chatbot Interaction' },
                        { value: 'application_submitted', label: 'Application Submitted' },
                        { value: 'follow_up', label: 'Follow-up' },
                        { value: 'note', label: 'Internal Note' },
                      ]
                    ).map((at) => (
                      <SelectItem key={at.value} value={at.value}>
                        {at.value === 'phone_call'
                          ? '📞'
                          : at.value === 'whatsapp'
                            ? '💬'
                            : at.value === 'email'
                              ? '✉️'
                              : at.value === 'counselling'
                                ? '🧑‍🏫'
                                : at.value === 'chatbot'
                                  ? '🤖'
                                  : at.value === 'application_submitted'
                                    ? '📄'
                                    : at.value === 'follow_up'
                                      ? '🔁'
                                      : '📝'}{' '}
                        {at.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.activity_type && (
                  <p className="text-[11px] text-red-500 font-medium">
                    {errors.activity_type.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-bold">
                  Status
                </Label>
                <Select
                  value={watch('status')}
                  onValueChange={(val) => setValue('status', val as ActivityStatus)}
                >
                  <SelectTrigger id="status" className="text-xs font-semibold h-9">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="text-xs z-[70]">
                    {(
                      dbEnums?.activity_statuses || [
                        { value: 'completed', label: 'Completed' },
                        { value: 'scheduled', label: 'Scheduled' },
                        { value: 'cancelled', label: 'Cancelled' },
                      ]
                    ).map((st) => (
                      <SelectItem key={st.value} value={st.value}>
                        {st.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-[11px] text-red-500 font-medium">{errors.status.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="activity_date" className="text-xs font-bold">
                  Date & Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="activity_date"
                  type="datetime-local"
                  {...register('activity_date')}
                  className={`text-xs h-9 ${errors.activity_date ? 'border-red-500' : ''}`}
                />
                {errors.activity_date && (
                  <p className="text-[11px] text-red-500 font-medium">
                    {errors.activity_date.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="next_followup_date" className="text-xs font-bold">
                  Next Follow-up (Optional)
                </Label>
                <Input
                  id="next_followup_date"
                  type="datetime-local"
                  {...register('next_followup_date')}
                  className={`text-xs h-9 ${errors.next_followup_date ? 'border-red-500' : ''}`}
                />
                {errors.next_followup_date && (
                  <p className="text-[11px] text-red-500 font-medium">
                    {errors.next_followup_date.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="notes" className="text-xs font-bold">
                  Discussion Notes & Remarks
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Summarize the discussion, parent queries, or next steps..."
                  rows={3}
                  className="text-xs resize-none"
                  {...register('notes')}
                />
                {errors.notes && (
                  <p className="text-[11px] text-red-500 font-medium">{errors.notes.message}</p>
                )}
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
              {isEditing ? 'Update Activity' : 'Save Activity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
