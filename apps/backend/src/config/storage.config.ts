import { z } from 'zod';

export const StorageConfigSchema = z.object({
  provider: z.enum(['local', 's3', 'memory', 'noop']).default('local'),
  localUploadDir: z.string().default('./uploads'),
  maxFileSizeBytes: z.coerce.number().default(10485760), // 10MB default limit
  presignedUrlExpirySeconds: z.coerce.number().default(3600), // 1 hour
  s3Bucket: z.string().optional(),
  s3Region: z.string().default('us-east-1'),
  s3AccessKeyId: z.string().optional(),
  s3SecretAccessKey: z.string().optional(),
  allowedMimeTypes: z
    .array(z.string())
    .default([
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]),
});

export type StorageConfig = z.infer<typeof StorageConfigSchema>;
