import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, Mail, Phone, Loader2, ArrowRight } from 'lucide-react';
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    mode: 'onTouched',
    resolver: zodResolver(registrationSchema),
  });

  const onSubmit = async (data: RegistrationFormData) => {
    setIsLoading(true);
    try {
      const res = await admissionApi.registerParent({
        full_name: data.fullName,
        email: data.email,
        phone: data.mobile,
        password: data.password,
      });

      toast.success('Registration initiated. Verification OTP sent!');
      navigate(
        `/admission/register/otp?email=${encodeURIComponent(data.email)}&phone=${encodeURIComponent(data.mobile)}`,
      );
    } catch (err: any) {
      toast.error(err?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdmissionShell
      currentStep="register"
      title="Create Guardian Account"
      subtitle="Register to apply for your child's admission"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg mx-auto">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Full Name
          </label>
          <div className="relative">
            <Input placeholder="John Doe" {...register('fullName')} className="rounded-xl pl-10" />
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          </div>
          {errors.fullName && (
            <p className="mt-1 text-xs text-red-500 font-semibold">{errors.fullName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Email Address
          </label>
          <div className="relative">
            <Input
              type="email"
              placeholder="john@example.com"
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
            <Input placeholder="9876543210" {...register('mobile')} className="rounded-xl pl-10" />
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          </div>
          {errors.mobile && (
            <p className="mt-1 text-xs text-red-500 font-semibold">{errors.mobile.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Password
          </label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password')}
              className="rounded-xl pl-10 pr-10"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-slate-400"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-500 font-semibold">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('confirmPassword')}
              className="rounded-xl pl-10 pr-10"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3.5 text-slate-400"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500 font-semibold">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center space-x-2"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Create Account</span>}
          <ArrowRight className="w-4 h-4" />
        </Button>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500 font-medium">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-indigo-600 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </form>
    </AdmissionShell>
  );
};

export default RegistrationPage;
