import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useForgotPasswordMutation } from '@/shared/api/auth.api';
import { ROUTES } from '@/shared/constants/routes';
import { APP_CONFIG } from '@/config/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ButtonLoader } from '@/shared/loading/ButtonLoader';

const schema = z.object({
  email: z.string().min(1, 'Email address is required').email('Enter a valid email address'),
});

type FormData = z.infer<typeof schema>;

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
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
      await forgotPasswordApi({ email: data.email }).unwrap();
      setIsSuccess(true);
    } catch {
      // Show success anyway for security / enumeration protection
      setIsSuccess(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 font-extrabold text-2xl text-white shadow-lg">
            E
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Reset Your Password</h2>
          <p className="text-xs text-slate-400">
            Enter your registered email address to receive password recovery instructions.
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-4 rounded-xl border border-emerald-800/50 bg-emerald-950/40 p-5 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Recovery Instructions Sent</h4>
            <p className="text-xs text-slate-300">
              If an account matches that email address, password reset instructions have been sent.
            </p>
            <Button
              onClick={() => navigate(ROUTES.AUTH.LOGIN)}
              className="mt-2 w-full bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
            >
              Return to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-300">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@institution.edu"
                  {...register('email')}
                  className="pl-9 bg-slate-900 border-slate-800 text-white placeholder-slate-500 text-xs h-10 focus:border-blue-500"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] font-medium text-rose-400">{errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold h-10 shadow-lg"
            >
              {isLoading ? <ButtonLoader className="mr-2" /> : null}
              Send Recovery Email
            </Button>
          </form>
        )}

        <div className="flex items-center justify-center pt-2">
          <button
            onClick={() => navigate(ROUTES.AUTH.LOGIN)}
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
