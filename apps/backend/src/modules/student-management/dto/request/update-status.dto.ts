import { z } from 'zod';
import { enrollment_status } from '../../constants/student.constants';

export const updateStudentStatusSchema = z.object({
  status: z.nativeEnum(enrollment_status as any),
  exit_date: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

export type UpdateStudentStatusDto = z.infer<typeof updateStudentStatusSchema>;
