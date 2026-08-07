import { EventBus } from '../../../workflows/event-bus.service';

export enum StudentEventType {
  CREATED = 'student.created',
  UPDATED = 'student.updated',
  ENROLLED = 'student.enrolled',
  SECTION_ASSIGNED = 'student.section_assigned',
  PARENT_LINKED = 'student.parent_linked',
  STATUS_CHANGED = 'student.status_changed',
  DELETED = 'student.deleted',
}

export interface StudentEventPayload {
  studentId: string;
  admissionNo?: string;
  applicationId?: string;
  previousStatus?: string;
  newStatus?: string;
  performedBy?: string | null;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class StudentEvents {
  /**
   * Publishes domain event strictly post-commit.
   */
  static async publish(eventType: StudentEventType, payload: StudentEventPayload): Promise<void> {
    await EventBus.publish(eventType, payload);
  }
}
