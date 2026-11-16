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
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ChangePasswordFields = z.infer<typeof schema>;

interface ChangePasswordFormProps {
  onSuccess?: () => void;
}

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ onSuccess }) => {
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFields>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: ChangePasswordFields) => {
    setIsLoading(true);
    try {
      setError(null);
      await apiClient.post('/auth/change-password', {
        current_password: data.oldPassword,
        new_password: data.newPassword,
      });

      setSuccess(true);
      reset();
      if (onSuccess) onSuccess();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to update password. Please verify your current password.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      {success && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 rounded-2xl flex items-center space-x-2 text-xs font-bold animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Password changed successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-2xl flex items-center space-x-2 text-xs font-bold animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-foreground mb-1.5">Current Password</label>
        <div className="relative">
          <Input
            type={showOld ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('oldPassword')}
            className="h-11 rounded-xl text-xs font-medium border-border/80 pl-10 pr-10 focus-visible:border-[#063F40] focus-visible:ring-1 focus-visible:ring-[#063F40] dark:focus-visible:border-[#E7B76A] dark:focus-visible:ring-[#E7B76A] bg-card text-foreground"
          />
          <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5 pointer-events-none" />
          <button
            type="button"
            onClick={() => setShowOld(!showOld)}
            aria-label={showOld ? 'Hide current password' : 'Show current password'}
            className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground focus:outline-none"
          >
            {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.oldPassword && (
          <p className="mt-1.5 text-xs text-destructive font-semibold">
            {errors.oldPassword.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold text-foreground mb-1.5">New Password</label>
        <div className="relative">
          <Input
            type={showNew ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('newPassword')}
            className="h-11 rounded-xl text-xs font-medium border-border/80 pl-10 pr-10 focus-visible:border-[#063F40] focus-visible:ring-1 focus-visible:ring-[#063F40] dark:focus-visible:border-[#E7B76A] dark:focus-visible:ring-[#E7B76A] bg-card text-foreground"
          />
          <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5 pointer-events-none" />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            aria-label={showNew ? 'Hide new password' : 'Show new password'}
            className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground focus:outline-none"
          >
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.newPassword && (
          <p className="mt-1.5 text-xs text-destructive font-semibold">
            {errors.newPassword.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold text-foreground mb-1.5">
          Confirm New Password
        </label>
        <div className="relative">
          <Input
            type={showConfirm ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('confirmPassword')}
            className="h-11 rounded-xl text-xs font-medium border-border/80 pl-10 pr-10 focus-visible:border-[#063F40] focus-visible:ring-1 focus-visible:ring-[#063F40] dark:focus-visible:border-[#E7B76A] dark:focus-visible:ring-[#E7B76A] bg-card text-foreground"
          />
          <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5 pointer-events-none" />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
            className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground focus:outline-none"
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1.5 text-xs text-destructive font-semibold">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="h-11 px-6 bg-[#E7B76A] hover:bg-[#d8a658] active:scale-[0.98] text-[#042A2B] font-extrabold rounded-xl text-xs shadow-md"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#042A2B]" />
        ) : (
          <span>Update Password</span>
        )}
      </Button>
    </form>
  );
};

export default ChangePasswordForm;
