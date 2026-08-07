import { z } from 'zod';
import { assessment_result } from '@prisma/client';

export const recordAssessmentSchema = z.object({
  config_id: z.string().uuid('Invalid assessment configuration ID'),
  assessment_date: z.string().min(1, 'Assessment date is required'),
  maximum_marks: z.number().optional().nullable(),
  marks_obtained: z.number().optional().nullable(),
  percentage: z.number().optional().nullable(),
  result: z.nativeEnum(assessment_result).optional().nullable(),
  remarks: z.string().optional().nullable(),
  assessed_by: z.string().uuid().optional().nullable(),
});

export type RecordAssessmentDto = z.infer<typeof recordAssessmentSchema>;
