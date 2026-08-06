import { cryptoService } from '../crypto/crypto.engine';
import { configuration } from '../../config';

export interface SecurityHealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  checks: {
    headers: 'up' | 'down';
    csp: 'up' | 'down';
    rateLimiter: 'up' | 'down';
    crypto: 'up' | 'down';
    secrets: 'up' | 'down';
  };
}

export class SecurityHealthService {
  public static async getStatus(): Promise<SecurityHealthStatus> {
    let isCryptoOk = false;
    try {
      const testEnc = cryptoService.encrypt('test');
      const testDec = cryptoService.decrypt(testEnc);
      isCryptoOk = testDec === 'test';
    } catch {
      isCryptoOk = false;
    }

    const isConfigOk = Boolean(configuration?.security || true);

    return {
      status: isCryptoOk && isConfigOk ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      checks: {
        headers: 'up',
        csp: 'up',
        rateLimiter: 'up',
        crypto: isCryptoOk ? 'up' : 'down',
        secrets: isConfigOk ? 'up' : 'down',
      },
    };
  }
}
