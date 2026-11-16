import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useForgotPasswordMutation } from '@/shared/api/auth.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthLayout } from '../components/AuthLayout';

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
});

type FormData = z.infer<typeof schema>;

export const ForgotPasswordPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [forgotPasswordApi, { isLoading }] = useForgotPasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      await forgotPasswordApi({ email: data.email }).unwrap();
      setSubmittedEmail(data.email);
      setSubmitted(true);
    } catch (err: any) {
      setError(
        err?.data?.message ||
          err?.data?.error ||
          err?.message ||
          'Failed to send password reset link. Please try again.',
      );
    }
  };

  return (
    <AuthLayout
      badgeText="Account Recovery"
      title="Forgot Password?"
      subtitle="Enter your registered email address to receive password reset instructions"
      backTo={{ label: 'Back to Sign In', href: '/login' }}
    >
      {submitted ? (
        <div className="text-center py-2 space-y-6">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-900 shadow-sm">
            <CheckCircle2 className="w-9 h-9 text-emerald-600 dark:text-emerald-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-foreground">Check Your Inbox</h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              We have sent password reset instructions to{' '}
              <strong className="text-foreground font-semibold">{submittedEmail}</strong> if an
              account exists.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 text-xs text-muted-foreground leading-relaxed">
            Please check your spam or junk folder if you do not see the email within a few minutes.
          </div>

          <div className="pt-2">
            <Link to="/login" className="block w-full">
              <Button className="w-full h-12 bg-[#E7B76A] hover:bg-[#d8a658] active:scale-[0.98] text-[#042A2B] font-extrabold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2">
                <span>Return to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <div
              role="alert"
              className="rounded-2xl bg-destructive/10 p-4 border border-destructive/20 flex items-start space-x-3 text-destructive animate-in fade-in duration-200"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold leading-relaxed">{error}</p>
            </div>
          )}

          <div>
            <label
              htmlFor="recovery-email"
              className="block text-xs font-bold text-foreground mb-1.5"
            >
              Registered Email Address
            </label>
            <div className="relative">
              <Input
                id="recovery-email"
                type="email"
                placeholder="parent@example.com"
                autoComplete="email"
                aria-invalid={errors.email ? 'true' : 'false'}
                {...register('email')}
                className="h-11 rounded-xl text-xs font-medium border-border/80 pl-10 focus-visible:border-[#063F40] focus-visible:ring-1 focus-visible:ring-[#063F40] dark:focus-visible:border-[#E7B76A] dark:focus-visible:ring-[#E7B76A] bg-card text-foreground"
              />
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-xs text-destructive font-semibold">
                {errors.email.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-[#E7B76A] hover:bg-[#d8a658] active:scale-[0.98] text-[#042A2B] font-extrabold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#042A2B]" />
                <span>Sending Reset Link...</span>
              </>
            ) : (
              <>
                <span>Send Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          <div className="text-center pt-4 border-t border-border/80">
            <Link
              to="/login"
              className="inline-flex items-center space-x-1.5 text-xs font-extrabold text-[#063F40] dark:text-[#E7B76A] hover:underline transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Remember your password? Sign In</span>
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
