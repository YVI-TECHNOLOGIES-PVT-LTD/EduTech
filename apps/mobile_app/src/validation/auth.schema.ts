import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const otpSchema = z.object({
  code: z.string().length(6, 'OTP must be exactly 6 digits'),
});

export type OtpFormData = z.infer<typeof otpSchema>;
