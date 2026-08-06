import { z } from 'zod';

export const NotificationConfigSchema = z.object({
  defaultChannel: z.enum(['email', 'sms', 'push', 'webhook']).default('email'),
  emailProvider: z.enum(['smtp', 'memory', 'noop']).default('memory'),
  smsProvider: z.enum(['twilio', 'memory', 'noop']).default('memory'),
  pushProvider: z.enum(['fcm', 'memory', 'noop']).default('memory'),
  webhookProvider: z.enum(['http', 'memory', 'noop']).default('memory'),
  smtpHost: z.string().default('smtp.example.com'),
  smtpPort: z.coerce.number().default(587),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  fromEmail: z.string().default('noreply@edutrack.edu'),
  twilioAccountSid: z.string().optional(),
  twilioAuthToken: z.string().optional(),
  twilioFromNumber: z.string().optional(),
  fcmServerKey: z.string().optional(),
});

export type NotificationConfig = z.infer<typeof NotificationConfigSchema>;
