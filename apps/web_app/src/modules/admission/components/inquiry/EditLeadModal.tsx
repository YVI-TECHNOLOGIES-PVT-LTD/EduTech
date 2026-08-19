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
import { Switch } from '@/components/ui/switch';
import {
  useUpdateLeadMutation,
  LeadItem,
  LeadSource,
  LeadPriority,
  GenderType,
  RelationshipType,
} from '@/shared/api/crm.api';
import { useGetStaffListQuery } from '@/shared/api/staff.api';
import { useMasterData } from '../../context/MasterDataContext';
import { Edit3, Loader2 } from 'lucide-react';

const formSchema = z.object({
  student_first_name: z.string().min(1, 'Student first name is required'),
  student_last_name: z.string().optional().nullable(),
  dob: z.string().optional().nullable(),
  gender: z
    .enum(['male', 'female', 'other', 'undisclosed'] as const)
    .optional()
    .nullable(),
  academic_year_grade_id: z.string().min(1, 'Grade is required'),
  curriculum_preference: z.string().optional().nullable(),
  scholarship_interest: z.boolean(),
  contact_name: z.string().min(1, 'Primary contact name is required'),
  contact_relationship: z
    .enum(['father', 'mother', 'guardian', 'grandparent', 'other'] as const)
    .optional()
    .nullable(),
  contact_phone: z.string().min(5, 'Valid phone number is required'),
  contact_email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  source: z.enum([
    'website',
    'walk_in',
    'referral',
    'social_media',
    'chatbot',
    'qr_code',
    'education_fair',
    'phone_call',
    'email',
    'other',
  ] as const),
  priority: z.enum(['hot', 'warm', 'cold'] as const),
  assigned_counsellor_id: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditLeadModalProps {
  lead: LeadItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const EditLeadModal: React.FC<EditLeadModalProps> = ({
  lead,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { grades } = useMasterData();
  const { data: staffList = [] } = useGetStaffListQuery();
  const [updateLead, { isLoading: isUpdating }] = useUpdateLeadMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (lead && open) {
      reset({
        student_first_name: lead.student_first_name || '',
        student_last_name: lead.student_last_name || '',
        dob: lead.dob ? lead.dob.substring(0, 10) : '',
        gender: (lead.gender as GenderType) || null,
        academic_year_grade_id: lead.academic_year_grade_id || '',
        curriculum_preference: lead.curriculum_preference || '',
        scholarship_interest: Boolean(lead.scholarship_interest),
        contact_name: lead.contact_name || '',
        contact_relationship: (lead.contact_relationship as RelationshipType) || 'father',
        contact_phone: lead.contact_phone || '',
        contact_email: lead.contact_email || '',
        source: lead.source || 'walk_in',
        priority: (lead.priority as LeadPriority) || 'warm',
        assigned_counsellor_id: lead.assigned_counsellor_id || null,
        remarks: lead.remarks || '',
      });
    }
  }, [lead, open, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!lead) return;
    try {
      const payload: Partial<LeadItem> = {
        ...values,
        dob: values.dob ? values.dob : null,
        contact_email: values.contact_email ? values.contact_email : null,
        assigned_counsellor_id: values.assigned_counsellor_id
          ? values.assigned_counsellor_id
          : null,
        remarks: values.remarks ? values.remarks : null,
      };

      await updateLead({ id: lead.lead_id, data: payload }).unwrap();
      toast.success(`Lead ${lead.lead_number} updated successfully`);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.data?.error || err?.message || 'Failed to update lead';
      toast.error(msg);
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
        <DialogHeader className="p-6 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-indigo-600" />
              Edit Lead Details — {lead.lead_number}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Update student profile, guardian contact, or counselor assignment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-6">
            {/* Student Info Section */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Student Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit_student_first_name" className="text-xs font-bold">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit_student_first_name"
                    {...register('student_first_name')}
                    className={errors.student_first_name ? 'border-red-500' : ''}
                  />
                  {errors.student_first_name && (
                    <p className="text-[11px] text-red-500 font-medium">
                      {errors.student_first_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit_student_last_name" className="text-xs font-bold">
                    Last Name
                  </Label>
                  <Input id="edit_student_last_name" {...register('student_last_name')} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit_dob" className="text-xs font-bold">
                    Date of Birth
                  </Label>
                  <Input id="edit_dob" type="date" {...register('dob')} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit_gender" className="text-xs font-bold">
                    Gender
                  </Label>
                  <Select
                    value={watch('gender') || ''}
                    onValueChange={(val) => setValue('gender', (val as GenderType) || null)}
                  >
                    <SelectTrigger id="edit_gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="undisclosed">Undisclosed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Academic Info Section */}
            <div className="pt-2 border-t border-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Academic Program
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit_academic_year_grade_id" className="text-xs font-bold">
                    Grade Applying For <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={watch('academic_year_grade_id') || ''}
                    onValueChange={(val) => setValue('academic_year_grade_id', val)}
                  >
                    <SelectTrigger
                      id="edit_academic_year_grade_id"
                      className={errors.academic_year_grade_id ? 'border-red-500' : ''}
                    >
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((g) => (
                        <SelectItem key={g.id} value={g.academic_year_grade_id || g.id}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.academic_year_grade_id && (
                    <p className="text-[11px] text-red-500 font-medium">
                      {errors.academic_year_grade_id.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit_curriculum_preference" className="text-xs font-bold">
                    Curriculum Preference
                  </Label>
                  <Select
                    value={watch('curriculum_preference') || ''}
                    onValueChange={(val) => setValue('curriculum_preference', val || null)}
                  >
                    <SelectTrigger id="edit_curriculum_preference">
                      <SelectValue placeholder="Select board/curriculum" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CBSE">CBSE</SelectItem>
                      <SelectItem value="ICSE">ICSE</SelectItem>
                      <SelectItem value="IB">IB (International Baccalaureate)</SelectItem>
                      <SelectItem value="Cambridge">Cambridge (IGCSE)</SelectItem>
                      <SelectItem value="State Board">State Board</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center space-x-3 p-3 rounded-xl border border-border bg-card">
                    <Switch
                      id="edit_scholarship_interest"
                      checked={Boolean(watch('scholarship_interest'))}
                      onCheckedChange={(checked) => setValue('scholarship_interest', checked)}
                    />
                    <Label
                      htmlFor="edit_scholarship_interest"
                      className="text-xs font-bold cursor-pointer"
                    >
                      Interested in Scholarships / Financial Aid
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Details Section */}
            <div className="pt-2 border-t border-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Primary Contact
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit_contact_name" className="text-xs font-bold">
                    Contact Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit_contact_name"
                    {...register('contact_name')}
                    className={errors.contact_name ? 'border-red-500' : ''}
                  />
                  {errors.contact_name && (
                    <p className="text-[11px] text-red-500 font-medium">
                      {errors.contact_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit_contact_relationship" className="text-xs font-bold">
                    Relationship
                  </Label>
                  <Select
                    value={watch('contact_relationship') || 'father'}
                    onValueChange={(val) =>
                      setValue('contact_relationship', val as RelationshipType)
                    }
                  >
                    <SelectTrigger id="edit_contact_relationship">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="father">Father</SelectItem>
                      <SelectItem value="mother">Mother</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                      <SelectItem value="grandparent">Grandparent</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit_contact_phone" className="text-xs font-bold">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit_contact_phone"
                    {...register('contact_phone')}
                    className={errors.contact_phone ? 'border-red-500' : ''}
                  />
                  {errors.contact_phone && (
                    <p className="text-[11px] text-red-500 font-medium">
                      {errors.contact_phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit_contact_email" className="text-xs font-bold">
                    Email Address
                  </Label>
                  <Input
                    id="edit_contact_email"
                    type="email"
                    {...register('contact_email')}
                    className={errors.contact_email ? 'border-red-500' : ''}
                  />
                  {errors.contact_email && (
                    <p className="text-[11px] text-red-500 font-medium">
                      {errors.contact_email.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Routing & Assignment */}
            <div className="pt-2 border-t border-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Inquiry Routing & Notes
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit_source" className="text-xs font-bold">
                    Source
                  </Label>
                  <Select
                    value={watch('source')}
                    onValueChange={(val) => setValue('source', val as LeadSource)}
                  >
                    <SelectTrigger id="edit_source">
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="walk_in">Walk-in</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="phone_call">Phone Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="social_media">Social Media</SelectItem>
                      <SelectItem value="chatbot">Chatbot</SelectItem>
                      <SelectItem value="education_fair">Education Fair</SelectItem>
                      <SelectItem value="qr_code">QR Code</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit_priority" className="text-xs font-bold">
                    Priority
                  </Label>
                  <Select
                    value={watch('priority') || 'warm'}
                    onValueChange={(val) => setValue('priority', val as LeadPriority)}
                  >
                    <SelectTrigger id="edit_priority">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hot">🔥 Hot</SelectItem>
                      <SelectItem value="warm">⚡ Warm</SelectItem>
                      <SelectItem value="cold">❄️ Cold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit_assigned_counsellor_id" className="text-xs font-bold">
                    Assigned Counsellor
                  </Label>
                  <Select
                    value={watch('assigned_counsellor_id') || 'unassigned'}
                    onValueChange={(val) =>
                      setValue('assigned_counsellor_id', val === 'unassigned' ? null : val)
                    }
                  >
                    <SelectTrigger id="edit_assigned_counsellor_id">
                      <SelectValue placeholder="Counsellor" />
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

                <div className="md:col-span-3 space-y-1.5">
                  <Label htmlFor="edit_remarks" className="text-xs font-bold">
                    Internal Remarks
                  </Label>
                  <Textarea id="edit_remarks" rows={2} {...register('remarks')} />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-3 border-t border-border flex justify-between sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
              className="text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/20"
            >
              {isUpdating && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
