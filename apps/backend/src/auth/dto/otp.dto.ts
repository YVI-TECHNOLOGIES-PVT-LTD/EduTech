import { z } from 'zod';
import { isValidPhone, normalizePhone } from '../../utils/phone.utils';

export const requestOtpSchema = z.object({
  orgId: z.string().uuid('Organization ID must be a valid UUID'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .refine((val) => isValidPhone(val), {
      message: 'Invalid phone number format. Must be a valid 10-15 digit mobile number.',
    })
    .transform((val) => normalizePhone(val)),
});

export type RequestOtpDto = z.infer<typeof requestOtpSchema>;

export const verifyOtpSchema = z.object({
  orgId: z.string().uuid('Organization ID must be a valid UUID'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .refine((val) => isValidPhone(val), {
      message: 'Invalid phone number format. Must be a valid 10-15 digit mobile number.',
    })
    .transform((val) => normalizePhone(val)),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain digits only'),
});

export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;
