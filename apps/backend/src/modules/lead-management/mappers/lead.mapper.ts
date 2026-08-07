import { LeadResponseDto } from '../dto/response/lead.response.dto';
import { LeadSummaryDto } from '../dto/response/lead-summary.dto';

export class LeadMapper {
  static toResponseDto(leadRecord: any): LeadResponseDto {
    const studentFullName = [leadRecord.student_first_name, leadRecord.student_last_name]
      .filter(Boolean)
      .join(' ');

    const counselorStaff = leadRecord.staff || null;
    const counselorUser = counselorStaff?.users_staff_user_idTousers || counselorStaff?.user || null;
    const counselorName = counselorUser
      ? [counselorUser.first_name, counselorUser.last_name].filter(Boolean).join(' ') || counselorUser.email
      : counselorStaff?.employee_code
      ? `Staff (${counselorStaff.employee_code})`
      : null;

    return {
      lead_id: leadRecord.lead_id,
      id: leadRecord.lead_id,
      org_id: leadRecord.org_id,
      lead_number: leadRecord.lead_number,
      academic_year_grade_id: leadRecord.academic_year_grade_id,
      student_first_name: leadRecord.student_first_name,
      student_last_name: leadRecord.student_last_name || null,
      student_name: studentFullName || leadRecord.student_first_name,
      dob: leadRecord.dob ? new Date(leadRecord.dob).toISOString() : null,
      gender: leadRecord.gender || null,
      curriculum_preference: leadRecord.curriculum_preference || null,
      scholarship_interest: Boolean(leadRecord.scholarship_interest),
      contact_name: leadRecord.contact_name,
      parent_name: leadRecord.contact_name,
      contact_relationship: leadRecord.contact_relationship || null,
      contact_phone: leadRecord.contact_phone,
      parent_phone: leadRecord.contact_phone,
      contact_email: leadRecord.contact_email || null,
      parent_email: leadRecord.contact_email || null,
      source: leadRecord.source,
      stage: leadRecord.stage,
      status: leadRecord.stage,
      priority: leadRecord.priority || null,
      ai_lead_score: leadRecord.ai_lead_score ? Number(leadRecord.ai_lead_score) : null,
      assigned_counsellor_id: leadRecord.assigned_counsellor_id || null,
      counselor_id: leadRecord.assigned_counsellor_id || null,
      counselor: counselorStaff
        ? {
            staff_id: counselorStaff.staff_id,
            employee_code: counselorStaff.employee_code,
            name: counselorName || undefined,
            email: counselorUser?.email || null,
          }
        : null,
      remarks: leadRecord.remarks || null,
      enquiry_date: leadRecord.enquiry_date
        ? new Date(leadRecord.enquiry_date).toISOString()
        : new Date().toISOString(),
      created_at: leadRecord.created_at
        ? new Date(leadRecord.created_at).toISOString()
        : new Date().toISOString(),
      updated_at: leadRecord.updated_at
        ? new Date(leadRecord.updated_at).toISOString()
        : new Date().toISOString(),
    };
  }

  static toSummaryDto(leadRecord: any): LeadSummaryDto {
    const studentFullName = [leadRecord.student_first_name, leadRecord.student_last_name]
      .filter(Boolean)
      .join(' ');

    const counselorStaff = leadRecord.staff || null;
    const counselorUser = counselorStaff?.users_staff_user_idTousers || counselorStaff?.user || null;
    const counselorName = counselorUser
      ? [counselorUser.first_name, counselorUser.last_name].filter(Boolean).join(' ') || counselorUser.email
      : counselorStaff?.employee_code
      ? `Staff (${counselorStaff.employee_code})`
      : null;

    return {
      lead_id: leadRecord.lead_id,
      id: leadRecord.lead_id,
      lead_number: leadRecord.lead_number,
      student_name: studentFullName || leadRecord.student_first_name,
      contact_name: leadRecord.contact_name,
      contact_phone: leadRecord.contact_phone,
      stage: leadRecord.stage,
      status: leadRecord.stage,
      counselor_name: counselorName,
      created_at: leadRecord.created_at
        ? new Date(leadRecord.created_at).toISOString()
        : new Date().toISOString(),
    };
  }
}
