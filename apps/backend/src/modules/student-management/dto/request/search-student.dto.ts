import { z } from 'zod';
import { enrollment_status } from '../../constants/student.constants';

export const searchStudentSchema = z.object({
  searchText: z.string().optional(),
  status: z.nativeEnum(enrollment_status as any).optional(),
  org_id: z.string().uuid().optional(),
  academic_year_grade_id: z.string().uuid().optional(),
  section_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  sort: z
    .enum(['created_at', 'updated_at', 'first_name', 'admission_no', 'status'])
    .optional()
    .default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type SearchStudentDto = z.infer<typeof searchStudentSchema>;
