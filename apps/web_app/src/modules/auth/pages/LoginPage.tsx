import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import type { EnrichedUser } from '@/types/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useAppDispatch } from '@/app/store';
import { setCredentials } from '@/shared/store/authSlice';
import { setPermissions } from '@/shared/store/permissionSlice';
import { setActiveTenant } from '@/shared/store/tenantSlice';
import { useLoginMutation } from '@/shared/api/auth.api';
import { ROUTES } from '@/shared/constants/routes';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Please enter your email address')
    .email('Please enter a valid email address'),
  password: z.string().min(1, 'Please enter your password'),
});

type LoginFormData = z.infer<typeof loginSchema>;

import { AdmissionShell } from '@/modules/admission/components/AdmissionShell';

export const LoginPage: React.FC = () => {
  const { user, isAuthenticated, accessToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [loginApi, { isLoading }] = useLoginMutation();

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname || ROUTES.APP.DASHBOARD;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setErrorMessage(null);
      const res = await (loginApi as any)({ email: data.email, password: data.password }).unwrap();
      const rawUser = res.user || res;
      const enrichedUser: EnrichedUser = {
        id: rawUser.id || rawUser.user_id || 'user-1',
        email: rawUser.email || data.email,
        school_id: rawUser.school_id || rawUser.organizationId || rawUser.tenantId || 'school-main',
        roles: Array.isArray(rawUser.roles) ? rawUser.roles : rawUser.role ? [rawUser.role] : ['PARENT'],
        permissions: Array.isArray(rawUser.permissions) ? rawUser.permissions : res.permissions || [],
        full_name: rawUser.full_name || rawUser.firstName || rawUser.name || '',
      };

      dispatch(
        setCredentials({
          user: enrichedUser,
          accessToken: res.accessToken || res.token || 'access-token',
          refreshToken: res.refreshToken || 'refresh-token',
        }),
      );

      if (enrichedUser.permissions) {
        dispatch(
          setPermissions({
            roles: enrichedUser.roles,
            permissions: enrichedUser.permissions,
          }),
        );
      }

      if (enrichedUser.school_id) {
        dispatch(
          setActiveTenant({
            id: enrichedUser.school_id,
          }),
        );
      }

      const role = enrichedUser?.roles?.[0] || (enrichedUser as any)?.role || 'PARENT';
      if (role === 'PARENT') {
        navigate('/app/admissions/my', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      const msg =
        err?.data?.message || err?.message || 'Login failed. Please check your credentials.';
      setErrorMessage(msg);
    }
  };

  return (
    <AdmissionShell
      title="Parent Login"
      subtitle="Sign in to access your Parent Portal"
    >
      <form className="space-y-5 max-w-md mx-auto" onSubmit={handleSubmit(onSubmit)}>
        {errorMessage && (
          <div className="rounded-xl bg-destructive/10 p-4 border border-destructive/20 flex items-start space-x-3 text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold">{errorMessage}</p>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-foreground mb-1.5">
            Email Address
          </label>
          <Input
            type="email"
            placeholder="name@school.com"
            {...register('email')}
            className="h-10 rounded-xl text-xs font-medium border-border/80"
          />
          {errors.email && (
            <p className="mt-1 text-xs font-semibold text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-foreground">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password')}
              className="h-10 rounded-xl text-xs font-medium border-border/80 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs font-semibold text-red-500">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-border/60 text-center space-y-2 max-w-md mx-auto">
        <p className="text-xs font-medium text-muted-foreground">
          Don't have an account?{' '}
          <Link
            to="/admission/register"
            className="font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Register as Parent
          </Link>
        </p>
        <p className="text-xs font-medium text-muted-foreground">
          Need help?{' '}
          <Link to="/contact" className="font-bold text-foreground hover:underline">
            Contact Support
          </Link>
        </p>
      </div>
    </AdmissionShell>
  );
};

export default LoginPage;

