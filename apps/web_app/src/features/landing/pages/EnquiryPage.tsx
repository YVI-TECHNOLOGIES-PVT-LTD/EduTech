import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  Loader2,
  PhoneCall,
  Mail,
  Clock,
  HelpCircle,
  BookOpen,
  Award,
  ArrowRight,
  ArrowLeft,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { enquirySchema, EnquiryFormData, EnquiryFormInput } from '../schemas/enquiry.schema';
import { useAdmission } from '../hooks/useAdmission';
import { ApplicationFeedbackModal } from '@/modules/admission/components/ApplicationFeedbackModal';
import { SCHOOL_INFO } from '@/lib/public-constants';
import { cn } from '@/lib/utils';

const gradesList = [
  'Pre-K / Nursery',
  'Kindergarten',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11 (Science)',
  'Grade 11 (Commerce)',
  'Grade 11 (Humanities)',
  'Grade 12',
];

const queryCategories = [
  { id: 'Admission Availability', label: 'Admission Availability' },
  { id: 'Admission Process', label: 'Admission Process' },
  { id: 'Fees', label: 'Fees' },
  { id: 'Curriculum', label: 'Curriculum' },
  { id: 'Documents Required', label: 'Documents Required' },
  { id: 'Campus Visit', label: 'Campus Visit' },
];

export const EnquiryPage: React.FC = () => {
  const { submitEnquiry, isLoading, referenceId, resetEnquiry } = useAdmission();
  const navigate = useNavigate();

  // Feedback Modal State
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'validation';
    title: string;
    message: string;
    details?: string;
    invalidCount?: number;
  }>({
    isOpen: false,
    type: 'validation',
    title: '',
    message: '',
  });

  // Form Field Refs for Auto-Scroll & Auto-Focus
  const fieldRefs = {
    parentName: useRef<HTMLInputElement>(null),
    phone: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    studentName: useRef<HTMLInputElement>(null),
    studentGrade: useRef<HTMLSelectElement>(null),
    academicYear: useRef<HTMLSelectElement>(null),
    notes: useRef<HTMLTextAreaElement>(null),
    consent: useRef<HTMLInputElement>(null),
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EnquiryFormInput, unknown, EnquiryFormData>({
    mode: 'onTouched',
    reValidateMode: 'onChange',
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      parentName: '',
      email: '',
      phone: '',
      studentName: '',
      studentGrade: '',
      academicYear: '2026-2027',
      queryType: 'Admission Process',
      notes: '',
      consent: true,
    },
  });

  const selectedQueryType = watch('queryType');
  const consentValue = watch('consent');

  // Handle Invalid Form Submission (Validation Errors)
  const onInvalidSubmit = (fieldErrors: any) => {
    const errorKeys = Object.keys(fieldErrors);
    const count = errorKeys.length;

    setFeedbackModal({
      isOpen: true,
      type: 'validation',
      title: 'Please Complete Required Fields',
      message: 'Please review the highlighted fields before submitting your enquiry.',
      invalidCount: count,
    });

    // Auto-scroll and focus first invalid field
    const firstErrorKey = errorKeys[0] as keyof typeof fieldRefs;
    if (firstErrorKey && fieldRefs[firstErrorKey]?.current) {
      fieldRefs[firstErrorKey].current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      fieldRefs[firstErrorKey].current?.focus();
    }
  };

  // Handle Form Submission
  const onSubmit = async (data: EnquiryFormData) => {
    const result = await submitEnquiry(data);

    if (result.success) {
      const refCode = result.reference || `ENQ-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      sessionStorage.setItem('edutrack_enquiry_session', JSON.stringify({ referenceId: refCode }));
    } else {
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'Enquiry Not Submitted',
        message: result.error || "We couldn't submit your enquiry right now. Please try again.",
      });
    }
  };

  const handleResetForm = () => {
    reset();
    resetEnquiry();
  };

  const parentNameRegister = register('parentName');
  const phoneRegister = register('phone');
  const emailRegister = register('email');
  const studentNameRegister = register('studentName');
  const notesRegister = register('notes');

  return (
    <div className="flex-1 flex flex-col overflow-x-hidden">
      {/* Page Hero (Dark Navy Theme with Generous Navbar Breathing Space) */}
      <section className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white pt-10 sm:pt-14 lg:pt-16 pb-10 sm:pb-14 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-indigo-500/15 border border-indigo-400/30 text-amber-300 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>No Application Required at this Stage</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight"
          >
            Have questions about{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">
              admissions?
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xs sm:text-sm lg:text-base text-slate-300 max-w-xl mx-auto leading-relaxed"
          >
            Share a few details and our admissions team will get in touch with you.
          </motion.p>
        </div>
      </section>

      {/* Main Two-Column Content Area */}
      <section className="py-8 sm:py-12 lg:py-16 bg-slate-50 flex-1">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* LEFT COLUMN: Form Card (~60%) */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-3xl p-6 sm:p-9 border border-slate-200/90 shadow-xl shadow-slate-950/5 space-y-7">
                {referenceId ? (
                  /* Success Confirmation Screen */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-6 text-center space-y-6"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
                      <CheckCircle2 className="w-9 h-9" />
                    </div>

                    <div className="space-y-1.5">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">
                        Enquiry Submitted Successfully!
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                        Thank you for contacting EduTrack. Our admissions team will review your
                        enquiry and get in touch with you.
                      </p>
                    </div>

                    {/* Official Backend Reference Code */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-sm mx-auto">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1 font-display">
                        Enquiry Reference
                      </span>
                      <div className="text-xl sm:text-2xl font-mono font-black text-indigo-950 tracking-wider">
                        {referenceId}
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-1.5">
                        We will contact you regarding your enquiry.
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                      <Link to="/" className="w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="lg"
                          className="w-full border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs sm:text-sm h-11 rounded-full px-6"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back to Home
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={handleResetForm}
                        className="w-full sm:w-auto text-slate-600 hover:text-slate-900 font-semibold text-xs sm:text-sm h-11 rounded-full"
                      >
                        Submit Another Enquiry
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  /* Enquiry Form */
                  <form
                    onSubmit={handleSubmit(onSubmit, onInvalidSubmit)}
                    className="space-y-7"
                    noValidate
                  >
                    {/* SECTION 01: Parent / Enquirer Details */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                        <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-950 font-bold text-xs flex items-center justify-center border border-indigo-100 shrink-0 font-display">
                          01
                        </span>
                        <div>
                          <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display leading-tight">
                            Parent / Enquirer Details
                          </h2>
                          <p className="text-xs text-slate-500">
                            Provide your contact details so our admissions team can reach out.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Parent Name */}
                        <div className="space-y-1.5">
                          <label
                            htmlFor="parentName"
                            className="text-xs font-bold text-slate-700 block"
                          >
                            Name <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <Input
                            id="parentName"
                            {...parentNameRegister}
                            ref={(e) => {
                              parentNameRegister.ref(e);
                              (fieldRefs.parentName as any).current = e;
                            }}
                            aria-invalid={Boolean(errors.parentName)}
                            aria-describedby={errors.parentName ? 'parentName-error' : undefined}
                            placeholder="Enter full name"
                            className={cn(
                              'h-12 text-sm bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-900 rounded-xl transition-colors',
                              errors.parentName &&
                                'border-rose-500 bg-rose-50/30 focus:ring-rose-500',
                            )}
                          />
                          {errors.parentName && (
                            <p
                              id="parentName-error"
                              className="text-xs text-rose-600 font-semibold mt-1"
                            >
                              {errors.parentName.message}
                            </p>
                          )}
                        </div>

                        {/* Mobile Number */}
                        <div className="space-y-1.5">
                          <label htmlFor="phone" className="text-xs font-bold text-slate-700 block">
                            Mobile Number <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <Input
                            id="phone"
                            {...phoneRegister}
                            ref={(e) => {
                              phoneRegister.ref(e);
                              (fieldRefs.phone as any).current = e;
                            }}
                            aria-invalid={Boolean(errors.phone)}
                            aria-describedby={errors.phone ? 'phone-error' : undefined}
                            placeholder="+91 00000 00000"
                            className={cn(
                              'h-12 text-sm bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-900 rounded-xl transition-colors',
                              errors.phone && 'border-rose-500 bg-rose-50/30 focus:ring-rose-500',
                            )}
                          />
                          {errors.phone && (
                            <p
                              id="phone-error"
                              className="text-xs text-rose-600 font-semibold mt-1"
                            >
                              {errors.phone.message}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Email Address */}
                      <div className="space-y-1.5">
                        <label htmlFor="email" className="text-xs font-bold text-slate-700 block">
                          Email Address
                        </label>
                        <Input
                          id="email"
                          {...emailRegister}
                          ref={(e) => {
                            emailRegister.ref(e);
                            (fieldRefs.email as any).current = e;
                          }}
                          type="email"
                          aria-invalid={Boolean(errors.email)}
                          aria-describedby={errors.email ? 'email-error' : undefined}
                          placeholder="example@email.com"
                          className={cn(
                            'h-12 text-sm bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-900 rounded-xl transition-colors',
                            errors.email && 'border-rose-500 bg-rose-50/30 focus:ring-rose-500',
                          )}
                        />
                        {errors.email && (
                          <p id="email-error" className="text-xs text-rose-600 font-semibold mt-1">
                            {errors.email.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* SECTION 02: Student Details */}
                    <div className="space-y-4 pt-1">
                      <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                        <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-950 font-bold text-xs flex items-center justify-center border border-indigo-100 shrink-0 font-display">
                          02
                        </span>
                        <div>
                          <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display leading-tight">
                            Student Details
                          </h2>
                          <p className="text-xs text-slate-500">
                            Provide prospective student details
                          </p>
                        </div>
                      </div>

                      {/* Student Name */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="studentName"
                          className="text-xs font-bold text-slate-700 block"
                        >
                          Student Name
                        </label>
                        <Input
                          id="studentName"
                          {...studentNameRegister}
                          ref={(e) => {
                            studentNameRegister.ref(e);
                            (fieldRefs.studentName as any).current = e;
                          }}
                          placeholder="Enter student's full name"
                          className="h-12 text-sm bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-900 rounded-xl"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Grade Interested In */}
                        <div className="space-y-1.5">
                          <label
                            htmlFor="studentGrade"
                            className="text-xs font-bold text-slate-700 block"
                          >
                            Grade / Class Interested In
                          </label>
                          <select
                            id="studentGrade"
                            ref={fieldRefs.studentGrade}
                            className="w-full h-12 px-3.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-900 font-medium"
                            onChange={(e) => setValue('studentGrade', e.target.value)}
                          >
                            <option value="">Select Grade</option>
                            {gradesList.map((grade) => (
                              <option key={grade} value={grade}>
                                {grade}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Academic Year */}
                        <div className="space-y-1.5">
                          <label
                            htmlFor="academicYear"
                            className="text-xs font-bold text-slate-700 block"
                          >
                            Academic Year
                          </label>
                          <select
                            id="academicYear"
                            ref={fieldRefs.academicYear}
                            className="w-full h-12 px-3.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-900 font-medium"
                            onChange={(e) => setValue('academicYear', e.target.value)}
                            defaultValue="2026-2027"
                          >
                            <option value="2025-2026">2025 – 2026</option>
                            <option value="2026-2027">2026 – 2027 (Current Intake)</option>
                            <option value="2027-2028">2027 – 2028 (Future Intake)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 03: Your Query */}
                    <div className="space-y-4 pt-1">
                      <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                        <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-950 font-bold text-xs flex items-center justify-center border border-indigo-100 shrink-0 font-display">
                          03
                        </span>
                        <div>
                          <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display leading-tight">
                            Your Query
                          </h2>
                          <p className="text-xs text-slate-500">
                            Select enquiry categories and specify your question
                          </p>
                        </div>
                      </div>

                      {/* Query Type Categories with Radio Buttons */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 block">Query Type</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {queryCategories.map((cat) => {
                            const isSelected = selectedQueryType === cat.id;
                            return (
                              <label
                                key={cat.id}
                                className={cn(
                                  'px-3.5 py-3 rounded-xl text-xs font-bold border transition-all flex items-center gap-2.5 cursor-pointer min-h-[46px] select-none',
                                  isSelected
                                    ? 'bg-slate-900 text-white border-indigo-900 shadow-sm ring-1 ring-amber-400/40'
                                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border-slate-200/90',
                                )}
                              >
                                <input
                                  type="radio"
                                  name="queryType"
                                  value={cat.id}
                                  checked={isSelected}
                                  onChange={() =>
                                    setValue('queryType', cat.id, { shouldValidate: true })
                                  }
                                  className="w-4 h-4 text-amber-400 focus:ring-indigo-500 accent-indigo-600 cursor-pointer shrink-0"
                                />
                                <span
                                  className={cn(
                                    'text-xs font-bold leading-tight',
                                    isSelected ? 'text-amber-300' : 'text-slate-700',
                                  )}
                                >
                                  {cat.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Message / Query Textarea */}
                      <div className="space-y-1.5">
                        <label htmlFor="notes" className="text-xs font-bold text-slate-700 block">
                          Message / Query
                        </label>
                        <Textarea
                          id="notes"
                          {...notesRegister}
                          ref={(e) => {
                            notesRegister.ref(e);
                            (fieldRefs.notes as any).current = e;
                          }}
                          placeholder="Tell us what you'd like to know..."
                          className="min-h-[130px] sm:min-h-[140px] text-sm bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-900 rounded-xl resize-y"
                        />
                        {errors.notes && (
                          <p id="notes-error" className="text-xs text-rose-600 font-semibold mt-1">
                            {errors.notes.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Consent Checkbox */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center h-5 mt-0.5">
                          <input
                            type="checkbox"
                            id="enquiry-consent"
                            ref={fieldRefs.consent}
                            checked={consentValue}
                            onChange={(e) =>
                              setValue('consent', e.target.checked, { shouldValidate: true })
                            }
                            className={cn(
                              'w-4.5 h-4.5 rounded border-slate-300 text-indigo-950 focus:ring-indigo-900 cursor-pointer accent-indigo-950',
                              errors.consent && 'border-rose-500 ring-2 ring-rose-500',
                            )}
                          />
                        </div>
                        <label
                          htmlFor="enquiry-consent"
                          className="text-xs text-slate-600 cursor-pointer leading-relaxed"
                        >
                          I agree to be contacted by the school regarding my admission enquiry.{' '}
                          <span className="text-rose-500 font-bold">*</span>
                        </label>
                      </div>
                      {errors.consent && (
                        <p className="text-xs text-rose-600 font-semibold pl-7">
                          {errors.consent.message}
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2 space-y-2">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        size="lg"
                        className="w-full bg-[#FF6A00] hover:bg-[#e55f00] text-white font-bold h-12 sm:h-13 rounded-full shadow-lg shadow-orange-500/25 text-base transition-all hover:scale-[1.01] cursor-pointer"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Submit Enquiry
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </>
                        )}
                      </Button>
                      <p className="text-[11px] text-slate-500 text-center">
                        Your information will only be used for admission-related communication.
                      </p>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Admissions Support Help Card (~40%) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6 lg:sticky lg:top-28">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
                    How can our admissions team help?
                  </h3>
                </div>

                {/* 4 Feature Sections */}
                <div className="space-y-4 pt-1">
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-amber-400 border border-indigo-400/30 flex items-center justify-center shrink-0">
                      <HelpCircle className="w-4.5 h-4.5 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        Admission guidance
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        Personalized sessions to help you understand our values and culture.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-amber-400 border border-indigo-400/30 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4.5 h-4.5 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        Grade availability
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        Real-time updates on seat availability across all grades.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-amber-400 border border-indigo-400/30 flex items-center justify-center shrink-0">
                      <Award className="w-4.5 h-4.5 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">Fee information</h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        Detailed breakdown of tuition, transport, and ancillary fees.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-amber-400 border border-indigo-400/30 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4.5 h-4.5 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        Application guidance
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        Assistance with documentation and portal navigation.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Need Immediate Help? Contact Card */}
                <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 space-y-3 pt-4">
                  <div className="text-xs font-bold text-white uppercase tracking-wider font-display">
                    Need immediate help?
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Our admissions office is open Monday to Saturday, 9 AM – 5 PM.
                  </p>

                  <div className="space-y-2.5 text-xs pt-1">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Phone
                      </span>
                      <a
                        href={`tel:${SCHOOL_INFO.phone}`}
                        className="flex items-center gap-2 text-slate-200 hover:text-amber-300 font-semibold transition-colors mt-0.5"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{SCHOOL_INFO.phone}</span>
                      </a>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Email
                      </span>
                      <a
                        href={`mailto:${SCHOOL_INFO.email}`}
                        className="flex items-center gap-2 text-slate-200 hover:text-amber-300 font-semibold transition-colors mt-0.5 break-all"
                      >
                        <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{SCHOOL_INFO.email}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Application Feedback Modal */}
      <ApplicationFeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal((prev) => ({ ...prev, isOpen: false }))}
        type={feedbackModal.type}
        title={feedbackModal.title}
        message={feedbackModal.message}
        details={feedbackModal.details}
        invalidCount={feedbackModal.invalidCount}
      />
    </div>
  );
};

export default EnquiryPage;
