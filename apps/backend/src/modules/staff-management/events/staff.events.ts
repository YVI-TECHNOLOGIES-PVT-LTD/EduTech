import { EventBus } from '../../../workflows/event-bus.service';

export enum StaffEventType {
  CREATED = 'staff.created',
  UPDATED = 'staff.updated',
  DESIGNATION_ASSIGNED = 'staff.designation_assigned',
  USER_LINKED = 'staff.user_linked',
  DELETED = 'staff.deleted',
}

export interface StaffEventPayload {
  staffId: string;
  employeeCode?: string;
  userId?: string;
  designationId?: string;
  performedBy?: string | null;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class StaffEvents {
  /**
   * Publishes domain event strictly post-commit.
   */
  static async publish(eventType: StaffEventType, payload: StaffEventPayload): Promise<void> {
    await EventBus.publish(eventType, payload);
  }
}
