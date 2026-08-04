import { supabase } from '../../config/supabase';

export interface AssignFacultyParams {
  sectionId: string;
  facultyId: string;
  academicYearId: string;
  assignedBy: string;
}

export class AcademicAssignmentService {
  /**
   * Assigns a faculty to a section and automatically maps all active students in that section to the faculty.
   */
  static async assignFacultyToSection(params: AssignFacultyParams): Promise<void> {
    const { sectionId, facultyId, academicYearId, assignedBy } = params;
    const { error } = await supabase.rpc('fn_assign_faculty_to_section', {
      p_section_id: sectionId,
      p_faculty_id: facultyId,
      p_academic_year_id: academicYearId,
      p_assigned_by: assignedBy,
    });
    if (error) throw error;
  }

  /**
   * When a new student is added to a section, automatically map them to existing faculty of that section.
   */
  static async syncStudentWithSectionFaculty(
    studentId: string,
    sectionId: string,
    academicYearId: string,
  ): Promise<void> {
    const { error } = await supabase.rpc('fn_sync_student_with_faculty', {
      p_student_id: studentId,
      p_section_id: sectionId,
      p_academic_year_id: academicYearId,
    });
    if (error) throw error;
  }

  /**
   * Soft remove faculty from section
   */
  static async removeFacultyFromSection(
    sectionId: string,
    facultyId: string,
    academicYearId: string,
    performedBy?: string,
  ): Promise<void> {
    const { error: assignError } = await supabase
      .from('section_faculty_assignments')
      .update({ status: 'INACTIVE' })
      .match({ section_id: sectionId, faculty_id: facultyId, academic_year_id: academicYearId });
    if (assignError) throw assignError;

    const { error: mapError } = await supabase
      .from('student_faculty_assignments')
      .update({ status: 'INACTIVE' })
      .match({
        section_id: sectionId,
        faculty_id: facultyId,
        academic_year_id: academicYearId,
        source: 'SECTION_AUTO',
      });
    if (mapError) throw mapError;

    await supabase.from('academic_automation_logs').insert({
      action: 'FACULTY_REMOVED_FROM_SECTION',
      details: { sectionId, facultyId },
      performed_by: performedBy,
    });
  }
}
