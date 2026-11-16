import { z } from 'zod';
import { relationship_type } from '../../constants/student.constants';

export const linkParentSchema = z.object({
  parent_id: z.string().uuid('Invalid parent ID'),
  relationship: z.nativeEnum(relationship_type as any),
  is_primary_contact: z.boolean().optional().default(false),
});

export type LinkParentDto = z.infer<typeof linkParentSchema>;
