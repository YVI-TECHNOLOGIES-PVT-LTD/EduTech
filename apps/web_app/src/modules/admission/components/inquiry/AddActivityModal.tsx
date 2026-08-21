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
  ActivityType,
  ActivityStatus,
  LeadActivityItem,
} from '@/shared/api/crm.api';
import { Activity, Loader2, Edit3 } from 'lucide-react';

const formSchema = z.object({
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
  activity_date: z.string().min(1, 'Activity date is required'),
  next_followup_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

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

  const isEditing = !!initialActivity;
  const isLoading = isCreating || isUpdating;

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
      activity_date: new Date().toISOString().substring(0, 16),
      next_followup_date: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (initialActivity) {
        reset({
          activity_type: initialActivity.activity_type || 'phone_call',
          status: initialActivity.status || 'completed',
          activity_date: initialActivity.activity_date
            ? new Date(initialActivity.activity_date).toISOString().substring(0, 16)
            : new Date().toISOString().substring(0, 16),
          next_followup_date: initialActivity.next_followup_date
            ? new Date(initialActivity.next_followup_date).toISOString().substring(0, 16)
            : '',
          notes: initialActivity.notes || '',
        });
      } else {
        reset({
          activity_type: 'phone_call',
          status: 'completed',
          activity_date: new Date().toISOString().substring(0, 16),
          next_followup_date: '',
          notes: '',
        });
      }
    }
  }, [open, initialActivity, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && initialActivity?.activity_id) {
        await updateActivity({
          activityId: initialActivity.activity_id,
          leadId,
          data: {
            activity_type: values.activity_type as ActivityType,
            status: values.status as ActivityStatus,
            activity_date: new Date(values.activity_date).toISOString(),
            next_followup_date: values.next_followup_date
              ? new Date(values.next_followup_date).toISOString()
              : null,
            notes: values.notes || null,
          },
        }).unwrap();
        toast.success('Activity updated successfully');
      } else {
        await createActivity({
          leadId,
          data: {
            activity_type: values.activity_type as ActivityType,
            status: values.status as ActivityStatus,
            activity_date: new Date(values.activity_date).toISOString(),
            next_followup_date: values.next_followup_date
              ? new Date(values.next_followup_date).toISOString()
              : null,
            notes: values.notes || null,
          },
        }).unwrap();
        toast.success('Activity logged successfully');
      }

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      const msg =
        err?.data?.error || err?.data?.message || err?.message || 'Failed to save activity';
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 rounded-2xl">
        <DialogHeader className="p-6 pb-3 border-b border-border">
          <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
            {isEditing ? (
              <Edit3 className="w-5 h-5 text-indigo-600" />
            ) : (
              <Activity className="w-5 h-5 text-indigo-600" />
            )}
            {isEditing ? 'Edit Activity' : 'Log Activity / Follow-up'}
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

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="activity_type" className="text-xs font-bold">
                  Activity Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={watch('activity_type')}
                  onValueChange={(val) => setValue('activity_type', val as ActivityType)}
                >
                  <SelectTrigger id="activity_type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone_call">📞 Phone Call</SelectItem>
                    <SelectItem value="whatsapp">💬 WhatsApp Message</SelectItem>
                    <SelectItem value="email">✉️ Email</SelectItem>
                    <SelectItem value="counselling">🧑‍🏫 Counselling Session</SelectItem>
                    <SelectItem value="chatbot">🤖 Chatbot Interaction</SelectItem>
                    <SelectItem value="application_submitted">📄 Application Submitted</SelectItem>
                    <SelectItem value="follow_up">🔁 Follow-up</SelectItem>
                    <SelectItem value="note">📝 Internal Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-bold">
                  Status
                </Label>
                <Select
                  value={watch('status')}
                  onValueChange={(val) => setValue('status', val as ActivityStatus)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="scheduled">Scheduled / Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="activity_date" className="text-xs font-bold">
                  Date & Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="activity_date"
                  type="datetime-local"
                  {...register('activity_date')}
                  className={errors.activity_date ? 'border-red-500' : ''}
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
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="notes" className="text-xs font-bold">
                  Discussion Notes & Remarks
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Summarize the discussion, parent queries, or next steps..."
                  rows={3}
                  {...register('notes')}
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
              {isEditing ? 'Update Activity' : 'Save Activity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
