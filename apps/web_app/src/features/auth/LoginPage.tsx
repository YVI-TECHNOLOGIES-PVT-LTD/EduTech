import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import type { EnrichedUser } from '@/types/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail, Eye, EyeOff, Building2, AlertCircle } from 'lucide-react';
import { useAppDispatch } from '@/app/store';
import { setCredentials } from '@/shared/store/authSlice';
import { setActiveTenant } from '@/shared/store/tenantSlice';
import { useLoginMutation } from '@/shared/api/auth.api';
import { ROUTES } from '@/shared/constants/routes';
import { APP_CONFIG } from '@/config/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ButtonLoader } from '@/shared/loading/ButtonLoader';

const loginSchema = z.object({
  email: z.string().min(1, 'Email address is required').email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  tenantId: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [loginApi, { isLoading }] = useLoginMutation();

  const from = (location.state as any)?.from?.pathname || ROUTES.APP.DASHBOARD;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      tenantId: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage(null);
    try {
      // In Stage-1 backend auth, password is passed as passwordHash or plain password depending on API contract
      const result = await loginApi({
        email: data.email,
        passwordHash: data.password,
      }).unwrap();

      if (result.accessToken && result.user) {
        const rawUser = result.user as any;
        const enrichedUser: EnrichedUser = {
          id: rawUser.id,
          email: rawUser.email,
          school_id: rawUser.school_id || rawUser.organizationId || 'org-main',
          roles: rawUser.roles || [rawUser.role || 'ADMIN'],
          permissions: rawUser.permissions || [],
          full_name: `${rawUser.firstName || ''} ${rawUser.lastName || ''}`.trim(),
          login_status: 'APPROVED',
        };

        dispatch(
          setCredentials({
            user: enrichedUser,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          }),
        );

        if (data.tenantId || enrichedUser.school_id) {
          dispatch(
            setActiveTenant({
              id: data.tenantId || enrichedUser.school_id || 'tenant-main',
            }),
          );
        }

        navigate(from, { replace: true });
      }
    } catch (err: any) {
      const msg =
        err?.mapped?.message ||
        err?.data?.message ||
        'Invalid email or password. Please check your credentials.';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-950/80 p-8 shadow-2xl backdrop-blur-xl">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 font-extrabold text-2xl text-white shadow-lg shadow-blue-500/20">
            E
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">{APP_CONFIG.name}</h2>
          <p className="text-xs text-slate-400">Sign in to access your Enterprise Admin Portal</p>
        </div>

        {/* Global Error Alert */}
        {errorMessage && (
          <div className="flex items-center space-x-2 rounded-lg border border-rose-800/50 bg-rose-950/50 p-3 text-xs font-semibold text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-300">
                Password
              </Label>
              <a
                href={ROUTES.AUTH.FORGOT_PASSWORD}
                className="text-[11px] font-semibold text-blue-400 hover:text-blue-300"
              >
                Forgot Password?
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                {...register('password')}
                className="pl-9 pr-9 bg-slate-900 border-slate-800 text-white placeholder-slate-500 text-xs h-10 focus:border-blue-500"
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
            <Label htmlFor="tenantId" className="text-xs font-semibold text-slate-300">
              Institution Code (Optional)
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                id="tenantId"
                placeholder="e.g. CAMPUS-01"
                {...register('tenantId')}
                className="pl-9 bg-slate-900 border-slate-800 text-white placeholder-slate-500 text-xs h-10 focus:border-blue-500"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#FF6A00] hover:bg-[#e55f00] text-white text-xs font-bold h-11 rounded-full shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.01] cursor-pointer"
          >
            {isLoading ? <ButtonLoader className="mr-2" /> : null}
            Sign In to Enterprise Portal
          </Button>
        </form>

        <div className="border-t border-slate-800 pt-4 text-center text-xs text-slate-300 space-y-2">
          <div>
            Don't have an admission account yet?{' '}
            <Link to="/admission/register" className="font-bold text-amber-300 hover:text-amber-200 underline">
              Register Parent Account
            </Link>
          </div>
          <div className="text-[11px] text-slate-500">{APP_CONFIG.copyright}</div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
