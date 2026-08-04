import { ENV } from '../../config/env';

export class Logger {
  static info(message: string, ...optionalParams: any[]): void {
    if (ENV.ENABLE_LOGGING) {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...optionalParams);
    }
  }

  static warn(message: string, ...optionalParams: any[]): void {
    if (ENV.ENABLE_LOGGING) {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...optionalParams);
    }
  }

  static error(message: string, error?: any, ...optionalParams: any[]): void {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error, ...optionalParams);
  }
}
