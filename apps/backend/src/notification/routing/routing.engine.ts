import { NotificationChannel, NotificationPayload } from '../contracts/notification.contracts';
import { RecipientPreferencesResolver } from '../preferences/recipient.preferences';

export class RoutingEngine {
  public static selectChannel(payload: NotificationPayload): NotificationChannel {
    if (payload.channel) {
      return payload.channel;
    }
    const pref = RecipientPreferencesResolver.resolve(payload.recipient);
    if (!pref.optedOutChannels.includes(pref.preferredChannel)) {
      return pref.preferredChannel;
    }
    return 'email'; // Default fallback
  }
}
