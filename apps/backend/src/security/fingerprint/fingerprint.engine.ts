import { Request } from 'express';
import crypto from 'crypto';

export class RequestFingerprint {
  public static generate(req: Request): string {
    const ip = req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const acceptLanguage = req.headers['accept-language'] || '';
    const raw = `${ip}:${userAgent}:${acceptLanguage}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }
}

export class ReplayProtection {
  private static seenNonces = new Set<string>();

  public static isReplayed(nonce: string, timestampMs: number, maxAgeMs = 5 * 60 * 1000): boolean {
    const now = Date.now();
    if (Math.abs(now - timestampMs) > maxAgeMs) {
      return true; // Expired timestamp
    }

    if (this.seenNonces.has(nonce)) {
      return true; // Already processed
    }

    this.seenNonces.add(nonce);
    setTimeout(() => this.seenNonces.delete(nonce), maxAgeMs);
    return false;
  }
}
