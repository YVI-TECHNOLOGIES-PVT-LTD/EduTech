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
      const errMsg =
        err?.data?.error ||
        err?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Registration failed. Please try again.';
      toast.error(errMsg);
    } finally {

      setIsLoading(false);
    }
  };

  return (
    <AdmissionShell
      title="Create Guardian Account"
      subtitle="Register to apply for your child's admission"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md mx-auto">
        <div>
          <label className="block text-xs font-bold text-foreground mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <Input placeholder="John Doe" {...register('fullName')} className="h-10 rounded-xl pl-10 text-xs font-medium border-border/80" />
            <User className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
          </div>
          {errors.fullName && (
            <p className="mt-1 text-xs text-red-500 font-semibold">{errors.fullName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-foreground mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Input
              type="email"
              placeholder="john@example.com"
              {...register('email')}
              className="h-10 rounded-xl pl-10 text-xs font-medium border-border/80"
            />
            <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-red-500 font-semibold">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-foreground mb-1.5">
            Mobile Number
          </label>
          <div className="relative">
            <Input placeholder="9876543210" {...register('mobile')} className="h-10 rounded-xl pl-10 text-xs font-medium border-border/80" />
            <Phone className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
          </div>
          {errors.mobile && (
            <p className="mt-1 text-xs text-red-500 font-semibold">{errors.mobile.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                className="h-10 rounded-xl pl-10 pr-10 text-xs font-medium border-border/80"
              />
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500 font-semibold">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('confirmPassword')}
                className="h-10 rounded-xl pl-10 pr-10 text-xs font-medium border-border/80"
              />
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
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
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 bg-[#063F40] hover:bg-[#082F35] text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md mt-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#E7B76A]" />
          ) : (
            <span className="text-[#E7B76A]">Create Account</span>
          )}
          <ArrowRight className="w-3.5 h-3.5 text-[#E7B76A]" />
        </Button>

        <div className="text-center pt-3 border-t border-border/60">
          <p className="text-xs text-muted-foreground font-medium">
            Already registered?{' '}
            <Link to="/login" className="font-extrabold text-[#063F40] dark:text-emerald-400 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </form>
    </AdmissionShell>
  );
};

export default RegistrationPage;
