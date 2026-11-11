import { z } from 'zod';
import { academic_year_status } from '../../constants/academic.constants';

export const updateAcademicYearSchema = z.object({
  academic_year_name: z
    .string()
    .trim()
    .min(1, 'Academic year name cannot be empty')
    .max(30, 'Academic year name must not exceed 30 characters')
    .optional(),
  start_date: z.string().min(1, 'Start date cannot be empty').optional(),
  end_date: z.string().min(1, 'End date cannot be empty').optional(),
  status: z.nativeEnum(academic_year_status as any).optional(),
});

export type UpdateAcademicYearDto = z.infer<typeof updateAcademicYearSchema>;
