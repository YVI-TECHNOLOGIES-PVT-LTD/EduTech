import {
  ApplicationResponseDto,
  DocumentResponseDto,
  AssessmentResponseDto,
  DecisionResponseDto,
  FeePaymentResponseDto,
} from '../dto/response/application.response.dto';
import { ApplicationSummaryDto } from '../dto/response/application-summary.dto';

export class AdmissionMapper {
  static toResponseDto(record: any): ApplicationResponseDto {
    const lead = record.leads;
    const studentFullName = lead
      ? [lead.student_first_name, lead.student_last_name].filter(Boolean).join(' ')
      : 'N/A';

    const documents: DocumentResponseDto[] = (record.admission_documents || []).map((doc: any) => ({
      document_id: doc.document_id,
      document_type_id: doc.document_type_id,
      file_path: doc.file_path,
      verify_status: doc.verify_status,
      verification_remarks: doc.verification_remarks || null,
      uploaded_at: doc.uploaded_at
        ? new Date(doc.uploaded_at).toISOString()
        : new Date().toISOString(),
      verified_by: doc.verified_by || null,
      verified_at: doc.verified_at ? new Date(doc.verified_at).toISOString() : null,
    }));

    const assessment: AssessmentResponseDto | null = record.application_assessments
      ? {
          assessment_id: record.application_assessments.assessment_id,
          config_id: record.application_assessments.config_id,
          assessment_date: new Date(record.application_assessments.assessment_date).toISOString(),
          maximum_marks: record.application_assessments.maximum_marks
            ? Number(record.application_assessments.maximum_marks)
            : null,
          marks_obtained: record.application_assessments.marks_obtained
            ? Number(record.application_assessments.marks_obtained)
            : null,
          percentage: record.application_assessments.percentage
            ? Number(record.application_assessments.percentage)
            : null,
          result: record.application_assessments.result || null,
          remarks: record.application_assessments.remarks || null,
          assessed_by: record.application_assessments.assessed_by || null,
        }
      : null;

    const decision: DecisionResponseDto | null = record.admission_decisions
      ? {
          decision_id: record.admission_decisions.decision_id,
          decision_status: record.admission_decisions.decision_status,
          decision_date: new Date(record.admission_decisions.decision_date).toISOString(),
          decided_by: record.admission_decisions.decided_by || null,
          reason: record.admission_decisions.reason || null,
          remarks: record.admission_decisions.remarks || null,
          offer_expiry_date: record.admission_decisions.offer_expiry_date
            ? new Date(record.admission_decisions.offer_expiry_date).toISOString()
            : null,
          waitlist_position: record.admission_decisions.waitlist_position || null,
          scholarship_percentage: record.admission_decisions.scholarship_percentage
            ? Number(record.admission_decisions.scholarship_percentage)
            : null,
        }
      : null;

    const payment: FeePaymentResponseDto | null = record.admission_fee_payments
      ? {
          payment_id: record.admission_fee_payments.payment_id,
          payment_status: record.admission_fee_payments.payment_status,
          amount: Number(record.admission_fee_payments.amount),
          payment_date: record.admission_fee_payments.payment_date
            ? new Date(record.admission_fee_payments.payment_date).toISOString()
            : null,
          transaction_reference: record.admission_fee_payments.transaction_reference || null,
          remarks: record.admission_fee_payments.remarks || null,
        }
      : null;

    return {
      application_id: record.application_id,
      id: record.application_id,
      lead_id: record.lead_id,
      org_id: record.org_id,
      academic_year_id: record.academic_year_id,
      application_number: record.application_number,
      application_date: record.application_date
        ? new Date(record.application_date).toISOString()
        : new Date().toISOString(),
      status: record.status,
      created_at: record.created_at
        ? new Date(record.created_at).toISOString()
        : new Date().toISOString(),
      updated_at: record.updated_at
        ? new Date(record.updated_at).toISOString()
        : new Date().toISOString(),
      nationality: record.nationality || record.students?.nationality || null,
      previous_school_name: record.previous_school_name || record.previous_school || null,
      previous_school_address: record.previous_school_address || null,
      previous_school_board: record.previous_school_board || null,
      previous_grade: record.previous_grade || null,
      previous_school_year: record.previous_school_year || null,
      lead: lead
        ? {
            lead_id: lead.lead_id,
            lead_number: lead.lead_number,
            student_first_name: lead.student_first_name,
            student_last_name: lead.student_last_name || null,
            student_name: studentFullName || lead.student_first_name,
            contact_name: lead.contact_name,
            contact_phone: lead.contact_phone,
            contact_email: lead.contact_email || null,
          }
        : null,
      academic_year: record.academic_years
        ? {
            academic_year_id: record.academic_years.academic_year_id,
            academic_year_name: record.academic_years.academic_year_name,
          }
        : null,
      documents,
      assessment,
      decision,
      payment,
    };
  }

  static toSummaryDto(record: any): ApplicationSummaryDto {
    const lead = record.leads;
    const studentFullName = lead
      ? [lead.student_first_name, lead.student_last_name].filter(Boolean).join(' ')
      : 'N/A';

    return {
      application_id: record.application_id,
      id: record.application_id,
      application_number: record.application_number,
      lead_id: record.lead_id,
      student_name: studentFullName || 'N/A',
      contact_phone: lead?.contact_phone || 'N/A',
      status: record.status,
      application_date: record.application_date
        ? new Date(record.application_date).toISOString()
        : new Date().toISOString(),
      created_at: record.created_at
        ? new Date(record.created_at).toISOString()
        : new Date().toISOString(),
    };
  }
}
