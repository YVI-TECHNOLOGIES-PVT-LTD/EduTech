import { Logger } from './logger';

export class CrashService {
  static recordError(error: Error, fatal: boolean = false): void {
    Logger.error(`CrashService recorded error (Fatal: ${fatal}):`, error);
    // Placeholder for Sentry / Firebase Crashlytics integration
  }

  static setUserId(userId: string): void {
    Logger.info(`CrashService user ID set: ${userId}`);
  }
}
