import { z } from 'zod';
import { academic_year_status } from '../../constants/academic.constants';

export const updateAcademicYearSchema = z.object({
  academic_year_name: z.string().min(1).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.nativeEnum(academic_year_status as any).optional(),
});

export type UpdateAcademicYearDto = z.infer<typeof updateAcademicYearSchema>;
