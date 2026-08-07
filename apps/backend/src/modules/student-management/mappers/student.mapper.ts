import {
  StudentResponseDto,
  EnrollmentResponseDto,
  StudentParentResponseDto,
} from '../dto/response/student.response.dto';
import { StudentSummaryDto } from '../dto/response/student-summary.dto';

export class StudentMapper {
  static toResponseDto(record: any): StudentResponseDto {
    const studentFullName = [record.first_name, record.last_name].filter(Boolean).join(' ');

    const enrollments: EnrollmentResponseDto[] = (record.student_enrollments || []).map((e: any) => ({
      enrollment_id: e.enrollment_id,
      academic_year_grade_id: e.academic_year_grade_id,
      section_id: e.section_id || null,
      roll_number: e.roll_number || null,
      enrollment_date: e.enrollment_date ? new Date(e.enrollment_date).toISOString() : new Date().toISOString(),
      exit_date: e.exit_date ? new Date(e.exit_date).toISOString() : null,
      status: e.status,
      remarks: e.remarks || null,
      section_name: e.sections?.section_name || null,
    }));

    const parents: StudentParentResponseDto[] = (record.student_parents || []).map((sp: any) => ({
      parent_id: sp.parent_id,
      relationship: sp.relationship,
      is_primary_contact: Boolean(sp.is_primary_contact),
      parent_first_name: sp.parents?.users_parents_user_idTousers?.first_name || null,
      parent_last_name: sp.parents?.users_parents_user_idTousers?.last_name || null,
      parent_phone: sp.parents?.users_parents_user_idTousers?.phone || null,
      parent_email: sp.parents?.users_parents_user_idTousers?.email || null,
    }));

    return {
      student_id: record.student_id,
      id: record.student_id,
      org_id: record.org_id,
      application_id: record.application_id,
      user_id: record.user_id || null,
      admission_no: record.admission_no,
      first_name: record.first_name,
      last_name: record.last_name || null,
      student_name: studentFullName || record.first_name,
      dob: record.dob ? new Date(record.dob).toISOString() : null,
      gender: record.gender || null,
      admission_date: record.admission_date ? new Date(record.admission_date).toISOString() : null,
      status: record.status,
      created_at: record.created_at ? new Date(record.created_at).toISOString() : new Date().toISOString(),
      updated_at: record.updated_at ? new Date(record.updated_at).toISOString() : new Date().toISOString(),
      enrollments,
      parents,
    };
  }

  static toSummaryDto(record: any): StudentSummaryDto {
    const studentFullName = [record.first_name, record.last_name].filter(Boolean).join(' ');

    return {
      student_id: record.student_id,
      id: record.student_id,
      admission_no: record.admission_no,
      student_name: studentFullName || 'N/A',
      status: record.status,
      admission_date: record.admission_date ? new Date(record.admission_date).toISOString() : null,
      created_at: record.created_at ? new Date(record.created_at).toISOString() : new Date().toISOString(),
    };
  }
}
