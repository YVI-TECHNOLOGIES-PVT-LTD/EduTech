import { EventBus } from '../../../workflows/event-bus.service';

export enum UserEventType {
  CREATED = 'user.created',
  UPDATED = 'user.updated',
  STATUS_CHANGED = 'user.status_changed',
  ROLE_ASSIGNED = 'user.role_assigned',
  ROLE_REMOVED = 'user.role_removed',
}

export interface UserEventPayload {
  userId: string;
  email?: string;
  status?: string;
  roleId?: string;
  performedBy?: string | null;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class UserEvents {
  /**
   * Publishes domain event strictly post-commit.
   */
  static async publish(eventType: UserEventType, payload: UserEventPayload): Promise<void> {
    await EventBus.publish(eventType, payload);
  }
}
