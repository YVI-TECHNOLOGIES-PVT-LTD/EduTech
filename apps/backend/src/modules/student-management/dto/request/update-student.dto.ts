import { z } from 'zod';
import { gender_type, enrollment_status } from '../../constants/student.constants';

export const updateStudentSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().optional().nullable(),
  dob: z.string().optional().nullable(),
  gender: z.nativeEnum(gender_type as any).optional().nullable(),
  admission_date: z.string().optional().nullable(),
  status: z.nativeEnum(enrollment_status as any).optional(),
  user_id: z.string().uuid().optional().nullable(),
});

export type UpdateStudentDto = z.infer<typeof updateStudentSchema>;
