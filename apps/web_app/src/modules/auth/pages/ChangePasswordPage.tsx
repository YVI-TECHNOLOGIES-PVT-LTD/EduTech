import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const schema = z
  .object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export const ChangePasswordForm: React.FC = () => {
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      setError(null);
      await apiClient.post('/auth/change-password', {
        current_password: data.oldPassword,
        new_password: data.newPassword,
      });

      setSuccess(true);
      reset();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to update password. Please verify current password.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      {success && (
        <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Password changed successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center space-x-2 text-xs font-bold">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Current Password
        </label>
        <div className="relative">
          <Input
            type={showOld ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('oldPassword')}
            className="rounded-xl pr-10"
          />
          <button
            type="button"
            onClick={() => setShowOld(!showOld)}
            className="absolute right-3 top-3 text-slate-400"
          >
            {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.oldPassword && (
          <p className="mt-1 text-xs text-red-500 font-semibold">{errors.oldPassword.message}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          New Password
        </label>
        <div className="relative">
          <Input
            type={showNew ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('newPassword')}
            className="rounded-xl pr-10"
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-3 text-slate-400"
          >
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.newPassword && (
          <p className="mt-1 text-xs text-red-500 font-semibold">{errors.newPassword.message}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Confirm New Password
        </label>
        <Input
          type="password"
          placeholder="••••••••"
          {...register('confirmPassword')}
          className="rounded-xl"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-500 font-semibold">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Update Password</span>}
      </Button>
    </form>
  );
};

export default ChangePasswordForm;
