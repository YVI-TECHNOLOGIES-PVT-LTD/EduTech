import { ParentResponseDto, LinkedStudentResponseDto } from '../dto/response/parent.response.dto';
import { ParentSummaryDto } from '../dto/response/parent-summary.dto';

export class ParentMapper {
  static toResponseDto(record: any): ParentResponseDto {
    const parentFullName = [record.first_name, record.last_name].filter(Boolean).join(' ');

    const linked_students: LinkedStudentResponseDto[] = (record.student_parents || []).map((sp: any) => {
      const student = sp.students;
      const studentName = student
        ? [student.first_name, student.last_name].filter(Boolean).join(' ')
        : 'N/A';

      return {
        student_id: sp.student_id,
        admission_no: student?.admission_no || 'N/A',
        student_first_name: student?.first_name || 'N/A',
        student_last_name: student?.last_name || null,
        student_name: studentName || 'N/A',
        relationship: sp.relationship,
        is_primary_contact: Boolean(sp.is_primary_contact),
        status: student?.status || 'active',
      };
    });

    return {
      parent_id: record.parent_id,
      id: record.parent_id,
      org_id: record.org_id,
      first_name: record.first_name,
      last_name: record.last_name || null,
      parent_name: parentFullName || record.first_name,
      phone: record.phone,
      email: record.email || null,
      occupation: record.occupation || null,
      user_id: record.user_id || null,
      created_at: record.created_at ? new Date(record.created_at).toISOString() : new Date().toISOString(),
      updated_at: record.updated_at ? new Date(record.updated_at).toISOString() : new Date().toISOString(),
      linked_students,
    };
  }

  static toSummaryDto(record: any): ParentSummaryDto {
    const parentFullName = [record.first_name, record.last_name].filter(Boolean).join(' ');

    return {
      parent_id: record.parent_id,
      id: record.parent_id,
      parent_name: parentFullName || record.first_name,
      phone: record.phone,
      email: record.email || null,
      linked_students_count: record.student_parents?.length || 0,
      created_at: record.created_at ? new Date(record.created_at).toISOString() : new Date().toISOString(),
    };
  }
}
