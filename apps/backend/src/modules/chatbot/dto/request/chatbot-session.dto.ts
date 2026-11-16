import { z } from 'zod';
import { chatbot_channel } from '@prisma/client';

export const createSessionSchema = z.object({
  channel: z.nativeEnum(chatbot_channel).optional().default(chatbot_channel.web_widget),
  anonymous_contact: z.string().max(150).optional().nullable(),
});

export type CreateSessionDto = z.infer<typeof createSessionSchema>;
