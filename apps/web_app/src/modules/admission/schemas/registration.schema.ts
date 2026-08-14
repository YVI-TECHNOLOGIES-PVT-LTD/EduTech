import { z } from 'zod';

export const registrationSchema = z
  .object({
    firstName: z.string().min(2, 'First Name is required'),
    lastName: z.string().min(1, 'Last Name is required'),
    email: z.string().email('Please enter a valid email address'),
    mobile: z
      .string()
      .min(10, 'Valid mobile number is required')
      .regex(/^\+?[0-9\s\-]{10,15}$/, 'Enter a valid mobile number'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    terms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the Terms of Service to create an account' }),
    }),
    consent: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type RegistrationFormData = z.infer<typeof registrationSchema>;
