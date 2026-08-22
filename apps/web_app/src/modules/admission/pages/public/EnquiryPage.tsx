import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/context/LanguageContext';
import { PhoneInput } from '@/components/ui/phone-input';
import {
  User,
  Mail,
  Phone,
  BookOpen,
  Send,
  Loader2,
  CheckCircle2,
  Info,
  UserCheck,
  Calendar,
  DollarSign,
  FileText,
  PhoneCall,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdmissionShell } from '../../components/AdmissionShell';
import { admissionApi } from '@/modules/admission/admission.api';
import apiClient from '@/lib/api-client';
import { SCHOOL_INFO } from '@/lib/public-constants';
import { CinematicPageHero } from '@/components/patterns/CinematicPageHero';
import { phoneSchema, optionalEmailSchema } from '@edutrack/validation';

const enquirySchema = z.object({
  parent_name: z.string().min(2, 'Name is required'),
  email: optionalEmailSchema,
  phone: phoneSchema,
  student_name: z.string().optional(),
  grade_applied_for: z.string().min(1, 'Please select grade'),
  query_type: z.string().min(1, 'Please select a query type'),
  message: z.string().optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to be contacted to submit enquiry' }),
  }),
});

type EnquiryFormData = z.infer<typeof enquirySchema>;

interface GradeOption {
  id: string;
  name: string;
}

const QUERY_TYPES = [
  'Admission Availability',
  'Admission Process',
  'Fees',
  'Curriculum',
  'Documents Required',
  'Campus Visit',
];

export const EnquiryPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [gradesList, setGradesList] = useState<GradeOption[]>([]);
  const [selectedQueryType, setSelectedQueryType] = useState<string>('Admission Availability');

  useEffect(() => {
    let isMounted = true;
    const fetchGrades = async () => {
      try {
        const res = await apiClient.get('/v1/public/classes');
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        if (isMounted && data.length > 0) {
          setGradesList(
            data.map((g: any) => ({
              id: g.academic_year_grade_id || g.id || g.grade_id,
              name: g.name || g.grade_name || 'Grade',
            })),
          );
        }
      } catch (e) {
        console.warn('Could not fetch public grades list, using defaults');
      }
    };
    fetchGrades();
    return () => {
      isMounted = false;
    };
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<EnquiryFormData>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      parent_name: '',
      email: '',
      phone: '',
      student_name: '',
      grade_applied_for: '',
      query_type: 'Admission Availability',
      message: '',
      consent: true,
    },
  });

  const handleSelectQueryType = (type: string) => {
    setSelectedQueryType(type);
    setValue('query_type', type, { shouldValidate: true });
  };

  const onSubmit = async (data: EnquiryFormData) => {
    setIsLoading(true);
    try {
      const res = await admissionApi.createEnquiry({
        parent_name: data.parent_name,
        email: data.email || undefined,
        phone: data.phone,
        student_name: data.student_name || undefined,
        grade_applied_for: data.grade_applied_for,
        query_type: data.query_type,
        remarks: data.message || '',
        source: 'website',
        consent: data.consent,
      });

      toast.success('Enquiry submitted successfully!');
      const refNo =
        (res as any)?.data?.reference_code ||
        (res as any)?.data?.reference_number ||
        (res as any)?.data?.reference ||
        (res as any)?.reference_code ||
        'ENQ-2026';
      navigate(`/admission/enquiry/success?ref=${encodeURIComponent(refNo)}`);
    } catch (err: any) {
      if (err?.status === 409 || err?.response?.status === 409) {
        toast.error(
          t(
            'enquiry.duplicate',
            'An enquiry with this contact information already exists in our system.',
          ),
        );
      } else {
        toast.error(
          err?.response?.data?.message ||
            err?.data?.message ||
            'Failed to submit enquiry. Please try again.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdmissionShell cardContainer={false} showProgressTracker={false}>
      <div className="max-w-6xl mx-auto space-y-10">
        {/* EDITORIAL CINEMATIC HERO */}
        <CinematicPageHero
          eyebrow="MAKE AN ENQUIRY"
          title="Let's Find the Right Path for Your Child"
          accentText="Right Path"
          description="Our admissions team is here to guide you through program options, grade availability, application procedures, and campus tours. Submit your enquiry below to connect with a counselor."
          backgroundImage="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1600&auto=format&fit=crop"
          imagePosition="object-[60%_center]"
          metadataItems={['Admissions', 'Guidance', 'Support']}
          className="rounded-3xl border border-border/80"
        />

        {/* Info Badge */}
        <div className="inline-flex items-center space-x-2 bg-editorial-cream text-[#063F40] px-4 py-2 rounded-full text-xs font-bold border border-border/80">
          <Info className="w-4 h-4 text-[#063F40] shrink-0" />
          <span>
            {t(
              'enquiry.badge',
              'No formal application fee or registration is required at this stage.',
            )}
          </span>
        </div>

        {/* Desktop Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Enquiry Form Card (65% width on desktop) */}
          <div className="lg:col-span-7 bg-card border border-border/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* SECTION 1: PARENT / ENQUIRER DETAILS */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 pb-2 border-b border-border/60">
                  <span className="w-7 h-7 rounded-lg bg-[#063F40] text-[#E7B76A] flex items-center justify-center font-black text-xs">
                    01
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-foreground">Your Details</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Tell us how we can reach you.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      {t('enquiry.nameLabel', 'Name *')}
                    </label>
                    <Input
                      placeholder={t('enquiry.namePlaceholder', 'Enter full name')}
                      {...register('parent_name')}
                      className="h-11 rounded-xl text-xs font-medium border-border/80 focus-visible:border-[#063F40]"
                    />
                    {errors.parent_name && (
                      <p className="mt-1 text-xs text-red-500 font-semibold">
                        {errors.parent_name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      {t('enquiry.mobileLabel', 'Mobile Number *')}
                    </label>
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => (
                        <PhoneInput
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          aria-invalid={errors.phone ? 'true' : 'false'}
                        />
                      )}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-500 font-semibold">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {t('enquiry.emailLabel', 'Email Address')}
                  </label>
                  <Input
                    type="email"
                    placeholder={t('enquiry.emailPlaceholder', 'example@email.com')}
                    {...register('email')}
                    className="h-11 rounded-xl text-xs font-medium border-border/80 focus-visible:border-[#063F40]"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500 font-semibold">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              {/* SECTION 2: STUDENT DETAILS */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center space-x-3 pb-2 border-b border-border/60">
                  <span className="w-7 h-7 rounded-lg bg-[#063F40] text-[#E7B76A] flex items-center justify-center font-black text-xs">
                    02
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-foreground">Student Details</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Help us understand the learner you're enquiring about.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {t('enquiry.studentNameLabel', 'Student Name')}
                  </label>
                  <Input
                    placeholder={t('enquiry.studentNamePlaceholder', "Enter student's full name")}
                    {...register('student_name')}
                    className="h-11 rounded-xl text-xs font-medium border-border/80 focus-visible:border-[#063F40]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      {t('enquiry.gradeLabel', 'Grade / Class Interested In')}
                    </label>
                    <select
                      {...register('grade_applied_for')}
                      className="w-full h-11 px-3 bg-card border border-border/80 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#063F40] text-foreground"
                    >
                      <option value="">Select Grade</option>
                      {gradesList.length > 0 ? (
                        gradesList.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Pre-KG">Pre-KG / Nursery</option>
                          <option value="LKG">LKG</option>
                          <option value="UKG">UKG</option>
                          <option value="Grade 1">Grade 1</option>
                          <option value="Grade 2">Grade 2</option>
                          <option value="Grade 3">Grade 3</option>
                          <option value="Grade 4">Grade 4</option>
                          <option value="Grade 5">Grade 5</option>
                          <option value="Grade 6">Grade 6</option>
                          <option value="Grade 7">Grade 7</option>
                          <option value="Grade 8">Grade 8</option>
                          <option value="Grade 9">Grade 9</option>
                          <option value="Grade 10">Grade 10</option>
                          <option value="Grade 11">Grade 11</option>
                          <option value="Grade 12">Grade 12</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      {t('enquiry.academicYearLabel', 'Academic Year')}
                    </label>
                    <Input
                      value="2026-27"
                      readOnly
                      className="h-11 rounded-xl text-xs font-bold bg-muted text-muted-foreground cursor-not-allowed border-border/60"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: YOUR QUERY */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center space-x-3 pb-2 border-b border-border/60">
                  <span className="w-7 h-7 rounded-lg bg-[#063F40] text-[#E7B76A] flex items-center justify-center font-black text-xs">
                    03
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-foreground">How Can We Help?</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Select the primary topic of your enquiry.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-3">
                    {t('enquiry.queryTypeLabel', 'Query Type')}
                  </label>
                  <fieldset className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <legend className="sr-only">Query Type</legend>
                    {QUERY_TYPES.map((type) => {
                      const isSelected = selectedQueryType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleSelectQueryType(type)}
                          className={`p-3 rounded-xl border text-xs font-bold text-left transition-all duration-200 flex items-center justify-between min-h-[44px] ${
                            isSelected
                              ? 'bg-[#063F40] text-white border-[#063F40] shadow-sm'
                              : 'bg-card border-border/80 text-foreground hover:bg-editorial-cream hover:border-[#063F40]/40'
                          }`}
                        >
                          <span className="truncate">{type}</span>
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-1.5 ${
                              isSelected ? 'border-[#E7B76A] bg-[#E7B76A]' : 'border-border'
                            }`}
                          >
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#063F40]" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </fieldset>
                  {errors.query_type && (
                    <p className="mt-1 text-xs text-red-500 font-semibold">
                      {errors.query_type.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    {t('enquiry.messageLabel', 'Message / Query')}
                  </label>
                  <textarea
                    {...register('message')}
                    placeholder={t(
                      'enquiry.messagePlaceholder',
                      "Tell us what you'd like to know...",
                    )}
                    rows={3}
                    className="w-full p-3.5 bg-card border border-border/80 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#063F40] resize-none text-foreground"
                  />
                </div>

                {/* Consent Checkbox Area */}
                <div className="p-4 rounded-xl bg-editorial-mist border border-border/80 pt-3">
                  <label className="flex items-start space-x-3 cursor-pointer min-h-[44px]">
                    <input
                      type="checkbox"
                      {...register('consent')}
                      className="mt-0.5 w-4 h-4 text-[#063F40] border-border rounded focus:ring-[#063F40]"
                    />
                    <span className="text-xs text-foreground font-medium leading-relaxed">
                      {t(
                        'enquiry.consentLabel',
                        'I agree to be contacted by the school regarding my admission enquiry.',
                      )}
                    </span>
                  </label>
                  {errors.consent && (
                    <p className="mt-1 text-xs text-red-500 font-semibold">
                      {errors.consent.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#063F40] hover:bg-[#082F35] text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#E7B76A]" />
                    <span>{t('enquiry.submitting', 'Submitting...')}</span>
                  </>
                ) : (
                  <>
                    <span className="text-[#E7B76A]">
                      {t('enquiry.submitButton', 'Submit Enquiry')}
                    </span>
                    <Send className="w-3.5 h-3.5 ml-1 text-[#E7B76A]" />
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* RIGHT: Admissions Information & Help Card (35% width on desktop) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <h3 className="font-extrabold text-sm text-foreground flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#063F40]" />
                <span>{t('enquiry.helpCardHeading', 'How can our admissions team help?')}</span>
              </h3>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-[#063F40] text-[#E7B76A] flex items-center justify-center shrink-0 shadow-xs">
                    <UserCheck className="w-4 h-4 text-[#E7B76A]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Admission guidance</h4>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      Personalized sessions to help you understand our values and culture.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-[#063F40] text-[#E7B76A] flex items-center justify-center shrink-0 shadow-xs">
                    <Calendar className="w-4 h-4 text-[#E7B76A]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Grade availability</h4>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      Real-time updates on seat availability across all grades.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-[#063F40] text-[#E7B76A] flex items-center justify-center shrink-0 shadow-xs">
                    <DollarSign className="w-4 h-4 text-[#E7B76A]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Fee information</h4>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      Detailed breakdown of tuition, transport, and ancillary fees.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-[#063F40] text-[#E7B76A] flex items-center justify-center shrink-0 shadow-xs">
                    <FileText className="w-4 h-4 text-[#E7B76A]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Application guidance</h4>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      Assistance with documentation and portal navigation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Shaded Immediate Help Sub-Card */}
              <div className="p-4 bg-editorial-cream rounded-2xl border border-border/80 space-y-3">
                <h4 className="text-xs font-extrabold text-foreground flex items-center space-x-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-[#063F40]" />
                  <span>{t('enquiry.immediateHelpHeading', 'Need immediate help?')}</span>
                </h4>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Our admissions office is open Monday to Saturday, 9 AM – 5 PM.
                </p>
                <div className="pt-1 space-y-1.5 text-xs font-bold text-[#063F40]">
                  <p className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-[#063F40]" />
                    <span>{SCHOOL_INFO.phone}</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-[#063F40]" />
                    <span>{SCHOOL_INFO.email}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdmissionShell>
  );
};

export default EnquiryPage;
