import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address').trim(),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(1, 'Full name is required')
      .min(2, 'Name must be at least 2 characters')
      .trim(),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address')
      .trim(),
    phone: z
      .string()
      .min(1, 'Mobile number is required')
      .regex(/^[0-9+\-\s()]{7,15}$/, 'Please enter a valid phone number')
      .trim(),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only numbers'),
});

export type OtpFormData = z.infer<typeof otpSchema>;

export interface PasswordStrength {
  score: number; // 0 to 3
  label: 'Weak' | 'Medium' | 'Strong';
  color: string;
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password || password.length < 6) {
    return { score: 1, label: 'Weak', color: '#ef4444' };
  }

  let score = 1;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password) && score < 3) score++;

  if (score >= 3) {
    return { score: 3, label: 'Strong', color: '#10b981' };
  }
  if (score === 2) {
    return { score: 2, label: 'Medium', color: '#f59e0b' };
  }
  return { score: 1, label: 'Weak', color: '#ef4444' };
}
