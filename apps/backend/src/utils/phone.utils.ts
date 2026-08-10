/**
 * EduTrack Enterprise — Canonical Phone Normalization Utility
 * ==========================================================
 * Normalizes and validates phone numbers to E.164 standard.
 * Default country code for 10-digit numbers: +91 (India).
 */

export function normalizePhone(rawPhone: string): string {
  if (!rawPhone || typeof rawPhone !== 'string') {
    throw new Error('Invalid phone number: input must be a non-empty string.');
  }

  const trimmed = rawPhone.trim();
  const hasLeadingPlus = trimmed.startsWith('+');

  // Strip all non-digit characters
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (!digitsOnly) {
    throw new Error('Invalid phone number: no digits found.');
  }

  // If leading '+' was present and digits length is between 10 and 15 (E.164 standard)
  if (hasLeadingPlus) {
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      throw new Error(`Invalid E.164 phone length: +${digitsOnly} (${digitsOnly.length} digits).`);
    }
    return `+${digitsOnly}`;
  }

  // 10-digit national number (default to India +91)
  if (digitsOnly.length === 10) {
    if (!/^[6-9]\d{9}$/.test(digitsOnly)) {
      throw new Error(`Invalid 10-digit national mobile number: ${digitsOnly}.`);
    }
    return `+91${digitsOnly}`;
  }

  // 12-digit number starting with 91 (e.g. 919876543210)
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    const subscriber = digitsOnly.substring(2);
    if (!/^[6-9]\d{9}$/.test(subscriber)) {
      throw new Error(`Invalid Indian mobile number: ${digitsOnly}.`);
    }
    return `+${digitsOnly}`;
  }

  // E.164 standard allows 10-15 digits
  if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
    return `+${digitsOnly}`;
  }

  throw new Error(`Invalid phone number format: ${rawPhone}`);
}

export function isValidPhone(rawPhone: string): boolean {
  try {
    normalizePhone(rawPhone);
    return true;
  } catch {
    return false;
  }
}
