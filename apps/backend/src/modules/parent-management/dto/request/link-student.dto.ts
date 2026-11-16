import { z } from 'zod';
import { relationship_type } from '../../constants/parent.constants';

export const linkStudentSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  relationship: z.nativeEnum(relationship_type as any),
  is_primary_contact: z.boolean().optional().default(false),
});

export type LinkStudentDto = z.infer<typeof linkStudentSchema>;
