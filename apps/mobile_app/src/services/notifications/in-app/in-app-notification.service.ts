import { useNotificationStore } from '../../../stores/notification.store';

export class InAppNotificationService {
  static addInAppNotification(title: string, body: string): void {
    const current = useNotificationStore.getState().notifications;
    const newNotification = {
      id: Math.random().toString(),
      title,
      body,
      read: false,
      createdAt: new Date().toISOString(),
    };
    useNotificationStore.getState().setNotifications([newNotification, ...current]);
  }
}
