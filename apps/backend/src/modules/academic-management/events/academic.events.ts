import { EventBus } from '../../../workflows/event-bus.service';

export enum AcademicEventType {
  YEAR_CREATED = 'academic.year.created',
  YEAR_UPDATED = 'academic.year.updated',
  GRADE_CREATED = 'academic.grade.created',
  GRADE_UPDATED = 'academic.grade.updated',
  SECTION_CREATED = 'academic.section.created',
  SECTION_UPDATED = 'academic.section.updated',
  YEAR_GRADE_CREATED = 'academic.year_grade.created',
  YEAR_GRADE_UPDATED = 'academic.year_grade.updated',
}

export interface AcademicEventPayload {
  entityId: string;
  name?: string;
  code?: string;
  performedBy?: string | null;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class AcademicEvents {
  /**
   * Publishes domain event strictly post-commit.
   */
  static async publish(eventType: AcademicEventType, payload: AcademicEventPayload): Promise<void> {
    await EventBus.publish(eventType, payload);
  }
}
