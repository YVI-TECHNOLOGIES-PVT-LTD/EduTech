import { z } from 'zod';
import { application_status } from '../../constants/admission.constants';

export const createApplicationSchema = z.object({
  lead_id: z.string().optional().nullable(),
  org_id: z.string().optional().nullable(),
  school_id: z.string().optional().nullable(),
  academic_year_id: z.string().optional().nullable(),
  academic_year_grade_id: z.string().optional().nullable(),
  grade_id: z.string().optional().nullable(),
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
  nationality: z.string().optional(),
  previous_school: z.string().optional(),
  previous_school_name: z.string().optional(),
  previous_school_address: z.string().optional(),
  previous_school_board: z.string().optional(),
  previous_grade: z.string().optional(),
  previous_school_year: z.string().optional(),
  remarks: z.string().optional(),
  scholarship_interest: z.boolean().optional(),
  is_new_child: z.boolean().optional(),
  application_date: z.string().optional(),
  status: z
    .nativeEnum(application_status as any)
    .optional()
    .default(application_status.submitted as any),
});

export type CreateApplicationDto = z.infer<typeof createApplicationSchema>;
