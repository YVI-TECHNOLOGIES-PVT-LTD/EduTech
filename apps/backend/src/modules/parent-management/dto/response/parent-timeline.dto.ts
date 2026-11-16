export interface ParentTimelineEventDto {
  id: string;
  type: 'PARENT_CREATED' | 'PARENT_UPDATED' | 'STUDENT_LINKED' | 'STUDENT_UNLINKED';
  title: string;
  description: string | null;
  performed_by: string | null;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ParentTimelineDto {
  parent_id: string;
  timeline: ParentTimelineEventDto[];
}
