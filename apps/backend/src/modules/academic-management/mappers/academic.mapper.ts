import { AcademicYearResponseDto } from '../dto/response/academic-year.response.dto';
import { GradeResponseDto } from '../dto/response/grade.response.dto';
import { SectionResponseDto } from '../dto/response/section.response.dto';
import { AcademicYearGradeResponseDto } from '../dto/response/academic-year-grade.response.dto';

export class AcademicMapper {
  static toAcademicYearResponseDto(record: any): AcademicYearResponseDto {
    return {
      academic_year_id: record.academic_year_id,
      id: record.academic_year_id,
      org_id: record.org_id,
      academic_year_name: record.academic_year_name,
      start_date: record.start_date ? new Date(record.start_date).toISOString() : new Date().toISOString(),
      end_date: record.end_date ? new Date(record.end_date).toISOString() : new Date().toISOString(),
      status: record.status,
      created_at: record.created_at ? new Date(record.created_at).toISOString() : new Date().toISOString(),
      updated_at: record.updated_at ? new Date(record.updated_at).toISOString() : new Date().toISOString(),
    };
  }

  static toGradeResponseDto(record: any): GradeResponseDto {
    return {
      grade_id: record.grade_id,
      id: record.grade_id,
      org_id: record.org_id,
      grade_code: record.grade_code,
      grade_name: record.grade_name,
      board: record.board || null,
      display_order: record.display_order ?? 1,
      is_active: Boolean(record.is_active),
      created_at: record.created_at ? new Date(record.created_at).toISOString() : new Date().toISOString(),
      updated_at: record.updated_at ? new Date(record.updated_at).toISOString() : new Date().toISOString(),
    };
  }

  static toSectionResponseDto(record: any): SectionResponseDto {
    const teacherName = record.staff?.users_staff_user_idTousers
      ? [record.staff.users_staff_user_idTousers.first_name, record.staff.users_staff_user_idTousers.last_name].filter(Boolean).join(' ')
      : null;

    return {
      section_id: record.section_id,
      id: record.section_id,
      academic_year_grade_id: record.academic_year_grade_id,
      section_name: record.section_name,
      class_teacher_id: record.class_teacher_id || null,
      room_no: record.room_no || null,
      capacity: record.capacity ?? null,
      is_active: Boolean(record.is_active),
      created_at: record.created_at ? new Date(record.created_at).toISOString() : new Date().toISOString(),
      updated_at: record.updated_at ? new Date(record.updated_at).toISOString() : new Date().toISOString(),
      class_teacher_name: teacherName,
    };
  }

  static toAcademicYearGradeResponseDto(record: any): AcademicYearGradeResponseDto {
    const sections = (record.sections || []).map(AcademicMapper.toSectionResponseDto);

    return {
      academic_year_grade_id: record.academic_year_grade_id,
      id: record.academic_year_grade_id,
      academic_year_id: record.academic_year_id,
      grade_id: record.grade_id,
      intake_capacity: record.intake_capacity ?? null,
      is_active: Boolean(record.is_active),
      created_at: record.created_at ? new Date(record.created_at).toISOString() : new Date().toISOString(),
      updated_at: record.updated_at ? new Date(record.updated_at).toISOString() : new Date().toISOString(),
      academic_year_name: record.academic_years?.academic_year_name || undefined,
      grade_code: record.grades?.grade_code || undefined,
      grade_name: record.grades?.grade_name || undefined,
      sections,
    };
  }
}
