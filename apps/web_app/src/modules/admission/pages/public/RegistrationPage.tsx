import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Lock,
  User,
  Mail,
  Phone,
  Loader2,
  ArrowRight,
  UserPlus,
  ShieldCheck,
  Info,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdmissionShell } from '../../components/AdmissionShell';
import { registrationSchema, RegistrationFormData } from '../../schemas/registration.schema';
import { admissionApi } from '@/modules/admission/admission.api';

export const RegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    mode: 'onTouched',
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      mobile: '',
      password: '',
      confirmPassword: '',
      terms: true,
      consent: true,
    },
  });

  const onSubmit = async (data: RegistrationFormData) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`;
      await admissionApi.registerParent({
        full_name: fullName,
        email: data.email.trim(),
        phone: data.mobile.trim(),
        password: data.password,
        source: 'website',
      });

      toast.success('Registration initiated. Verification OTP sent!');
      navigate(
        `/admission/register/otp?email=${encodeURIComponent(data.email.trim())}&phone=${encodeURIComponent(data.mobile.trim())}`,
      );
    } catch (err: any) {
      const errMsg =
        err?.data?.error ||
        err?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Registration failed. Please try again.';
      setApiError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdmissionShell cardContainer={false}>
      <div className="max-w-3xl mx-auto w-full py-4 sm:py-8">
        {/* REGISTRATION CARD CONTAINER */}
        <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-12 shadow-[0_20px_60px_rgba(4,42,43,0.08)] relative overflow-hidden">
          {/* Ambient Background Gradient */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#063F40]/10 via-transparent to-[#E7B76A]/10 rounded-full blur-3xl pointer-events-none" />

          {/* TOP BADGES */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative z-10">
            <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-editorial-cream text-[#063F40] border border-[#063F40]/20 text-xs font-bold">
              <UserPlus className="w-3.5 h-3.5 text-[#063F40]" />
              <span>Create Account</span>
            </div>
            <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-editorial-cream text-[#063F40] border border-[#063F40]/20 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#063F40]" />
              <span>Secure Registration</span>
            </div>
          </div>

          {/* PAGE TITLE */}
          <div className="mb-8 relative z-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#042A2B] dark:text-white tracking-tight">
              Register as a Parent
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Create your account to start and track your child's admission application.
            </p>
          </div>

          {/* API ERROR ALERT */}
          {apiError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          {/* FORM GRID */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* FIELD 1: FIRST NAME */}
              <div>
                <label className="block text-xs font-extrabold text-foreground uppercase tracking-wider mb-1.5">
                  FIRST NAME *
                </label>
                <div className="relative">
                  <Input
                    placeholder="Enter first name"
                    autoComplete="given-name"
                    aria-invalid={errors.firstName ? 'true' : 'false'}
                    {...register('firstName')}
                    className="h-11 rounded-xl pl-10 text-xs font-medium border-border/80 focus-visible:border-[#063F40]"
                  />
                  <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-500 font-semibold">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              {/* FIELD 2: LAST NAME */}
              <div>
                <label className="block text-xs font-extrabold text-foreground uppercase tracking-wider mb-1.5">
                  LAST NAME *
                </label>
                <div className="relative">
                  <Input
                    placeholder="Enter last name"
                    autoComplete="family-name"
                    aria-invalid={errors.lastName ? 'true' : 'false'}
                    {...register('lastName')}
                    className="h-11 rounded-xl pl-10 text-xs font-medium border-border/80 focus-visible:border-[#063F40]"
                  />
                  <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-500 font-semibold">
                    {errors.lastName.message}
                  </p>
                )}
              </div>

              {/* FIELD 3: MOBILE NUMBER */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-extrabold text-foreground uppercase tracking-wider mb-1.5">
                  MOBILE NUMBER *
                </label>
                <div className="flex space-x-2">
                  <div className="h-11 px-3 bg-muted border border-border/80 rounded-xl text-xs font-bold flex items-center text-foreground shrink-0">
                    +91
                  </div>
                  <div className="relative flex-1">
                    <Input
                      type="tel"
                      placeholder="98765 43210"
                      autoComplete="tel"
                      aria-invalid={errors.mobile ? 'true' : 'false'}
                      {...register('mobile')}
                      className="h-11 rounded-xl pl-10 text-xs font-medium border-border/80 focus-visible:border-[#063F40]"
                    />
                    <Phone className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                  </div>
                </div>
                {errors.mobile ? (
                  <p className="mt-1 text-xs text-red-500 font-semibold">{errors.mobile.message}</p>
                ) : (
                  <p className="mt-1.5 flex items-center space-x-1.5 text-[11px] text-muted-foreground">
                    <Info className="w-3.5 h-3.5 text-[#063F40] shrink-0" />
                    <span>An OTP will be sent to this number for verification</span>
                  </p>
                )}
              </div>

              {/* FIELD 4: EMAIL ADDRESS */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-extrabold text-foreground uppercase tracking-wider mb-1.5">
                  EMAIL ADDRESS *
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    aria-invalid={errors.email ? 'true' : 'false'}
                    {...register('email')}
                    className="h-11 rounded-xl pl-10 text-xs font-medium border-border/80 focus-visible:border-[#063F40]"
                  />
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                </div>
                {errors.email ? (
                  <p className="mt-1 text-xs text-red-500 font-semibold">{errors.email.message}</p>
                ) : (
                  <p className="mt-1.5 flex items-center space-x-1.5 text-[11px] text-muted-foreground">
                    <Info className="w-3.5 h-3.5 text-[#063F40] shrink-0" />
                    <span>Application updates and confirmation will be sent here</span>
                  </p>
                )}
              </div>

              {/* FIELD 5: PASSWORD */}
              <div>
                <label className="block text-xs font-extrabold text-foreground uppercase tracking-wider mb-1.5">
                  PASSWORD *
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    aria-invalid={errors.password ? 'true' : 'false'}
                    {...register('password')}
                    className="h-11 rounded-xl pl-10 pr-10 text-xs font-medium border-border/80 focus-visible:border-[#063F40]"
                  />
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500 font-semibold">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* FIELD 6: CONFIRM PASSWORD */}
              <div>
                <label className="block text-xs font-extrabold text-foreground uppercase tracking-wider mb-1.5">
                  CONFIRM PASSWORD *
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                    {...register('confirmPassword')}
                    className="h-11 rounded-xl pl-10 pr-10 text-xs font-medium border-border/80 focus-visible:border-[#063F40]"
                  />
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500 font-semibold">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* FIELD 7: TERMS OF SERVICE CHECKBOX */}
              <div className="sm:col-span-2 p-4 rounded-2xl bg-editorial-mist border border-border/80">
                <label className="flex items-start space-x-3 cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    {...register('terms')}
                    className="mt-1 w-4 h-4 text-[#063F40] border-border rounded focus:ring-[#063F40]"
                  />
                  <span className="text-xs text-foreground font-medium leading-relaxed">
                    I agree to EduTrack's Terms of Service and Privacy Policy. I confirm I am the
                    parent or legal guardian applying on behalf of the child. *
                  </span>
                </label>
                {errors.terms && (
                  <p className="mt-1.5 text-xs text-red-500 font-semibold">
                    {errors.terms.message}
                  </p>
                )}
              </div>

              {/* FIELD 8: COMMUNICATION CONSENT CHECKBOX */}
              <div className="sm:col-span-2 p-4 rounded-2xl bg-editorial-mist border border-border/80">
                <label className="flex items-start space-x-3 cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    {...register('consent')}
                    className="mt-1 w-4 h-4 text-[#063F40] border-border rounded focus:ring-[#063F40]"
                  />
                  <span className="text-xs text-foreground font-medium leading-relaxed">
                    I consent to receiving admission updates, notifications, and important school
                    communications via SMS and email.
                  </span>
                </label>
              </div>

              {/* FIELD 9: SUBMIT BUTTON */}
              <div className="sm:col-span-2 pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-[#E7B76A] hover:bg-[#d8a658] text-[#042A2B] font-extrabold rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md transition-all active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#042A2B]" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account & Continue</span>
                      <ArrowRight className="w-4 h-4 ml-1 text-[#042A2B]" />
                    </>
                  )}
                </Button>
              </div>

              {/* FIELD 10: LOGIN LINK */}
              <div className="sm:col-span-2 text-center pt-4 border-t border-border/60">
                <p className="text-xs text-muted-foreground font-medium">
                  Already registered?{' '}
                  <Link
                    to="/login"
                    className="font-extrabold text-[#063F40] dark:text-[#E7B76A] hover:underline"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AdmissionShell>
  );
};

export default RegistrationPage;
