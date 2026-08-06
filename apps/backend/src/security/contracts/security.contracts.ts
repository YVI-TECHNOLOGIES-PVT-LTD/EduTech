export interface SecurityHeadersOptions {
  enableHsts?: boolean;
  hstsMaxAgeSeconds?: number;
  enableCsp?: boolean;
  frameOptions?: 'DENY' | 'SAMEORIGIN';
}

export interface IRateLimiter {
  isRateLimited(key: string, limit: number, windowMs: number): Promise<{ limited: boolean; remaining: number; resetMs: number }>;
}

export interface ICryptoService {
  encrypt(plainText: string, key?: string): string;
  decrypt(cipherText: string, key?: string): string;
  hash(data: string, salt?: string): string;
  generateRandomString(length?: number): string;
}

export interface ICsrfService {
  generateToken(sessionId: string): string;
  validateToken(sessionId: string, token: string): boolean;
}

export interface ISecretProvider {
  getSecret(key: string, defaultValue?: string): string;
}

export enum SecurityAuditEventType {
  LOGIN_THROTTLED = 'SECURITY_LOGIN_THROTTLED',
  RATE_LIMITED = 'SECURITY_RATE_LIMITED',
  CSRF_FAILED = 'SECURITY_CSRF_FAILED',
  INVALID_SIGNATURE = 'SECURITY_INVALID_SIGNATURE',
  SUSPICIOUS_ACTIVITY = 'SECURITY_SUSPICIOUS_ACTIVITY',
}
