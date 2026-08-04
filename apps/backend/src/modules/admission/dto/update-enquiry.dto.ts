import { z } from 'zod';
import { createEnquirySchema } from './create-enquiry.dto';

export const updateEnquirySchema = createEnquirySchema.partial();

export type UpdateEnquiryDto = z.infer<typeof updateEnquirySchema>;
