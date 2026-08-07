import { z } from 'zod';
import { document_verify_status } from '@prisma/client';

export const verifyDocumentSchema = z.object({
  verify_status: z.nativeEnum(document_verify_status),
  verification_remarks: z.string().optional().nullable(),
});

export type VerifyDocumentDto = z.infer<typeof verifyDocumentSchema>;
