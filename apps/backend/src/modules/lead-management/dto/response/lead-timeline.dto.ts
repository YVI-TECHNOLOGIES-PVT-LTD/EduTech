export interface TimelineEventDto {
  id: string;
  type: 'CREATED' | 'STATUS_CHANGE' | 'ASSIGNMENT' | 'ACTIVITY' | 'NOTE' | 'UPDATED';
  title: string;
  description: string | null;
  performed_by: string | null;
  performed_by_name: string | null;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface LeadTimelineDto {
  lead_id: string;
  timeline: TimelineEventDto[];
}
