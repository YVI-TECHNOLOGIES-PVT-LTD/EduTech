import { z } from 'zod';

export const uploadDocumentSchema = z.object({
  document_type_id: z.string().uuid('Invalid document type ID'),
  file_path: z.string().min(1, 'File path or storage key is required'),
});

export type UploadDocumentDto = z.infer<typeof uploadDocumentSchema>;
