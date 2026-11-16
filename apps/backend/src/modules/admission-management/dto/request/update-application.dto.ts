import { z } from 'zod';
import { application_status } from '../../constants/admission.constants';

export const updateApplicationSchema = z.object({
  status: z.nativeEnum(application_status as any).optional(),
  academic_year_id: z.string().uuid().optional(),
  grade_applied_for: z.string().optional(),
  curriculum_preference: z.string().optional(),
  student_first_name: z.string().optional(),
  student_last_name: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  previous_school_name: z.string().optional(),
  previous_school_address: z.string().optional(),
  previous_school_board: z.string().optional(),
  previous_grade: z.string().optional(),
  previous_school_year: z.string().optional(),
});

export type UpdateApplicationDto = z.infer<typeof updateApplicationSchema>;
