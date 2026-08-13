import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone, BookOpen, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdmissionShell } from '../../components/AdmissionShell';
import { admissionApi } from '@/modules/admission/admission.api';

const enquirySchema = z.object({
  parent_name: z.string().min(2, 'Parent name is required'),
  email: z.string().email('Valid email address is required'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  grade_applied_for: z.string().min(1, 'Please select grade'),
  message: z.string().optional(),
});

type EnquiryFormData = z.infer<typeof enquirySchema>;

export const EnquiryPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EnquiryFormData>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      grade_applied_for: 'Grade 1',
    },
  });

  const onSubmit = async (data: EnquiryFormData) => {
    setIsLoading(true);
    try {
      const res = await admissionApi.createEnquiry({
        parent_name: data.parent_name,
        email: data.email,
        phone: data.phone,
        grade_applied_for: data.grade_applied_for,
        message: data.message || '',
      });

      toast.success('Enquiry submitted successfully!');
      const refNo = res?.reference_number || res?.inquiry_number || 'ENQ-2026';
      navigate(`/admission/enquiry/success?ref=${encodeURIComponent(refNo)}`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to submit enquiry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdmissionShell
      currentStep="enquiry"
      title="Admission Enquiry"
      subtitle="Fill in your details to get in touch with our admissions team"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg mx-auto">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Guardian Name
          </label>
          <div className="relative">
            <Input
              placeholder="Parent / Guardian Name"
              {...register('parent_name')}
              className="rounded-xl pl-10"
            />
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          </div>
          {errors.parent_name && (
            <p className="mt-1 text-xs text-red-500 font-semibold">{errors.parent_name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Input
                type="email"
                placeholder="name@domain.com"
                {...register('email')}
                className="rounded-xl pl-10"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-500 font-semibold">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Mobile Number
            </label>
            <div className="relative">
              <Input placeholder="9876543210" {...register('phone')} className="rounded-xl pl-10" />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
            {errors.phone && (
              <p className="mt-1 text-xs text-red-500 font-semibold">{errors.phone.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Seeking Grade Admission
          </label>
          <select
            {...register('grade_applied_for')}
            className="w-full h-11 px-3 py-2 bg-white dark:bg-card border border-slate-200 dark:border-border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
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
          </select>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <span>Submit Admission Enquiry</span>
          )}
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </AdmissionShell>
  );
};

export default EnquiryPage;
