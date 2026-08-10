/**
 * EduTrack Enterprise — Parent OTP Constants
 * ==========================================
 * Centralized governance for OTP expiration, rate limits, and registration proof TTL.
 */

export const OTP_CONSTANTS = {
  OTP_LENGTH: 6,
  OTP_EXPIRY_SECONDS: 300, // 5 minutes
  OTP_MAX_ATTEMPTS: 5, // Max 5 verification attempts
  OTP_RESEND_COOLDOWN_SECONDS: 60, // 60 seconds resend cooldown
  OTP_MAX_REQUESTS_PER_HOUR: 5, // Max 5 OTP requests per hour per org:phone
  REGISTRATION_PROOF_TTL_SECONDS: 600, // 10 minutes valid proof window
} as const;
