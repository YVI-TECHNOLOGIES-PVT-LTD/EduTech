import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, User, Mail, Phone, GraduationCap, Loader2, ArrowRight, ShieldCheck, HelpCircle, Award, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdmissionShell } from '../components/AdmissionShell';
import { registrationSchema, RegistrationFormData } from '../schemas/registration.schema';
import { admissionApi } from '@/modules/admission/admission.api';
import { SCHOOL_INFO } from '@/lib/public-constants';

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

export const RegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    mode: 'onTouched',
    reValidateMode: 'onChange',
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      studentGrade: '',
      academicYear: '2026-2027',
      password: '',
      confirmPassword: '',
      terms: true,
    },
  });

  const termsValue = watch('terms');

  const onSubmit = async (data: RegistrationFormData) => {
    setIsLoading(true);
    try {
      const payload = {
        parent_name: `${data.firstName} ${data.lastName}`.trim(),
        fullName: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        parent_email: data.email,
        phone: data.phone,
        parent_phone: data.phone,
        password: data.password,
        parent_password: data.password,
        grade_applying_for: data.studentGrade,
        grade: data.studentGrade,
        academic_year: data.academicYear || '2026-2027',
        source: 'ADMISSION_PORTAL_REGISTRATION',
      };

      let res: any;
      try {
        res = await admissionApi.publicApply(payload);
      } catch (err: any) {
        // Fallback retry
        res = await admissionApi.createEnquiry(payload);
      }

      const returnedId =
        res?.data?.application_id ||
        res?.data?.id ||
        res?.data?.reference_code ||
        res?.application_id ||
        `REG-2026-${Math.floor(10000 + Math.random() * 90000)}`;

      // Store temporary registration session state for OTP step
      sessionStorage.setItem(
        'edutrack_registration_session',
        JSON.stringify({
          registrationId: returnedId,
          email: data.email,
          phone: data.phone,
          parentName: `${data.firstName} ${data.lastName}`.trim(),
        })
      );

      toast.success('Registration Initiated', {
        description: 'Verification code sent to your registered mobile/email. Please verify your OTP.',
      });

      // Navigate to OTP verification page
      navigate('/admission/register/otp');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to initiate registration. Please check your details.';
      toast.error('Registration Error', { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const sidePanel = (
    <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6 lg:sticky lg:top-28">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-display">
          Portal Benefits
        </span>
        <h3 className="text-xl sm:text-2xl font-bold font-display text-white mt-1">
          Why create an admission account?
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
          Creating your parent portal account grants full access to track application progress and communicate with counselors.
        </p>
      </div>

      <div className="space-y-4 pt-1">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-amber-400 border border-indigo-400/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4.5 h-4.5 text-amber-400" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white">Application Status Tracking</h4>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Track document verification, interview scheduling, and offer letters in real-time.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-amber-400 border border-indigo-400/30 flex items-center justify-center shrink-0">
            <BookOpen className="w-4.5 h-4.5 text-amber-400" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white">Direct Counselor Desk</h4>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Message admissions officers directly and request campus visits or fee schedules.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-amber-400 border border-indigo-400/30 flex items-center justify-center shrink-0">
            <Award className="w-4.5 h-4.5 text-amber-400" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white">Merit Scholarship Portal</h4>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Apply for academic and sports scholarships directly through your verified portal.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 space-y-2 pt-4 text-xs">
        <div className="font-bold text-white font-display">Already have an account?</div>
        <p className="text-slate-400 leading-relaxed">
          Log in with your existing parent credentials to manage active applications.
        </p>
        <Link to="/login" className="inline-block pt-1">
          <Button variant="outline" size="sm" className="border-slate-700 text-amber-300 hover:bg-slate-800 font-bold text-xs h-9 rounded-full">
            Go to Login →
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <AdmissionShell
      currentStep="register"
      title="Create Parent Account"
      subtitle="Register your parent portal to manage student applications and track admissions."
      badgeText="Academic Intake 2026–27"
      sidePanel={sidePanel}
    >
      <div className="bg-white rounded-3xl p-6 sm:p-9 border border-slate-200/90 shadow-xl shadow-slate-950/5 space-y-7">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-display">Parent Account Registration</h2>
            <p className="text-xs text-slate-500">Step 2 of 4 · Enter your primary details</p>
          </div>
          <span className="text-xs font-bold bg-indigo-50 text-indigo-950 px-3 py-1 rounded-full border border-indigo-100">
            Step 2 / 4
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                First Name <span className="text-rose-500">*</span>
              </label>
              <Input
                {...register('firstName')}
                placeholder="e.g. Eleanor"
                className="h-12 text-sm bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-900 rounded-xl"
              />
              {errors.firstName && (
                <p className="text-xs text-rose-600 font-medium">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <Input
                {...register('lastName')}
                placeholder="e.g. Vance"
                className="h-12 text-sm bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-900 rounded-xl"
              />
              {errors.lastName && (
                <p className="text-xs text-rose-600 font-medium">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <Input
                {...register('email')}
                type="email"
                placeholder="parent@example.com"
                className="h-12 text-sm bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-900 rounded-xl"
              />
              {errors.email && (
                <p className="text-xs text-rose-600 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <Input
                {...register('phone')}
                placeholder="+1 (555) 000-0000"
                className="h-12 text-sm bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-900 rounded-xl"
              />
              {errors.phone && (
                <p className="text-xs text-rose-600 font-medium">{errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* Student Grade & Year */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Grade Applying For <span className="text-rose-500">*</span>
              </label>
              <select
                className="w-full h-12 px-3.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-900 font-medium"
                onChange={(e) => setValue('studentGrade', e.target.value)}
              >
                <option value="">Select Grade Level...</option>
                {gradesList.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
              {errors.studentGrade && (
                <p className="text-xs text-rose-600 font-medium">{errors.studentGrade.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Academic Session</label>
              <select
                className="w-full h-12 px-3.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-900 font-medium"
                onChange={(e) => setValue('academicYear', e.target.value)}
                defaultValue="2026-2027"
              >
                <option value="2026-2027">2026 – 2027 (Current Intake)</option>
                <option value="2027-2028">2027 – 2028 (Future Intake)</option>
              </select>
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Create Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  className="h-12 text-sm bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-900 rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-rose-600 font-medium">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  className="h-12 text-sm bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-900 rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-rose-600 font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* Terms Checkbox */}
          <div className="pt-1 flex items-start gap-3">
            <input
              type="checkbox"
              id="terms-register"
              checked={termsValue}
              onChange={(e) => setValue('terms', e.target.checked)}
              className="w-4.5 h-4.5 rounded border-slate-300 text-indigo-950 focus:ring-indigo-900 cursor-pointer accent-indigo-950 mt-0.5"
            />
            <label htmlFor="terms-register" className="text-xs text-slate-600 cursor-pointer leading-relaxed">
              I agree to the EduTrack parent portal terms of service and privacy policy.
            </label>
          </div>
          {errors.terms && <p className="text-xs text-rose-600 font-medium">{errors.terms.message}</p>}

          {/* Submit Action */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="w-full bg-[#FF6A00] hover:bg-[#e55f00] text-white font-bold h-12 sm:h-13 rounded-full shadow-lg shadow-orange-500/25 text-base transition-all hover:scale-[1.01] cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Proceed to OTP Verification
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdmissionShell>
  );
};

export default RegistrationPage;
