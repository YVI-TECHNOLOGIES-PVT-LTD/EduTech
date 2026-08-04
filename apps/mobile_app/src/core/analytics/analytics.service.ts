import { Logger } from '../logging/logger';
import { ENV } from '../../config/env';

export class AnalyticsService {
  static trackEvent(eventName: string, params?: Record<string, any>): void {
    if (ENV.ENABLE_ANALYTICS) {
      Logger.info(`[Analytics Event] ${eventName}`, params);
      // Placeholder for Mixpanel / Firebase Analytics
    }
  }

  static trackScreen(screenName: string): void {
    if (ENV.ENABLE_ANALYTICS) {
      Logger.info(`[Analytics ScreenView] ${screenName}`);
    }
  }
}
