import { z } from 'zod';
import { application_status } from '../../constants/admission.constants';

export const createApplicationSchema = z.object({
  lead_id: z.string().uuid('Invalid lead ID').optional(),
  org_id: z.string().uuid('Invalid organization ID').optional(),
  school_id: z.string().uuid('Invalid school ID').optional(),
  academic_year_id: z.string().uuid('Invalid academic year ID').optional(),
  academic_year_grade_id: z.string().uuid('Invalid academic year grade ID').optional(),
  grade_id: z.string().uuid('Invalid grade ID').optional(),
  grade_applied_for: z.string().optional(),
  curriculum_preference: z.string().optional(),
  student_first_name: z.string().optional(),
  student_last_name: z.string().optional(),
  student_name: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  parent_first_name: z.string().optional(),
  parent_last_name: z.string().optional(),
  parent_name: z.string().optional(),
  contact_phone: z.string().optional(),
  parent_phone: z.string().optional(),
  contact_email: z.string().optional(),
  parent_email: z.string().optional(),
  contact_relationship: z.string().optional(),
  previous_school: z.string().optional(),
  remarks: z.string().optional(),
  application_date: z.string().optional(),
  status: z
    .nativeEnum(application_status as any)
    .optional()
    .default(application_status.submitted as any),
});

export type CreateApplicationDto = z.infer<typeof createApplicationSchema>;
