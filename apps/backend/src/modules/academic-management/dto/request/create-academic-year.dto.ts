import { z } from 'zod';
import { academic_year_status } from '../../constants/academic.constants';

export const createAcademicYearSchema = z.object({
  org_id: z.string().uuid('Invalid organization ID').optional(),
  academic_year_name: z
    .string({ required_error: 'Academic year name is required' })
    .trim()
    .min(1, 'Academic year name cannot be empty')
    .max(30, 'Academic year name must not exceed 30 characters'),
  start_date: z
    .string({ required_error: 'Start date is required' })
    .min(1, 'Start date is required'),
  end_date: z.string({ required_error: 'End date is required' }).min(1, 'End date is required'),
  status: z
    .nativeEnum(academic_year_status as any)
    .optional()
    .default(academic_year_status.planning as any),
});

export type CreateAcademicYearDto = z.input<typeof createAcademicYearSchema> & {
  org_id: string;
};
