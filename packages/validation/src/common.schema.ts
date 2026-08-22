import { z } from 'zod';
import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';

export { parsePhoneNumberFromString } from 'libphonenumber-js';
export type { CountryCode } from 'libphonenumber-js';
export const CANONICAL_PHONE_REGEX = /^[6-9][0-9]{9}$/;

export function normalizePhoneNumber(
  phone?: string | null,
  country: CountryCode = 'IN',
): string | null {
  if (!phone || typeof phone !== 'string') return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;

  // Reject inputs containing letters or invalid non-phone characters
  if (/[a-zA-Z]/.test(trimmed) || !/^\+?[0-9\s\-()]+$/.test(trimmed)) {
    return null;
  }

  // Parse using libphonenumber-js with fallback country context
  const parsed = parsePhoneNumberFromString(trimmed, country);
  if (parsed && parsed.isValid()) {
    if (parsed.country === 'IN') {
      // Preserve exact canonical 10-digit format for India without +91 prefix
      const digitsOnly = parsed.nationalNumber;
      if (CANONICAL_PHONE_REGEX.test(digitsOnly)) {
        return digitsOnly;
      }
    } else {
      // Preserve E.164 format (+<callingCode><nationalNumber>) for International numbers
      return parsed.number;
    }
  }

  // Fallback for legacy formatted India strings (+91 98765 43210, 09876543210, 919876543210)
  const digitsOnly = trimmed.replace(/\D/g, '');
  let normalized = digitsOnly;

  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    normalized = digitsOnly.slice(2);
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    normalized = digitsOnly.slice(1);
  }

  if (CANONICAL_PHONE_REGEX.test(normalized)) {
    return normalized;
  }

  return null;
}

export function isValidPhoneNumber(phone?: string | null, country: CountryCode = 'IN'): boolean {
  return normalizePhoneNumber(phone, country) !== null;
}

export function normalizeEmail(email?: string | null): string | null {
  if (!email || typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return null;
  return trimmed;
}

export function isValidEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return z.string().email().safeParse(normalized).success;
}

export function createPhoneSchema(country: CountryCode = 'IN') {
  return z
    .string()
    .min(1, 'Enter a valid phone number.')
    .transform((val) => val.trim())
    .refine((val) => isValidPhoneNumber(val, country), {
      message: 'Enter a valid phone number.',
    })
    .transform((val) => normalizePhoneNumber(val, country)!);
}

export const phoneSchema = createPhoneSchema('IN');

export const optionalPhoneSchema = z
  .string()
  .trim()
  .refine((val) => val === '' || isValidPhoneNumber(val), {
    message: 'Enter a valid phone number.',
  })
  .transform((val) => (val === '' ? null : normalizePhoneNumber(val)))
  .optional()
  .nullable();

export const emailSchema = z
  .string()
  .min(1, 'Enter a valid email address.')
  .transform((val) => val.trim().toLowerCase())
  .refine((val) => z.string().email().safeParse(val).success, {
    message: 'Enter a valid email address.',
  });

export const optionalEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine((val) => val === '' || z.string().email().safeParse(val).success, {
    message: 'Enter a valid email address.',
  })
  .transform((val) => (val === '' ? null : val))
  .optional()
  .nullable();

export const paginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});
