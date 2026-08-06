export const SENSITIVE_FIELDS = new Set([
  'password',
  'passwordhash',
  'password_hash',
  'refreshtoken',
  'refreshtokenhash',
  'refresh_token',
  'authorization',
  'cookie',
  'set-cookie',
  'jwt',
  'accesstoken',
  'access_token',
  'secret',
  'privatekey',
  'clientsecret',
  'apikey',
  'x-api-key',
  'sessiontoken',
]);

export class LogSanitizer {
  public static sanitize(input: any): any {
    if (input === null || input === undefined) return input;
    if (typeof input !== 'object') return input;

    if (Array.isArray(input)) {
      return input.map((item) => this.sanitize(item));
    }

    if (input instanceof Date) return input;

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_FIELDS.has(lowerKey)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}
