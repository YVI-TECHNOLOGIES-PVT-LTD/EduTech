import { z } from 'zod';
import {
  lead_source,
  lead_stage,
  lead_priority,
  gender_type,
  relationship_type,
} from '@prisma/client';

export const createLeadSchema = z.object({
  org_id: z.string().uuid('Invalid organization ID'),
  academic_year_grade_id: z.string().uuid('Invalid academic year grade ID'),
  student_first_name: z.string().min(1, 'Student first name is required'),
  student_last_name: z.string().optional().nullable(),
  contact_name: z.string().min(1, 'Contact name is required'),
  contact_phone: z.string().min(5, 'Valid contact phone number is required'),
  contact_email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  contact_relationship: z.nativeEnum(relationship_type).optional().nullable(),
  source: z.nativeEnum(lead_source).optional().default(lead_source.website),
  stage: z.nativeEnum(lead_stage).optional().default(lead_stage.enquiry_received),
  priority: z.nativeEnum(lead_priority).optional().default(lead_priority.warm),
  assigned_counsellor_id: z.string().uuid('Invalid counselor ID').optional().nullable(),
  dob: z.string().optional().nullable(),
  gender: z.nativeEnum(gender_type).optional().nullable(),
  curriculum_preference: z.string().optional().nullable(),
  scholarship_interest: z.boolean().optional().default(false),
  remarks: z.string().optional().nullable(),
});

export type CreateLeadDto = z.infer<typeof createLeadSchema>;
