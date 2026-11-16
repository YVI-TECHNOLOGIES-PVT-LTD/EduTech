export interface LeadDashboardDto {
  total_leads: number;
  today_leads: number;
  qualified_leads: number;
  lost_leads: number;
  converted_leads: number;
  pending_followups: number;
  leads_by_source: Record<string, number>;
  leads_by_status: Record<string, number>;
}
