import { EventBus } from '../../../workflows/event-bus.service';

export enum ApplicationEventType {
  CREATED = 'application.created',
  UPDATED = 'application.updated',
  STATUS_CHANGED = 'application.status_changed',
  DOCUMENT_UPLOADED = 'application.document_uploaded',
  DOCUMENT_VERIFIED = 'application.document_verified',
  ASSESSMENT_RECORDED = 'application.assessment_recorded',
  DECISION_RECORDED = 'application.decision_recorded',
  APPROVED = 'application.approved',
  REJECTED = 'application.rejected',
  PAYMENT_RECORDED = 'application.payment_recorded',
  DELETED = 'application.deleted',
}

export interface ApplicationEventPayload {
  applicationId: string;
  orgId?: string;
  applicationNumber?: string;
  leadId?: string;
  previousStatus?: string;
  newStatus?: string;
  performedBy?: string | null;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class AdmissionEvents {
  /**
   * Publishes domain event strictly post-commit.
   */
  static async publish(
    eventType: ApplicationEventType,
    payload: ApplicationEventPayload,
  ): Promise<void> {
    await EventBus.publish(eventType, payload);
  }
}
