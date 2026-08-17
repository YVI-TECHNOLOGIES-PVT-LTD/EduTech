import { z } from 'zod';

export const enquirySchema = z.object({
  parentName: z
    .string({ required_error: 'Please enter your full name' })
    .transform((val) => val.trim())
    .refine((val) => val.length >= 2, {
      message: 'Please enter your full name (at least 2 characters)',
    })
    .refine((val) => val.length <= 100, { message: 'Name is too long (maximum 100 characters)' }),

  phone: z
    .string({ required_error: 'Please enter your phone number' })
    .transform((val) => val.replace(/\s+/g, '').trim())
    .refine((val) => val.length >= 10, {
      message: 'Please enter a valid phone number (at least 10 digits)',
    })
    .refine((val) => val.length <= 15, { message: 'Phone number is too long (maximum 15 digits)' })
    .refine((val) => /^[+\d-]+$/.test(val), { message: 'Please enter a valid phone number' }),

  email: z
    .string({ required_error: 'Please enter your email address' })
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, { message: 'Please enter your email address' })
    .refine((val) => z.string().email().safeParse(val).success, {
      message: 'Please enter a valid email address',
    }),

  studentName: z
    .string()
    .transform((val) => val.trim())
    .optional(),

  studentGrade: z
    .string({ required_error: 'Please select an interested grade' })
    .refine((val) => Boolean(val && val.trim().length > 0), {
      message: 'Please select an interested grade',
    }),

  academicYear: z.string().optional(),

  queryType: z.string().optional(),

  notes: z
    .string()
    .transform((val) => val.trim())
    .optional()
    .refine((val) => !val || val.length <= 500, {
      message: 'Notes must be 500 characters or less',
    }),

  consent: z.boolean().optional().default(true),
});

// `consent` has `.optional().default(true)`, so zod's *input* type (what the
// form fields actually hold before submission) has `consent?: boolean`,
// while the *output* type (what the resolver produces after validation,
// with the default applied) has `consent: boolean`. These are genuinely
// different types — `useForm` needs the input shape, while `onSubmit` /
// `submitEnquiry` need the output shape.
export type EnquiryFormInput = z.input<typeof enquirySchema>;
export type EnquiryFormData = z.output<typeof enquirySchema>;
