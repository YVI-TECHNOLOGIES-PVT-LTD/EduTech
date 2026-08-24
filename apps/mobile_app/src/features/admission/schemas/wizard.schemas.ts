import { z } from 'zod';

export const studentDetailsSchema = z.object({
  student_first_name: z
    .string()
    .min(1, 'Student first name is required')
    .min(2, 'First name must be at least 2 characters')
    .trim(),
  student_last_name: z
    .string()
    .min(1, 'Student last name is required')
    .min(1, 'Last name is required')
    .trim(),
  date_of_birth: z
    .string()
    .min(1, 'Date of birth is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date < new Date();
    }, 'Date of birth must be a valid past date'),
  gender: z.enum(['male', 'female', 'other', 'undisclosed'], {
    errorMap: () => ({ message: 'Please select student gender' }),
  }),
  nationality: z.string().min(1, 'Nationality is required').default('Indian'),
});

export type StudentDetailsFormData = z.infer<typeof studentDetailsSchema>;

export const parentDetailsSchema = z.object({
  parent_name: z
    .string()
    .min(1, 'Parent/Guardian full name is required')
    .min(2, 'Name must be at least 2 characters')
    .trim(),
  parent_email: z
    .string()
    .min(1, 'Primary email address is required')
    .email('Please enter a valid email address')
    .trim(),
  parent_phone: z
    .string()
    .min(1, 'Primary phone number is required')
    .regex(/^[0-9+\-\s()]{7,15}$/, 'Please enter a valid mobile number')
    .trim(),
  contact_relationship: z.enum(['father', 'mother', 'guardian', 'grandparent', 'other'], {
    errorMap: () => ({ message: 'Please select your relationship to the student' }),
  }),
  parent_occupation: z.string().optional(),
});

export type ParentDetailsFormData = z.infer<typeof parentDetailsSchema>;

export const academicsSchema = z.object({
  school_id: z.string().optional(),
  academic_year_id: z.string().optional(),
  academic_year_grade_id: z.string().optional(),
  grade_id: z.string().optional(),
  grade_applied_for: z.string().min(1, 'Please select the grade applied for'),
  curriculum_preference: z.string().default('CBSE'),
  previous_school_name: z.string().optional(),
  previous_school_address: z.string().optional(),
  previous_school_board: z.string().optional(),
  previous_grade: z.string().optional(),
  previous_school_year: z.string().optional(),
});

export type AcademicsFormData = z.infer<typeof academicsSchema>;

export const declarationSchema = z.object({
  payment_mode: z.enum(['upi', 'card', 'netbanking', 'cash', 'bank_transfer']).default('upi'),
  declaration_accepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the admission declaration before submitting.',
  }),
});

export type DeclarationFormData = z.infer<typeof declarationSchema>;

export interface FullWizardState {
  currentStep: number;
  instructionsAccepted: boolean;
  student: StudentDetailsFormData;
  parent: ParentDetailsFormData;
  academics: AcademicsFormData;
  documents: Record<string, { uri: string; name: string; type: string; size?: number }>;
  declaration: DeclarationFormData;
  createdAppId?: string;
}
