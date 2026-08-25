import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import type { EnrichedUser } from '@/types/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, AlertCircle, ArrowRight, Loader2, Mail, Lock } from 'lucide-react';
import { useAppDispatch } from '@/app/store';
import { setCredentials } from '@/shared/store/authSlice';
import { setPermissions } from '@/shared/store/permissionSlice';
import { setActiveTenant } from '@/shared/store/tenantSlice';
import { useLoginMutation } from '@/shared/api/auth.api';
import { ROUTES } from '@/shared/constants/routes';
import { LandingResolver } from '@/services/LandingResolver';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthLayout } from '../components/AuthLayout';

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Please enter your email address')
    .email('Please enter a valid email address'),
  password: z.string().min(1, 'Please enter your password'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
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
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setErrorMessage(null);
      const res = await (loginApi as any)({ email: data.email, password: data.password }).unwrap();
      const rawUser = res.user || res;
      const rawRoles: string[] = Array.isArray(rawUser.roles)
        ? rawUser.roles
        : rawUser.role
          ? [rawUser.role]
          : ['PARENT'];

      const enrichedUser: EnrichedUser = {
        id: rawUser.id || rawUser.user_id || 'user-1',
        email: rawUser.email || data.email,
        school_id: rawUser.school_id || rawUser.organizationId || rawUser.tenantId || 'school-main',
        roles: rawRoles,
        permissions: Array.isArray(rawUser.permissions)
          ? rawUser.permissions
          : res.permissions || [],
        full_name: rawUser.full_name || rawUser.firstName || rawUser.name || '',
        phone_number: rawUser.phone_number || rawUser.phone,
        login_status: rawUser.login_status || 'APPROVED',
        login_decision_reason: rawUser.login_decision_reason,
        enabledFeatures: rawUser.enabledFeatures,
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

      const targetDestination = LandingResolver.resolveLandingRoute(rawRoles, [], enrichedUser);
      const dest =
        from && from !== '/app' && from !== '/login' && from !== '/app/' ? from : targetDestination;
      navigate(dest, { replace: true });
    } catch (err: any) {
      const status = err?.status || err?.data?.statusCode;
      const rawError =
        typeof err?.data?.error === 'string'
          ? err.data.error
          : typeof err?.data?.message === 'string'
            ? err.data.message
            : typeof err?.message === 'string'
              ? err.message
              : '';

      // Protect end-users from seeing raw internal database/Prisma error strings
      const isTechnicalError =
        typeof rawError === 'string' &&
        (rawError.includes('prisma.') ||
          rawError.includes('findFirst') ||
          rawError.includes('FATAL') ||
          rawError.includes('connection slots') ||
          rawError.includes('pool_size') ||
          rawError.includes('P1001') ||
          rawError.includes('P1002') ||
          rawError.includes('P2002') ||
          rawError.includes('PostgreSQL') ||
          rawError.includes('SQL') ||
          rawError.includes('database server'));

      let displayMessage: string;

      if (status === 503 || isTechnicalError) {
        displayMessage = t(
          'auth.errors.serviceUnavailable',
          'Sign-in is temporarily unavailable. Please try again in a moment.',
        );
      } else if (status === 401) {
        displayMessage = t(
          'auth.errors.invalidCredentials',
          'Invalid email or password. Please check your credentials and try again.',
        );
      } else if (status === 403) {
        displayMessage =
          rawError && !isTechnicalError
            ? rawError
            : t('auth.errors.accessDenied', 'Account access denied or pending approval.');
      } else if (err?.status === 'FETCH_ERROR' || !navigator.onLine) {
        displayMessage = t(
          'auth.errors.networkError',
          'Unable to connect to the server. Please check your internet connection.',
        );
      } else if (rawError && !isTechnicalError && rawError.length < 120) {
        displayMessage = rawError;
      } else {
        displayMessage = t(
          'auth.errors.generic',
          'Unable to sign in right now. Please check your credentials and try again.',
        );
      }

      setErrorMessage(displayMessage);
    }
  };

  return (
    <AuthLayout
      badgeText={t('auth.login.title', 'Institutional Sign In')}
      title={t('auth.login.title', 'Welcome back')}
      subtitle={t(
        'auth.login.subtitle',
        'Sign in to manage your institutional portal and view updates',
      )}
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        {/* Error Alert Message */}
        {errorMessage && (
          <div
            role="alert"
            className="rounded-2xl bg-destructive/10 p-4 border border-destructive/20 flex items-start gap-3 text-destructive animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Email Field */}
        <div>
          <label htmlFor="email-input" className="block text-xs font-bold text-foreground mb-1.5">
            {t('auth.login.emailLabel', 'Email Address')}
          </label>
          <div className="relative">
            <Input
              id="email-input"
              type="email"
              placeholder={t('auth.login.emailPlaceholder', 'parent@example.com')}
              autoComplete="email"
              dir="ltr"
              aria-invalid={errors.email ? 'true' : 'false'}
              {...register('email')}
              className="h-11 rounded-xl text-xs font-medium border-border/80 ps-10 focus-visible:border-[#063F40] focus-visible:ring-1 focus-visible:ring-[#063F40] dark:focus-visible:border-[#E7B76A] dark:focus-visible:ring-[#E7B76A] bg-card text-foreground"
            />
            <Mail className="w-4 h-4 text-muted-foreground absolute start-3.5 top-3.5 pointer-events-none" />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-xs font-semibold text-destructive flex items-center gap-1">
              <span>{errors.email.message}</span>
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password-input" className="block text-xs font-bold text-foreground">
              {t('auth.login.passwordLabel', 'Password')}
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-extrabold text-[#063F40] dark:text-[#E7B76A] hover:underline transition-colors"
            >
              {t('auth.login.forgotPassword', 'Forgot password?')}
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password-input"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              dir="ltr"
              aria-invalid={errors.password ? 'true' : 'false'}
              {...register('password')}
              className="h-11 rounded-xl text-xs font-medium border-border/80 ps-10 pe-10 focus-visible:border-[#063F40] focus-visible:ring-1 focus-visible:ring-[#063F40] dark:focus-visible:border-[#E7B76A] dark:focus-visible:ring-[#E7B76A] bg-card text-foreground"
            />
            <Lock className="w-4 h-4 text-muted-foreground absolute start-3.5 top-3.5 pointer-events-none" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 end-0 pe-3.5 flex items-center text-muted-foreground hover:text-foreground focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs font-semibold text-destructive flex items-center gap-1">
              <span>{errors.password.message}</span>
            </p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center">
          <input
            id="remember-me"
            type="checkbox"
            {...register('rememberMe')}
            className="h-4 w-4 rounded-md border-border text-[#063F40] focus:ring-[#063F40] dark:text-[#E7B76A] dark:focus:ring-[#E7B76A] cursor-pointer"
          />
          <label
            htmlFor="remember-me"
            className="ms-2 block text-xs font-bold text-foreground cursor-pointer"
          >
            {t('auth.login.rememberMe', 'Remember this device for 30 days')}
          </label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 rounded-xl bg-foreground text-background font-bold text-xs shadow-md hover:bg-foreground/90 transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t('auth.login.signingIn', 'Signing In...')}</span>
            </>
          ) : (
            <>
              <span>{t('auth.login.signInButton', 'Sign In')}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>

      {/* Footer Navigation Links */}
      <div className="mt-8 pt-6 border-t border-border/80 text-center space-y-3">
        <p className="text-xs font-medium text-muted-foreground">
          Don&apos;t have a parent account?{' '}
          <Link
            to="/admission/register"
            className="font-extrabold text-[#063F40] dark:text-[#E7B76A] hover:underline transition-colors"
          >
            Create Account
          </Link>
        </p>
        <p className="text-xs font-medium text-muted-foreground">
          Having trouble accessing your account?{' '}
          <Link
            to="/contact"
            className="font-extrabold text-foreground hover:underline transition-colors"
          >
            Contact School Support
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
