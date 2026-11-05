import crypto from 'crypto';

/**
 * Generates a collision-resistant application number in the format:
 * APP-{YEAR}-{8_CHARACTER_RANDOM_SUFFIX}
 * Example: APP-2026-A83F91BC
 *
 * Uses Node.js crypto UUID generation.
 *
 * @param year Optional year (defaults to current calendar year)
 * @returns Formatted application number
 */
export function generateApplicationNumber(year?: number): string {
  const targetYear = year ?? new Date().getFullYear();
  const uuid = crypto.randomUUID(); // e.g., 'a83f91bc-5b42-4f32-841b-4f9e61234567'
  const suffix = uuid.split('-')[0].toUpperCase(); // First 8 characters in uppercase hex
  return `APP-${targetYear}-${suffix}`;
}

/**
 * Identifies if an error is a Prisma P2002 unique constraint violation
 * specifically targeting the `application_number` field.
 *
 * @param err Error caught from Prisma invocation
 * @returns boolean indicating if the violation was on application_number
 */
export function isApplicationNumberUniqueConstraintError(err: any): boolean {
  if (!err || err.code !== 'P2002') {
    return false;
  }

  const target = err.meta?.target;
  if (Array.isArray(target) && target.includes('application_number')) {
    return true;
  }
  if (typeof target === 'string' && target.includes('application_number')) {
    return true;
  }
  if (typeof err.message === 'string' && err.message.includes('application_number')) {
    return true;
  }

  return false;
}
