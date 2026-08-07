import { z } from 'zod';
import { gender_type, enrollment_status } from '../../constants/student.constants';

export const createStudentSchema = z.object({
  org_id: z.string().uuid('Invalid organization ID'),
  application_id: z.string().uuid('Invalid application ID'),
  user_id: z.string().uuid().optional().nullable(),
  admission_no: z.string().optional(),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().optional().nullable(),
  dob: z.string().optional().nullable(),
  gender: z.nativeEnum(gender_type as any).optional().nullable(),
  admission_date: z.string().optional().nullable(),
  status: z.nativeEnum(enrollment_status as any).optional().default(enrollment_status.active as any),
});

export type CreateStudentDto = z.infer<typeof createStudentSchema>;
