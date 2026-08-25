import { z } from 'zod';

export const createEnquirySchema = z.object({
  student_name: z
    .string()
    .max(100, 'Name must not exceed 100 characters')
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() ? val.trim() : undefined)),
  grade_applied_for: z.string().min(1, 'Grade applied for is required'),
  parent_name: z.string().min(1, 'Parent name is required'),
  parent_email: z
    .string()
    .email('Enter a valid email address')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val && val.trim() ? val.trim() : undefined)),
  parent_phone: z
    .string()
    .transform((val) => (val ? String(val).replace(/[\s\-()]/g, '') : ''))
    .refine(
      (val) => /^\+?[0-9]{7,16}$/.test(val),
      'Enter a valid phone number (e.g. +919876543210)',
    ),
  source: z.string().optional().default('website'),
  date_of_birth: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Date of birth must be a valid date string',
    }),
  gender: z.string().optional().nullable(),
  current_school: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  query_type: z.string().optional().nullable(),
  contact_consent: z.boolean().optional().default(false),
});

export type CreateEnquiryDto = z.infer<typeof createEnquirySchema>;
