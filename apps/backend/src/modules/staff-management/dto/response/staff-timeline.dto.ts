export interface StaffTimelineEventDto {
  id: string;
  type: 'STAFF_CREATED' | 'STAFF_UPDATED' | 'DESIGNATION_ASSIGNED' | 'USER_LINKED';
  title: string;
  description: string | null;
  performed_by: string | null;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface StaffTimelineDto {
  staff_id: string;
  timeline: StaffTimelineEventDto[];
}
