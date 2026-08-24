import { NotificationItem } from '../../../types/notification.types';

/**
 * Strict Allowlist for Parent Mobile Deep-Link Destinations
 */
export const ALLOWED_PARENT_ROUTES = {
  APPLICATION_HUB: (id: string) => `/(parent)/applications/${id}`,
  DOCUMENTS: (id: string) => `/(parent)/applications/${id}/documents`,
  FEES: (id: string) => `/(parent)/applications/${id}/fees`,
  RECEIPT: (id: string) => `/(parent)/applications/${id}/receipt`,
  ASSESSMENT: (id: string) => `/(parent)/applications/${id}/assessment`,
  DECISION: (id: string) => `/(parent)/applications/${id}/decision`,
  TIMELINE: (id: string) => `/(parent)/applications/${id}/timeline`,
  NOTIFICATIONS: '/(parent)/notifications',
} as const;

/**
 * Extracts and sanitizes the application ID from notification payload or metadata.
 * Guards against malformed, malicious, or non-string inputs.
 */
export function extractApplicationId(notification: NotificationItem): string | null {
  if (!notification || typeof notification !== 'object') {
    return null;
  }

  // 1. Direct entity_id if entity_type is an admission application
  if (
    notification.entity_type === 'admission_application' ||
    notification.entity_type === 'application' ||
    notification.type?.startsWith('application.')
  ) {
    if (notification.entity_id && typeof notification.entity_id === 'string') {
      const sanitized = notification.entity_id.trim();
      if (sanitized.length > 0) return sanitized;
    }
  }

  // 2. Metadata attributes
  const metadata = notification.metadata;
  if (metadata && typeof metadata === 'object') {
    const candidate =
      metadata.application_id || metadata.applicationId || metadata.app_id || metadata.entity_id;

    if (candidate && typeof candidate === 'string') {
      const sanitized = candidate.trim();
      if (sanitized.length > 0) return sanitized;
    }
  }

  return null;
}

/**
 * Resolves safe parent route for a notification strictly using an allowlist.
 * Never allows navigation to staff-only routes or arbitrary URL schemes.
 */
export function resolveNotificationRoute(notification: NotificationItem): string | null {
  if (!notification || typeof notification !== 'object') {
    return null;
  }

  const appId = extractApplicationId(notification);
  const notifType = String(notification.type || '')
    .toLowerCase()
    .trim();

  if (appId) {
    // 1. Document verification / upload events
    if (
      notifType === 'application.document_verified' ||
      notifType === 'application.document_uploaded' ||
      notifType.includes('document')
    ) {
      return ALLOWED_PARENT_ROUTES.DOCUMENTS(appId);
    }

    // 2. Payment / Fee events
    if (
      notifType === 'application.payment_recorded' ||
      notifType.includes('fee') ||
      notifType.includes('payment')
    ) {
      return ALLOWED_PARENT_ROUTES.FEES(appId);
    }

    // 3. Admission decision / offer events
    if (
      notifType === 'application.decision_recorded' ||
      notifType.includes('decision') ||
      notifType.includes('offer')
    ) {
      return ALLOWED_PARENT_ROUTES.DECISION(appId);
    }

    // 4. Assessment / Entrance test events
    if (
      notifType.includes('assessment') ||
      notifType.includes('exam') ||
      notifType.includes('interview')
    ) {
      return ALLOWED_PARENT_ROUTES.ASSESSMENT(appId);
    }

    // 5. General status change / Application hub
    if (
      notifType === 'application.status_changed' ||
      notifType.startsWith('application.') ||
      notification.entity_type === 'admission_application'
    ) {
      return ALLOWED_PARENT_ROUTES.APPLICATION_HUB(appId);
    }

    // Fallback if application ID exists but type is unknown
    return ALLOWED_PARENT_ROUTES.APPLICATION_HUB(appId);
  }

  // If no application association exists, stay in notification center (never crash or open external URL)
  return null;
}
