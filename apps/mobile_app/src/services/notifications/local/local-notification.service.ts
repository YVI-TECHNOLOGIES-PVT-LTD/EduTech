import * as Notifications from 'expo-notifications';

export class LocalNotificationService {
  static async scheduleNotification(title: string, body: string, seconds: number = 1): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
      },
      trigger: {
        seconds,
      },
    });
  }
}
