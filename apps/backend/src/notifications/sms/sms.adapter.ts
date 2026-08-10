import { logger } from '../../utils/logger';

export interface ISmsAdapter {
  sendOtp(phone: string, otp: string): Promise<boolean>;
}

export class ConsoleSmsAdapter implements ISmsAdapter {
  async sendOtp(phone: string, otp: string): Promise<boolean> {
    const maskedPhone = this.maskPhone(phone);
    logger.info(`[ConsoleSmsAdapter DEV] OTP dispatched to ${maskedPhone}: [${otp}]`);
    return true;
  }

  private maskPhone(phone: string): string {
    if (!phone || phone.length < 7) return '***';
    const start = phone.substring(0, 4);
    const end = phone.substring(phone.length - 3);
    const middle = '*'.repeat(Math.max(1, phone.length - 7));
    return `${start}${middle}${end}`;
  }
}

export const consoleSmsAdapter = new ConsoleSmsAdapter();
