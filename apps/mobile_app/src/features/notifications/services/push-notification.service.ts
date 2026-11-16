/**
 * Push Notification Service Abstraction (Future Integration Ready)
 *
 * AUDIT STATUS:
 * Backend Push Token Persistence: NOT AVAILABLE IN CURRENT BACKEND CONTRACT
 *
 * This service provides the mobile abstraction interface for device token registration,
 * permission querying, and push message dispatch, ready for future backend integration
 * once push token models/endpoints are provisioned in apps/backend.
 */

export interface PushRegistrationResult {
  supported: boolean;
  token: string | null;
  status: 'UNSUPPORTED_IN_BACKEND' | 'REGISTERED' | 'DENIED' | 'FAILED';
  message: string;
}

export const pushNotificationService = {
  /**
   * Check push notification support on the current platform and backend
   */
  isPushSupported(): boolean {
    // Current backend contract does not have push token persistence schema
    return false;
  },

  /**
   * Request push notification permissions and obtain token
   */
  async registerForPushNotifications(): Promise<PushRegistrationResult> {
    return {
      supported: false,
      token: null,
      status: 'UNSUPPORTED_IN_BACKEND',
      message:
        'Push notifications are ready for future backend integration. Currently, real-time WebSocket delivery is active.',
    };
  },
};
