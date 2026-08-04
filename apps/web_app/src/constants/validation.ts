import { z } from 'zod';

export const VALIDATION_PATTERNS = {
    // Reusable validation configurations
    EMAIL: z.string().email('Invalid email address').trim(),
    PASSWORD: z.string().min(8, 'Password must be at least 8 characters long').max(64),
    PHONE: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
    UUID: z.string().uuid('Invalid identifier format'),
    REQUIRED_STRING: (field: string) => z.string().min(1, `${field} is required`).trim(),
};
