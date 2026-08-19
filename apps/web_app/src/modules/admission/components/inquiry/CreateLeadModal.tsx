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
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useCreateLeadMutation,
  useLazyCheckDuplicatesQuery,
  LeadSource,
  LeadPriority,
  LeadStage,
  GenderType,
  RelationshipType,
} from '@/shared/api/crm.api';
import { useGetStaffListQuery } from '@/shared/api/staff.api';
import { useMasterData } from '../../context/MasterDataContext';
import { User, BookOpen, Phone, MessageSquare, AlertTriangle, Loader2 } from 'lucide-react';

const formSchema = z.object({
  student_first_name: z.string().min(1, 'Student first name is required'),
  student_last_name: z.string().optional().nullable(),
  dob: z.string().optional().nullable(),
  gender: z
    .enum(['male', 'female', 'other', 'undisclosed'] as const)
    .optional()
    .nullable(),
  academic_year_grade_id: z.string().min(1, 'Grade / Academic year is required'),
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
  stage: z.enum([
    'enquiry_received',
    'qualified',
    'counselling_scheduled',
    'campus_visit',
    'application_submitted',
    'document_verification',
    'assessment',
    'admission_approved',
    'waitlisted',
    'rejected',
    'fee_payment_pending',
    'enrolled',
  ] as const),
  priority: z.enum(['hot', 'warm', 'cold'] as const),
  assigned_counsellor_id: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateLeadModal: React.FC<CreateLeadModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { grades } = useMasterData();
  const { data: staffList = [] } = useGetStaffListQuery();
  const [createLead, { isLoading: isCreating }] = useCreateLeadMutation();
  const [triggerCheckDuplicates, { data: duplicateData }] = useLazyCheckDuplicatesQuery();

  const [activeTab, setActiveTab] = useState<string>('student');

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
      student_first_name: '',
      student_last_name: '',
      dob: '',
      gender: null,
      academic_year_grade_id: '',
      curriculum_preference: '',
      scholarship_interest: false,
      contact_name: '',
      contact_relationship: 'father',
      contact_phone: '',
      contact_email: '',
      source: 'walk_in',
      stage: 'enquiry_received',
      priority: 'warm',
      assigned_counsellor_id: null,
      remarks: '',
    },
  });

  const watchPhone = watch('contact_phone');
  const watchEmail = watch('contact_email');

  // Debounced duplicate detection
  useEffect(() => {
    if (watchPhone && watchPhone.length >= 6) {
      const timer = setTimeout(() => {
        triggerCheckDuplicates({
          phone: watchPhone,
          email: watchEmail || undefined,
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [watchPhone, watchEmail, triggerCheckDuplicates]);

  // Set default grade if available
  useEffect(() => {
    if (open && grades.length > 0 && !watch('academic_year_grade_id')) {
      const validGrade = grades.find((g) => g.academic_year_grade_id || g.id);
      if (validGrade) {
        setValue('academic_year_grade_id', validGrade.academic_year_grade_id || validGrade.id);
      }
    }
  }, [open, grades, setValue, watch]);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        ...values,
        dob: values.dob ? values.dob : undefined,
        contact_email: values.contact_email ? values.contact_email : undefined,
        assigned_counsellor_id: values.assigned_counsellor_id
          ? values.assigned_counsellor_id
          : undefined,
        remarks: values.remarks ? values.remarks : undefined,
      };

      const result = await createLead(payload as any).unwrap();
      toast.success(`Lead created successfully: ${result.lead_number}`);
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.data?.error || err?.message || 'Failed to create lead';
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
        <DialogHeader className="p-6 pb-2 border-b border-border">
          <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            Create New Admission Lead
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Enter the prospective student's details, parent contact, and inquiry information.
          </DialogDescription>
        </DialogHeader>

        {duplicateData?.isDuplicate && (
          <div className="px-6 pt-4">
            <Alert
              variant="destructive"
              className="bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200"
            >
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-xs font-bold">Potential Duplicate Detected</AlertTitle>
              <AlertDescription className="text-xs mt-1">
                Found {duplicateData.count} existing lead(s) with phone number {watchPhone}:
                <ul className="list-disc pl-4 mt-1 font-medium">
                  {duplicateData.matches.slice(0, 2).map((m) => (
                    <li key={m.lead_id}>
                      {m.lead_number} — {m.student_name} (Contact: {m.contact_name})
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 pt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 w-full mb-6">
                <TabsTrigger
                  value="student"
                  className="text-xs flex items-center gap-1.5 font-bold"
                >
                  <User className="w-3.5 h-3.5" />
                  Student
                </TabsTrigger>
                <TabsTrigger
                  value="academic"
                  className="text-xs flex items-center gap-1.5 font-bold"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Academic
                </TabsTrigger>
                <TabsTrigger
                  value="contact"
                  className="text-xs flex items-center gap-1.5 font-bold"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Contact
                </TabsTrigger>
                <TabsTrigger value="crm" className="text-xs flex items-center gap-1.5 font-bold">
                  <MessageSquare className="w-3.5 h-3.5" />
                  CRM & Routing
                </TabsTrigger>
              </TabsList>

              {/* 1. Student Information */}
              <TabsContent value="student" className="space-y-4 focus-visible:outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="student_first_name" className="text-xs font-bold">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="student_first_name"
                      placeholder="e.g. Aarav"
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
                    <Label htmlFor="student_last_name" className="text-xs font-bold">
                      Last Name
                    </Label>
                    <Input
                      id="student_last_name"
                      placeholder="e.g. Sharma"
                      {...register('student_last_name')}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="dob" className="text-xs font-bold">
                      Date of Birth
                    </Label>
                    <Input id="dob" type="date" {...register('dob')} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="gender" className="text-xs font-bold">
                      Gender
                    </Label>
                    <Select
                      value={watch('gender') || ''}
                      onValueChange={(val) => setValue('gender', (val as GenderType) || null)}
                    >
                      <SelectTrigger id="gender">
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

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('academic')}
                    className="font-bold text-xs"
                  >
                    Next: Academic Info →
                  </Button>
                </div>
              </TabsContent>

              {/* 2. Academic Information */}
              <TabsContent value="academic" className="space-y-4 focus-visible:outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="academic_year_grade_id" className="text-xs font-bold">
                      Grade Applying For <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={watch('academic_year_grade_id') || ''}
                      onValueChange={(val) => setValue('academic_year_grade_id', val)}
                    >
                      <SelectTrigger
                        id="academic_year_grade_id"
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
                    <Label htmlFor="curriculum_preference" className="text-xs font-bold">
                      Curriculum Preference
                    </Label>
                    <Select
                      value={watch('curriculum_preference') || ''}
                      onValueChange={(val) => setValue('curriculum_preference', val || null)}
                    >
                      <SelectTrigger id="curriculum_preference">
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

                  <div className="md:col-span-2 pt-2">
                    <div className="flex items-center space-x-3 p-3.5 rounded-xl border border-border bg-card">
                      <Switch
                        id="scholarship_interest"
                        checked={Boolean(watch('scholarship_interest'))}
                        onCheckedChange={(checked) => setValue('scholarship_interest', checked)}
                      />
                      <div className="space-y-0.5">
                        <Label
                          htmlFor="scholarship_interest"
                          className="text-xs font-bold cursor-pointer"
                        >
                          Interested in Scholarships / Financial Aid
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Flag this lead for merit or sports-based scholarship evaluation.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('student')}
                    className="font-bold text-xs"
                  >
                    ← Back
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('contact')}
                    className="font-bold text-xs"
                  >
                    Next: Contact Info →
                  </Button>
                </div>
              </TabsContent>

              {/* 3. Primary Contact Information */}
              <TabsContent value="contact" className="space-y-4 focus-visible:outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="contact_name" className="text-xs font-bold">
                      Primary Contact / Parent Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contact_name"
                      placeholder="e.g. Rajesh Sharma"
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
                    <Label htmlFor="contact_relationship" className="text-xs font-bold">
                      Relationship
                    </Label>
                    <Select
                      value={watch('contact_relationship') || 'father'}
                      onValueChange={(val) =>
                        setValue('contact_relationship', val as RelationshipType)
                      }
                    >
                      <SelectTrigger id="contact_relationship">
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
                    <Label htmlFor="contact_phone" className="text-xs font-bold">
                      Primary Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contact_phone"
                      placeholder="e.g. +91 98765 43210"
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
                    <Label htmlFor="contact_email" className="text-xs font-bold">
                      Email Address
                    </Label>
                    <Input
                      id="contact_email"
                      type="email"
                      placeholder="e.g. rajesh@example.com"
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

                <div className="flex justify-between pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('academic')}
                    className="font-bold text-xs"
                  >
                    ← Back
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('crm')}
                    className="font-bold text-xs"
                  >
                    Next: CRM & Routing →
                  </Button>
                </div>
              </TabsContent>

              {/* 4. CRM & Routing */}
              <TabsContent value="crm" className="space-y-4 focus-visible:outline-none">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="source" className="text-xs font-bold">
                      Inquiry Source <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={watch('source')}
                      onValueChange={(val) => setValue('source', val as LeadSource)}
                    >
                      <SelectTrigger id="source">
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
                    <Label htmlFor="priority" className="text-xs font-bold">
                      Initial Priority
                    </Label>
                    <Select
                      value={watch('priority') || 'warm'}
                      onValueChange={(val) => setValue('priority', val as LeadPriority)}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hot">🔥 Hot (High Intent)</SelectItem>
                        <SelectItem value="warm">⚡ Warm (Standard)</SelectItem>
                        <SelectItem value="cold">❄️ Cold (Informational)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="stage" className="text-xs font-bold">
                      Initial Stage
                    </Label>
                    <Select
                      value={watch('stage')}
                      onValueChange={(val) => setValue('stage', val as LeadStage)}
                    >
                      <SelectTrigger id="stage">
                        <SelectValue placeholder="Stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enquiry_received">Enquiry Received</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="counselling_scheduled">Counselling Scheduled</SelectItem>
                        <SelectItem value="campus_visit">Campus Visit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-3 space-y-1.5">
                    <Label htmlFor="assigned_counsellor_id" className="text-xs font-bold">
                      Assign to Counsellor / Staff
                    </Label>
                    <Select
                      value={watch('assigned_counsellor_id') || 'unassigned'}
                      onValueChange={(val) =>
                        setValue('assigned_counsellor_id', val === 'unassigned' ? null : val)
                      }
                    >
                      <SelectTrigger id="assigned_counsellor_id">
                        <SelectValue placeholder="Select counsellor (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">-- Leave Unassigned --</SelectItem>
                        {staffList.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.firstName} {s.lastName} (
                            {s.department || s.designation || s.employeeId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-3 space-y-1.5">
                    <Label htmlFor="remarks" className="text-xs font-bold">
                      Initial Remarks / Notes
                    </Label>
                    <Textarea
                      id="remarks"
                      placeholder="e.g. Parent enquired about boarding facilities and sports coaching."
                      rows={3}
                      {...register('remarks')}
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('contact')}
                    className="font-bold text-xs"
                  >
                    ← Back
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="p-6 pt-3 border-t border-border flex justify-between sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
              className="text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/20"
            >
              {isCreating && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
              Create Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
