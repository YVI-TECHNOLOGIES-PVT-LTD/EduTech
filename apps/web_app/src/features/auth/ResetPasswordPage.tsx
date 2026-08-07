import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { useResetPasswordMutation } from '@/shared/api/auth.api';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ButtonLoader } from '@/shared/loading/ButtonLoader';

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [resetPasswordApi, { isLoading }] = useResetPasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setErrorMessage(null);
    try {
      await resetPasswordApi({
        token,
        newPasswordHash: data.password,
      }).unwrap();
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(
        err?.mapped?.message || 'Failed to reset password. The link may have expired.',
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 font-extrabold text-2xl text-white shadow-lg">
            E
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Create New Password</h2>
          <p className="text-xs text-slate-400">Set a strong new password for your account.</p>
        </div>

        {errorMessage && (
          <div className="flex items-center space-x-2 rounded-lg border border-rose-800/50 bg-rose-950/50 p-3 text-xs font-semibold text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-4 rounded-xl border border-emerald-800/50 bg-emerald-950/40 p-5 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Password Changed Successfully</h4>
            <p className="text-xs text-slate-300">
              Your password has been updated. You can now sign in with your new credentials.
            </p>
            <Button
              onClick={() => navigate(ROUTES.AUTH.LOGIN)}
              className="mt-2 w-full bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white"
            >
              Proceed to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-300">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  {...register('password')}
                  className="pl-9 pr-9 bg-slate-900 border-slate-800 text-white placeholder-slate-500 text-xs h-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] font-medium text-rose-400">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-300">
                Confirm New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  {...register('confirmPassword')}
                  className="pl-9 bg-slate-900 border-slate-800 text-white placeholder-slate-500 text-xs h-10"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-[11px] font-medium text-rose-400">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold h-10 shadow-lg"
            >
              {isLoading ? <ButtonLoader className="mr-2" /> : null}
              Update Password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
