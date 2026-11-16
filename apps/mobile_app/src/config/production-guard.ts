/**
 * EduTrack ERP Mobile — Strict Production Build Guard
 * Source of Truth: Render Production Backend
 */

export const VERIFIED_PRODUCTION_HOST = 'edutrack-backend-0fyq.onrender.com';
export const VERIFIED_PRODUCTION_API_URL = `https://${VERIFIED_PRODUCTION_HOST}/api`;
export const VERIFIED_PRODUCTION_WS_URL = `wss://${VERIFIED_PRODUCTION_HOST}/ws/notifications`;
export const VERIFIED_PRODUCTION_PARENT_WEB_URL = 'https://edutrackcom.netlify.app/fees/my';

export interface GuardValidationResult {
  isValid: boolean;
  error?: string;
}

const FORBIDDEN_HOST_PATTERNS = [
  'localhost',
  '127.0.0.1',
  '10.0.2.2',
  '192.168.',
  '10.',
  '172.16.',
  '172.17.',
  '172.18.',
  '172.19.',
  '172.20.',
  '172.21.',
  '172.22.',
  '172.23.',
  '172.24.',
  '172.25.',
  '172.26.',
  '172.27.',
  '172.28.',
  '172.29.',
  '172.30.',
  '172.31.',
  'staging-',
  'dev-',
  'placeholder',
  'example.com',
  'your-actual',
];

/**
 * Normalizes an API base URL:
 * - Trims whitespace
 * - Strips trailing slashes
 * - Appends /api prefix if missing
 */
export function normalizeApiUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let clean = rawUrl.trim().replace(/\/+$/, '');
  if (!clean.endsWith('/api')) {
    clean = `${clean}/api`;
  }
  return clean;
}

/**
 * Validates that an API URL satisfies all strict production requirements.
 */
export function validateProductionApiUrl(apiUrl: string): GuardValidationResult {
  if (!apiUrl || typeof apiUrl !== 'string' || !apiUrl.trim()) {
    return {
      isValid: false,
      error: 'EXPO_PUBLIC_API_URL is missing or undefined.',
    };
  }

  const clean = apiUrl.trim();

  // 1. Must use HTTPS
  if (!clean.startsWith('https://')) {
    return {
      isValid: false,
      error: `Production API URL must use HTTPS protocol. Found: "${clean}"`,
    };
  }

  // 2. Reject forbidden local/emulator/staging patterns
  const lower = clean.toLowerCase();
  for (const pattern of FORBIDDEN_HOST_PATTERNS) {
    if (lower.includes(pattern)) {
      return {
        isValid: false,
        error: `Production API URL contains forbidden pattern "${pattern}". Found: "${clean}"`,
      };
    }
  }

  // 3. Reject placeholder URLs
  if (lower.includes('api.edutrack.com')) {
    return {
      isValid: false,
      error: `Production API URL must not use the placeholder domain "api.edutrack.com". The verified Render backend is "${VERIFIED_PRODUCTION_HOST}".`,
    };
  }

  // 4. Validate hostname against verified Render production backend
  try {
    const parsed = new URL(clean);
    if (parsed.hostname !== VERIFIED_PRODUCTION_HOST) {
      return {
        isValid: false,
        error: `Production API hostname "${parsed.hostname}" does not match the verified Render production backend "${VERIFIED_PRODUCTION_HOST}".`,
      };
    }

    if (!parsed.pathname.endsWith('/api') && parsed.pathname !== '/api') {
      return {
        isValid: false,
        error: `Production API URL pathname must be "/api". Found: "${parsed.pathname}"`,
      };
    }
  } catch (err: any) {
    return {
      isValid: false,
      error: `Malformed production API URL "${clean}": ${err?.message || err}`,
    };
  }

  return { isValid: true };
}

/**
 * Validates WebSocket URL for production.
 */
export function validateProductionWsUrl(wsUrl: string): GuardValidationResult {
  if (!wsUrl || typeof wsUrl !== 'string' || !wsUrl.trim()) {
    return { isValid: false, error: 'EXPO_PUBLIC_WS_URL is missing or undefined.' };
  }

  const clean = wsUrl.trim();
  if (!clean.startsWith('wss://')) {
    return {
      isValid: false,
      error: `Production WebSocket URL must use WSS protocol. Found: "${clean}"`,
    };
  }

  const lower = clean.toLowerCase();
  for (const pattern of FORBIDDEN_HOST_PATTERNS) {
    if (lower.includes(pattern)) {
      return {
        isValid: false,
        error: `Production WebSocket URL contains forbidden pattern "${pattern}". Found: "${clean}"`,
      };
    }
  }

  try {
    const parsed = new URL(clean);
    if (parsed.hostname !== VERIFIED_PRODUCTION_HOST) {
      return {
        isValid: false,
        error: `Production WebSocket hostname "${parsed.hostname}" does not match "${VERIFIED_PRODUCTION_HOST}".`,
      };
    }
  } catch (err: any) {
    return {
      isValid: false,
      error: `Malformed production WebSocket URL "${clean}": ${err?.message || err}`,
    };
  }

  return { isValid: true };
}

/**
 * Enforces production build guard at module evaluation time.
 * If running in production / release mode, this function throws an immediate error
 * if any URL violates strict production constraints.
 */
export function enforceProductionGuard(apiUrl: string, wsUrl?: string): void {
  const apiCheck = validateProductionApiUrl(apiUrl);
  if (!apiCheck.isValid) {
    throw new Error(
      `[CRITICAL PRODUCTION BUILD GUARD FAILURE]\n${apiCheck.error}\n` +
        `The EduTrack Android APK must connect exclusively to https://${VERIFIED_PRODUCTION_HOST}/api.`,
    );
  }

  if (wsUrl) {
    const wsCheck = validateProductionWsUrl(wsUrl);
    if (!wsCheck.isValid) {
      throw new Error(
        `[CRITICAL PRODUCTION BUILD GUARD FAILURE]\n${wsCheck.error}\n` +
          `Production WebSocket must connect exclusively to wss://${VERIFIED_PRODUCTION_HOST}/ws/notifications.`,
      );
    }
  }
}
