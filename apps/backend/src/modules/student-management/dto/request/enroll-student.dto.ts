import { z } from 'zod';
import { enrollment_status } from '../../constants/student.constants';

export const enrollStudentSchema = z.object({
  academic_year_grade_id: z.string().uuid('Invalid academic year grade ID'),
  section_id: z.string().uuid().optional().nullable(),
  roll_number: z.string().optional().nullable(),
  enrollment_date: z.string().optional(),
  status: z.nativeEnum(enrollment_status as any).optional().default(enrollment_status.active as any),
  remarks: z.string().optional().nullable(),
});

export type EnrollStudentDto = z.infer<typeof enrollStudentSchema>;
