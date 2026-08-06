import crypto from 'crypto';

export class DataAnonymizer {
  public static maskEmail(email: string): string {
    const parts = email.split('@');
    if (parts.length < 2) return '***@anonymized.local';
    return `${parts[0][0]}***@${parts[1]}`;
  }

  public static anonymize(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex').substring(0, 16);
  }
}

export class RightToForgetEngine {
  public static processRightToForget(userId: string): {
    userId: string;
    status: string;
    anonymizedAt: Date;
  } {
    return {
      userId,
      status: 'ANONYMIZED',
      anonymizedAt: new Date(),
    };
  }
}
