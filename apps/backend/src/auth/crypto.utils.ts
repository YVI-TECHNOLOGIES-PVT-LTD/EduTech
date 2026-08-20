import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export class NativePassword {
  static async compare(password: string, hash: string): Promise<boolean> {
    if (!hash || !password) return false;

    // 1. Standard Bcrypt Hash Format ($2a$, $2b$, $2y$)
    if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
      try {
        return await bcrypt.compare(password, hash);
      } catch (e) {
        return false;
      }
    }

    // 2. Salt:Hash Format (PBKDF2)
    if (hash.includes(':')) {
      const [salt, storedHash] = hash.split(':');
      const derivedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
      try {
        return crypto.timingSafeEqual(
          Buffer.from(storedHash, 'hex'),
          Buffer.from(derivedHash, 'hex'),
        );
      } catch (e) {
        return storedHash === derivedHash;
      }
    }

    // 3. Direct String Fallback
    return password === hash;
  }

  static async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }
}

export class NativeJwt {
  private static base64UrlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  private static base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    return Buffer.from(base64, 'base64').toString('utf8');
  }

  static sign(payload: object, secret: string, expiresInSeconds: number = 86400): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const expPayload = { ...payload, iat: now, exp: now + expiresInSeconds };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(expPayload));

    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  static verify<T = any>(token: string, secret: string): T {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token format');
    }

    const [encodedHeader, encodedPayload, signature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (signature !== expectedSignature) {
      throw new Error('Invalid JWT signature');
    }

    const payload = JSON.parse(this.base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) {
      throw new Error('JWT token has expired');
    }

    return payload as T;
  }
}
