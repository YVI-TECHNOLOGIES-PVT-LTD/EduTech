export interface LeadSummaryDto {
  lead_id: string;
  id: string;
  lead_number: string;
  student_name: string;
  contact_name: string;
  contact_phone: string;
  stage: string;
  status: string;
  counselor_name: string | null;
  created_at: string;
}
