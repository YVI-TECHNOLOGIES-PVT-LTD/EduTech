import { z } from 'zod';
import { academic_year_status } from '../../constants/academic.constants';

export const createAcademicYearSchema = z.object({
  org_id: z.string().uuid('Invalid organization ID'),
  academic_year_name: z.string().min(1, 'Academic year name is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  status: z.nativeEnum(academic_year_status as any).optional().default(academic_year_status.planning as any),
});

export type CreateAcademicYearDto = z.infer<typeof createAcademicYearSchema>;
