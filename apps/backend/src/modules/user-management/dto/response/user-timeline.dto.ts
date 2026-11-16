export interface UserTimelineEventDto {
  id: string;
  type: 'USER_CREATED' | 'USER_UPDATED' | 'STATUS_CHANGED' | 'ROLE_ASSIGNED' | 'LAST_LOGIN';
  title: string;
  description: string | null;
  performed_by: string | null;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface UserTimelineDto {
  user_id: string;
  timeline: UserTimelineEventDto[];
}
