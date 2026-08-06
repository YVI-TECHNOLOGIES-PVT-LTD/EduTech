import { NotificationChannel } from '../contracts/notification.contracts';

export interface RecipientPreference {
  recipientId: string;
  preferredChannel: NotificationChannel;
  optedOutChannels: NotificationChannel[];
  isQuietHours: boolean;
  locale: string;
}

export class RecipientPreferencesResolver {
  public static resolve(recipientId: string): RecipientPreference {
    return {
      recipientId,
      preferredChannel: 'email',
      optedOutChannels: [],
      isQuietHours: false,
      locale: 'en-US',
    };
  }
}
