import { Logger } from '../logging/logger';

export class BiometricsService {
  static async isHardwareSupported(): Promise<boolean> {
    Logger.info('Checking biometric hardware availability...');
    return true; // Placeholder for Expo LocalAuthentication
  }

  static async authenticate(): Promise<boolean> {
    Logger.info('Triggering biometric authentication...');
    return true;
  }
}
