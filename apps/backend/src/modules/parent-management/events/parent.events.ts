import { EventBus } from '../../../workflows/event-bus.service';

export enum ParentEventType {
  CREATED = 'parent.created',
  UPDATED = 'parent.updated',
  STUDENT_LINKED = 'parent.student_linked',
  STUDENT_UNLINKED = 'parent.student_unlinked',
  DELETED = 'parent.deleted',
}

export interface ParentEventPayload {
  parentId: string;
  phone?: string;
  studentId?: string;
  performedBy?: string | null;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class ParentEvents {
  /**
   * Publishes domain event strictly post-commit.
   */
  static async publish(eventType: ParentEventType, payload: ParentEventPayload): Promise<void> {
    await EventBus.publish(eventType, payload);
  }
}
