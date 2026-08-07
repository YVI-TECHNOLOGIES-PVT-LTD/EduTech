export interface StudentTimelineEventDto {
  id: string;
  type: 'STUDENT_CREATED' | 'ENROLLMENT_RECORDED' | 'SECTION_ASSIGNED' | 'PARENT_LINKED' | 'STATUS_CHANGED';
  title: string;
  description: string | null;
  performed_by: string | null;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface StudentTimelineDto {
  student_id: string;
  timeline: StudentTimelineEventDto[];
}
