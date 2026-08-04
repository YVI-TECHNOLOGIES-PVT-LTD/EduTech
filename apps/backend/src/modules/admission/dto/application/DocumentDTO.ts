import { z } from 'zod';

export const uploadDocumentSchema = z.object({
    application_id: z.string().uuid('Application ID must be a valid UUID'),
    document_type_code: z.string().min(1, 'Document Type Code is required').trim()
});

export const verifyDocumentSchema = z.object({
    remarks: z.string().trim().nullable().optional()
});

export const rejectDocumentSchema = z.object({
    remarks: z.string().min(1, 'Rejection remarks/reason is required').trim()
});

export const correctionRequestSchema = z.object({
    remarks: z.string().min(1, 'Correction details are required').trim()
});
