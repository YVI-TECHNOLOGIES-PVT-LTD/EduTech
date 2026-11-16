import { z } from 'zod';

export const sendMessageSchema = z.object({
  session_id: z.string().uuid('Invalid session ID format'),
  message: z
    .string()
    .min(1, 'Message content cannot be empty')
    .max(2000, 'Message exceeds 2000 characters limit'),
  idempotency_key: z.string().optional().nullable(),
});

export type SendMessageDto = z.infer<typeof sendMessageSchema>;
