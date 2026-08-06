import crypto from 'crypto';

export class PasswordHasher {
  public static hash(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return `$pbkdf2$100000$${salt}$${hash}`;
  }

  public static verify(password: string, storedHash: string): boolean {
    if (!storedHash || !storedHash.startsWith('$pbkdf2$')) {
      return false;
    }
    const parts = storedHash.split('$');
    if (parts.length !== 5) return false;

    const iterations = parseInt(parts[2], 10);
    const salt = parts[3];
    const originalHash = parts[4];

    const hashToVerify = crypto
      .pbkdf2Sync(password, salt, iterations, 64, 'sha512')
      .toString('hex');
    return crypto.timingSafeEqual(Buffer.from(originalHash), Buffer.from(hashToVerify));
  }

  public static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

export class PasswordService {
  public async hashPassword(password: string): Promise<string> {
    return PasswordHasher.hash(password);
  }

  public async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    return PasswordHasher.verify(password, storedHash);
  }

  public validatePolicy(password: string, minLength = 8): { valid: boolean; reason?: string } {
    if (!password || password.length < minLength) {
      return { valid: false, reason: `Password must be at least ${minLength} characters long` };
    }
    return { valid: true };
  }
}
