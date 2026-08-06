export const SENSITIVE_FIELDS: readonly string[] = Object.freeze([
  'password_hash',
  'password',
  'refreshTokenHash',
  'secret',
  'apiKey',
  'accessToken',
  'refreshToken',
  'jwt',
  'privateKey',
]);

export class Sanitizer {
  public static sanitize(input: any): any {
    if (input === null || input === undefined) return input;
    if (typeof input !== 'object') return input;

    if (Array.isArray(input)) {
      return input.map((item) => this.sanitize(item));
    }

    if (input instanceof Date) return input;

    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(input)) {
      if (SENSITIVE_FIELDS.includes(key)) {
        continue; // Strip sensitive key
      }
      sanitized[key] = this.sanitize(input[key]);
    }

    return sanitized;
  }
}
