import { ENV } from '../../config/env';

/**
 * Sanitizes parameters to prevent leaking tokens, passwords, OTPs, or authorization headers into console/logs.
 */
function sanitizeLogItem(item: any): any {
  if (!item) return item;
  if (typeof item === 'string') {
    return item
      .replace(/Bearer\s+[A-Za-z0-9-_.]+/gi, 'Bearer [REDACTED]')
      .replace(/token=[A-Za-z0-9-_.]+/gi, 'token=[REDACTED]')
      .replace(
        /"(password|otp|accessToken|refreshToken|token|secret|authorization)":\s*"[^"]+"/gi,
        '"$1":"[REDACTED]"',
      );
  }
  if (typeof item === 'object') {
    try {
      if (item instanceof Error) {
        return {
          name: item.name,
          message: sanitizeLogItem(item.message),
        };
      }
      const copy: Record<string, any> = Array.isArray(item) ? [...item] : { ...item };
      for (const key of Object.keys(copy)) {
        if (/password|otp|accesstoken|refreshtoken|token|secret|authorization/i.test(key)) {
          copy[key] = '[REDACTED]';
        } else if (typeof copy[key] === 'object' && copy[key] !== null) {
          copy[key] = sanitizeLogItem(copy[key]);
        }
      }
      return copy;
    } catch {
      return '[Object]';
    }
  }
  return item;
}

export class Logger {
  static info(message: string, ...optionalParams: any[]): void {
    if (ENV.ENABLE_LOGGING) {
      const sanitized = optionalParams.map(sanitizeLogItem);
      console.log(`[INFO] ${new Date().toISOString()} - ${sanitizeLogItem(message)}`, ...sanitized);
    }
  }

  static warn(message: string, ...optionalParams: any[]): void {
    if (ENV.ENABLE_LOGGING) {
      const sanitized = optionalParams.map(sanitizeLogItem);
      console.warn(
        `[WARN] ${new Date().toISOString()} - ${sanitizeLogItem(message)}`,
        ...sanitized,
      );
    }
  }

  static error(message: string, error?: any, ...optionalParams: any[]): void {
    const sanitizedError = sanitizeLogItem(error);
    const sanitizedParams = optionalParams.map(sanitizeLogItem);
    console.error(
      `[ERROR] ${new Date().toISOString()} - ${sanitizeLogItem(message)}`,
      sanitizedError,
      ...sanitizedParams,
    );
  }
}
