import { EventBus } from '../../../workflows/event-bus.service';

export enum LeadEventType {
  CREATED = 'lead.created',
  UPDATED = 'lead.updated',
  ASSIGNED = 'lead.assigned',
  STATUS_CHANGED = 'lead.status_changed',
  QUALIFIED = 'lead.qualified',
  CONVERTED = 'lead.converted',
  DELETED = 'lead.deleted',
  ACTIVITY_ADDED = 'lead.activity_added',
}

export interface LeadEventPayload {
  leadId: string;
  enquiryId?: string | null;
  studentName?: string;
  counselorId?: string | null;
  previousStatus?: string;
  newStatus?: string;
  performedBy?: string | null;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class LeadEvents {
  static async publish(eventType: LeadEventType, payload: LeadEventPayload): Promise<void> {
    await EventBus.publish(eventType, payload);
  }
}
