import * as Notifications from 'expo-notifications';
import { Logger } from '../../../core/logging/logger';

export class PushNotificationService {
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (err) {
      Logger.error('Failed to request push notification permissions', err);
      return false;
    }
  }

  static async getExpoPushToken(): Promise<string | null> {
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      return tokenData.data;
    } catch (err) {
      Logger.error('Failed to get Expo push token', err);
      return null;
    }
  }
}
