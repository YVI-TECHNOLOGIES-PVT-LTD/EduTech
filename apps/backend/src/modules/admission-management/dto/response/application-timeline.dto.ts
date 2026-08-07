export interface ApplicationTimelineEventDto {
  id: string;
  type:
    | 'APPLICATION_CREATED'
    | 'DOCUMENT_UPLOADED'
    | 'DOCUMENT_VERIFIED'
    | 'ASSESSMENT_RECORDED'
    | 'DECISION_RECORDED'
    | 'PAYMENT_RECORDED';
  title: string;
  description: string | null;
  performed_by: string | null;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ApplicationTimelineDto {
  application_id: string;
  timeline: ApplicationTimelineEventDto[];
}
