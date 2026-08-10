import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, GraduationCap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { enquirySchema, EnquiryFormData } from '../schemas/enquiry.schema';
import { useAdmission } from '../hooks/useAdmission';
import { ApplicationFeedbackModal } from '@/modules/admission/components/ApplicationFeedbackModal';
import { cn } from '@/lib/utils';

interface QuickEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export const QuickEnquiryModal: React.FC<QuickEnquiryModalProps> = ({ isOpen, onClose }) => {
  const { submitEnquiry, isLoading, referenceId, resetEnquiry } = useAdmission();
  const navigate = useNavigate();

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

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EnquiryFormData>({
    mode: 'onTouched',
    reValidateMode: 'onChange',
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      parentName: '',
      email: '',
      phone: '',
      studentGrade: '',
      academicYear: '2026-2027',
      notes: '',
      consent: true,
    },
  });

  const onInvalidSubmit = (fieldErrors: any) => {
    const count = Object.keys(fieldErrors).length;
    setFeedbackModal({
      isOpen: true,
      type: 'validation',
      title: 'Please Complete Required Fields',
      message: 'Please review the highlighted fields before sending your enquiry.',
      invalidCount: count,
    });
  };

  const onSubmit = async (data: EnquiryFormData) => {
    const result = await submitEnquiry(data);
    if (result.success) {
      const refCode = result.reference || `ENQ-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      sessionStorage.setItem(
        'edutrack_enquiry_session',
        JSON.stringify({ referenceId: refCode, parentName: data.parentName })
      );
      reset();
    } else {
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'Enquiry Not Submitted',
        message: result.error || "We couldn't submit your enquiry right now. Please try again.",
      });
    }
  };

  const handleModalClose = () => {
    reset();
    resetEnquiry();
    onClose();
  };

  const handleGoToSuccessPage = () => {
    handleModalClose();
    navigate('/admission/enquiry/success');
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-md max-w-[calc(100vw-24px)] max-h-[90vh] overflow-y-auto bg-white text-slate-900 border-slate-200 p-5 sm:p-6 rounded-2xl shadow-2xl">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-950 text-amber-400 flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <DialogTitle className="text-xl font-bold font-display text-slate-900">
                Quick Admission Enquiry
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Submit your contact details and our admissions counseling team will reach out within 24 hours.
            </DialogDescription>
          </DialogHeader>

          {referenceId ? (
            /* Success Screen */
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  Enquiry Received!
                </h3>
                <p className="text-xs text-slate-600">
                  Thank you for your interest in EduTrack. Your enquiry reference code is:
                </p>
                <div className="inline-block bg-slate-100 text-indigo-950 font-mono font-bold text-sm px-4 py-1.5 rounded-lg border border-slate-300 mt-2">
                  {referenceId}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  className="w-1/2 border-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
                  onClick={handleGoToSuccessPage}
                >
                  View Details
                </Button>
                <Button
                  className="bg-slate-900 hover:bg-slate-800 text-white w-1/2 font-bold text-xs cursor-pointer"
                  onClick={handleModalClose}
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            /* Form Screen */
            <form onSubmit={handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-4 pt-2" noValidate>
              {/* Parent Name */}
              <div className="space-y-1">
                <label htmlFor="quick-parentName" className="text-xs font-bold text-slate-700 block">
                  Parent / Guardian Name <span className="text-rose-500 font-bold">*</span>
                </label>
                <Input
                  id="quick-parentName"
                  {...register('parentName')}
                  placeholder="Enter full name"
                  aria-invalid={Boolean(errors.parentName)}
                  aria-describedby={errors.parentName ? 'quick-parentName-error' : undefined}
                  className={cn('text-xs h-9', errors.parentName && 'border-rose-500 bg-rose-50/30')}
                />
                {errors.parentName && (
                  <p id="quick-parentName-error" className="text-[11px] text-rose-600 font-medium">
                    {errors.parentName.message}
                  </p>
                )}
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="quick-email" className="text-xs font-bold text-slate-700 block">
                    Email Address <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <Input
                    id="quick-email"
                    {...register('email')}
                    type="email"
                    placeholder="example@email.com"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'quick-email-error' : undefined}
                    className={cn('text-xs h-9', errors.email && 'border-rose-500 bg-rose-50/30')}
                  />
                  {errors.email && (
                    <p id="quick-email-error" className="text-[11px] text-rose-600 font-medium">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="quick-phone" className="text-xs font-bold text-slate-700 block">
                    Phone Number <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <Input
                    id="quick-phone"
                    {...register('phone')}
                    placeholder="+91 00000 00000"
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? 'quick-phone-error' : undefined}
                    className={cn('text-xs h-9', errors.phone && 'border-rose-500 bg-rose-50/30')}
                  />
                  {errors.phone && (
                    <p id="quick-phone-error" className="text-[11px] text-rose-600 font-medium">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Interested Grade */}
              <div className="space-y-1">
                <label htmlFor="quick-studentGrade" className="text-xs font-bold text-slate-700 block">
                  Interested Grade <span className="text-rose-500 font-bold">*</span>
                </label>
                <select
                  id="quick-studentGrade"
                  className={cn(
                    'w-full h-9 px-3 rounded-md border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-900',
                    errors.studentGrade && 'border-rose-500 bg-rose-50/30'
                  )}
                  onChange={(e) => setValue('studentGrade', e.target.value, { shouldValidate: true })}
                >
                  <option value="">Select Grade</option>
                  {gradesList.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
                {errors.studentGrade && (
                  <p className="text-[11px] text-rose-600 font-medium">
                    {errors.studentGrade.message}
                  </p>
                )}
              </div>

              {/* Optional Notes */}
              <div className="space-y-1">
                <label htmlFor="quick-notes" className="text-xs font-bold text-slate-700 block">
                  Additional Questions / Notes (Optional)
                </label>
                <Textarea
                  id="quick-notes"
                  {...register('notes')}
                  placeholder="Specify any questions about transportation, scholarships, or syllabus..."
                  rows={3}
                  className="text-xs resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleModalClose}
                  className="text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs min-w-[120px] cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Send Enquiry'
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ApplicationFeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal((prev) => ({ ...prev, isOpen: false }))}
        type={feedbackModal.type}
        title={feedbackModal.title}
        message={feedbackModal.message}
        details={feedbackModal.details}
        invalidCount={feedbackModal.invalidCount}
      />
    </>
  );
};

export default QuickEnquiryModal;
