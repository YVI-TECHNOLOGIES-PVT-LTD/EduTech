import { z } from 'zod';

export const uploadDocumentSchema = z.object({
  document_type_id: z.string().optional(),
  document_type: z.string().optional(),
  document_code: z.string().optional(),
  document_type_code: z.string().optional(),
  file_path: z.string().optional(),
});

export type UploadDocumentDto = z.infer<typeof uploadDocumentSchema>;
