import React, { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
  ShieldCheck,
  Info,
  AlertCircle,
  CheckCircle2,
  XCircle,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { AuthLayout } from '@/modules/auth/components/AuthLayout';
import { registrationSchema, RegistrationFormData } from '../../schemas/registration.schema';
import { admissionApi } from '@/modules/admission/admission.api';
import { cn } from '@/lib/utils';

export const RegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    control,
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

  const passwordValue = watch('password') || '';
  const confirmPasswordValue = watch('confirmPassword') || '';

  // Password strength and live requirements computation
  const passwordCriteria = useMemo(() => {
    return {
      minLength: passwordValue.length >= 6,
      hasLetter: /[a-zA-Z]/.test(passwordValue),
      hasNumberOrSpecial: /[0-9!@#$%^&*(),.?":{}|<>]/.test(passwordValue),
      passwordsMatch:
        passwordValue.length > 0 &&
        confirmPasswordValue.length > 0 &&
        passwordValue === confirmPasswordValue,
    };
  }, [passwordValue, confirmPasswordValue]);

  const passwordStrength = useMemo(() => {
    if (!passwordValue) return { score: 0, label: '', color: 'bg-muted' };
    let score = 0;
    if (passwordValue.length >= 6) score += 1;
    if (passwordValue.length >= 8) score += 1;
    if (/[A-Z]/.test(passwordValue) && /[a-z]/.test(passwordValue)) score += 1;
    if (/[0-9]/.test(passwordValue) && /[^A-Za-z0-9]/.test(passwordValue)) score += 1;

    if (score <= 1)
      return { score: 1, label: 'Weak', color: 'bg-destructive', text: 'text-destructive' };
    if (score === 2 || score === 3)
      return {
        score: 2,
        label: 'Moderate',
        color: 'bg-amber-500',
        text: 'text-amber-600 dark:text-amber-400',
      };
    return {
      score: 3,
      label: 'Strong',
      color: 'bg-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
    };
  }, [passwordValue]);

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
        'Registration failed. Please check your information and try again.';
      setApiError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      wideCard={true}
      badgeText="Parent Self-Registration"
      title="Create Account"
      subtitle="Set up your secure EduTrack guardian account to track applications and view results."
      backTo={{ label: 'Back to Sign In', href: '/login' }}
    >
      {/* API Error Alert */}
      {apiError && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-start space-x-3 animate-in fade-in duration-200"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* SECTION 1: PERSONAL DETAILS */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 pb-1 border-b border-border/80">
            <UserCheck className="w-4 h-4 text-[#063F40] dark:text-[#E7B76A]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Personal Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* FIRST NAME */}
            <div>
              <label
                htmlFor="first-name-input"
                className="block text-xs font-bold text-foreground mb-1.5"
              >
                First Name <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  id="first-name-input"
                  placeholder="e.g. Robert"
                  autoComplete="given-name"
                  aria-invalid={errors.firstName ? 'true' : 'false'}
                  {...register('firstName')}
                  className="h-11 rounded-xl text-xs font-medium border-border/80 pl-10 focus-visible:border-[#063F40] focus-visible:ring-1 focus-visible:ring-[#063F40] dark:focus-visible:border-[#E7B76A] dark:focus-visible:ring-[#E7B76A] bg-card text-foreground"
                />
                <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
              {errors.firstName && (
                <p className="mt-1.5 text-xs text-destructive font-semibold">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            {/* LAST NAME */}
            <div>
              <label
                htmlFor="last-name-input"
                className="block text-xs font-bold text-foreground mb-1.5"
              >
                Last Name <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  id="last-name-input"
                  placeholder="e.g. Jenkins"
                  autoComplete="family-name"
                  aria-invalid={errors.lastName ? 'true' : 'false'}
                  {...register('lastName')}
                  className="h-11 rounded-xl text-xs font-medium border-border/80 pl-10 focus-visible:border-[#063F40] focus-visible:ring-1 focus-visible:ring-[#063F40] dark:focus-visible:border-[#E7B76A] dark:focus-visible:ring-[#E7B76A] bg-card text-foreground"
                />
                <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
              {errors.lastName && (
                <p className="mt-1.5 text-xs text-destructive font-semibold">
                  {errors.lastName.message}
                </p>
              )}
            </div>

            {/* MOBILE NUMBER */}
            <div className="sm:col-span-2">
              <label
                htmlFor="mobile-input"
                className="block text-xs font-bold text-foreground mb-1.5"
              >
                Mobile Phone Number <span className="text-destructive">*</span>
              </label>
              <Controller
                name="mobile"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    id="mobile-input"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    aria-invalid={errors.mobile ? 'true' : 'false'}
                  />
                )}
              />
              {errors.mobile ? (
                <p className="mt-1.5 text-xs text-destructive font-semibold">
                  {errors.mobile.message}
                </p>
              ) : (
                <p className="mt-1.5 flex items-center space-x-1.5 text-[11px] text-muted-foreground">
                  <Info className="w-3.5 h-3.5 text-[#063F40] dark:text-[#E7B76A] shrink-0" />
                  <span>A 6-digit OTP verification code will be sent to this number</span>
                </p>
              )}
            </div>

            {/* EMAIL ADDRESS */}
            <div className="sm:col-span-2">
              <label
                htmlFor="email-input"
                className="block text-xs font-bold text-foreground mb-1.5"
              >
                Email Address <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  id="email-input"
                  type="email"
                  placeholder="parent@example.com"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  {...register('email')}
                  className="h-11 rounded-xl text-xs font-medium border-border/80 pl-10 focus-visible:border-[#063F40] focus-visible:ring-1 focus-visible:ring-[#063F40] dark:focus-visible:border-[#E7B76A] dark:focus-visible:ring-[#E7B76A] bg-card text-foreground"
                />
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
              {errors.email ? (
                <p className="mt-1.5 text-xs text-destructive font-semibold">
                  {errors.email.message}
                </p>
              ) : (
                <p className="mt-1.5 flex items-center space-x-1.5 text-[11px] text-muted-foreground">
                  <Info className="w-3.5 h-3.5 text-[#063F40] dark:text-[#E7B76A] shrink-0" />
                  <span>Official admissions updates and confirmations will be sent here</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: ACCOUNT SECURITY */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center space-x-2 pb-1 border-b border-border/80">
            <Lock className="w-4 h-4 text-[#063F40] dark:text-[#E7B76A]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Account Security
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* PASSWORD */}
            <div>
              <label
                htmlFor="register-password"
                className="block text-xs font-bold text-foreground mb-1.5"
              >
                Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  autoComplete="new-password"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  {...register('password')}
                  className="h-11 rounded-xl text-xs font-medium border-border/80 pl-10 pr-10 focus-visible:border-[#063F40] focus-visible:ring-1 focus-visible:ring-[#063F40] dark:focus-visible:border-[#E7B76A] dark:focus-visible:ring-[#E7B76A] bg-card text-foreground"
                />
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-destructive font-semibold">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label
                htmlFor="register-confirm-password"
                className="block text-xs font-bold text-foreground mb-1.5"
              >
                Confirm Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  id="register-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                  {...register('confirmPassword')}
                  className="h-11 rounded-xl text-xs font-medium border-border/80 pl-10 pr-10 focus-visible:border-[#063F40] focus-visible:ring-1 focus-visible:ring-[#063F40] dark:focus-visible:border-[#E7B76A] dark:focus-visible:ring-[#E7B76A] bg-card text-foreground"
                />
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-destructive font-semibold">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          {/* PASSWORD LIVE FEEDBACK & STRENGTH INDICATOR */}
          {passwordValue.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 space-y-2.5 animate-in fade-in duration-200">
              {/* Strength bar */}
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-muted-foreground">Password Strength:</span>
                <span className={passwordStrength.text}>{passwordStrength.label}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 h-1.5">
                <div
                  className={cn(
                    'rounded-full transition-all duration-300',
                    passwordStrength.score >= 1 ? passwordStrength.color : 'bg-muted',
                  )}
                />
                <div
                  className={cn(
                    'rounded-full transition-all duration-300',
                    passwordStrength.score >= 2 ? passwordStrength.color : 'bg-muted',
                  )}
                />
                <div
                  className={cn(
                    'rounded-full transition-all duration-300',
                    passwordStrength.score >= 3 ? passwordStrength.color : 'bg-muted',
                  )}
                />
              </div>

              {/* Requirement checks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="flex items-center space-x-1.5">
                  {passwordCriteria.minLength ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span
                    className={
                      passwordCriteria.minLength
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-muted-foreground'
                    }
                  >
                    At least 6 characters
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  {passwordCriteria.hasNumberOrSpecial ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span
                    className={
                      passwordCriteria.hasNumberOrSpecial
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-muted-foreground'
                    }
                  >
                    Contains number or symbol
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: TERMS & CONSENT */}
        <div className="space-y-3 pt-2">
          {/* Terms checkbox */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('terms')}
                className="mt-0.5 w-4 h-4 text-[#063F40] border-border rounded focus:ring-[#063F40] dark:text-[#E7B76A] dark:focus:ring-[#E7B76A]"
              />
              <span className="text-xs text-foreground font-medium leading-relaxed select-none">
                I agree to EduTrack&apos;s{' '}
                <a
                  href="#terms"
                  className="text-[#063F40] dark:text-[#E7B76A] font-extrabold hover:underline"
                >
                  Terms of Service
                </a>{' '}
                and{' '}
                <a
                  href="#privacy"
                  className="text-[#063F40] dark:text-[#E7B76A] font-extrabold hover:underline"
                >
                  Privacy Policy
                </a>
                . I confirm that I am the parent or legal guardian applying for the child.{' '}
                <span className="text-destructive">*</span>
              </span>
            </label>
            {errors.terms && (
              <p className="mt-1.5 text-xs text-destructive font-semibold">
                {errors.terms.message}
              </p>
            )}
          </div>

          {/* Communication consent */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('consent')}
                className="mt-0.5 w-4 h-4 text-[#063F40] border-border rounded focus:ring-[#063F40] dark:text-[#E7B76A] dark:focus:ring-[#E7B76A]"
              />
              <span className="text-xs text-muted-foreground font-medium leading-relaxed select-none">
                I consent to receiving admission updates, examination schedules, and school
                announcements via SMS and email.
              </span>
            </label>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-[#E7B76A] hover:bg-[#d8a658] active:scale-[0.98] text-[#042A2B] font-extrabold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#042A2B]" />
                <span>Creating Parent Account...</span>
              </>
            ) : (
              <>
                <span>Create Account & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>

        {/* LOGIN REDIRECT LINK */}
        <div className="text-center pt-4 border-t border-border/80">
          <p className="text-xs font-medium text-muted-foreground">
            Already registered with EduTrack?{' '}
            <Link
              to="/login"
              className="font-extrabold text-[#063F40] dark:text-[#E7B76A] hover:underline transition-colors"
            >
              Sign In Here
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default RegistrationPage;
