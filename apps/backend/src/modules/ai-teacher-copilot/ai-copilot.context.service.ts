import { AiCopilotForbiddenError, AiCopilotNotFoundError } from './ai-copilot.types';
import { AiCopilotRepository } from './ai-copilot.repository';
import { AiCopilotGuardrails } from './ai-copilot.guardrails';

export class AiCopilotContextService {
  /**
   * Resolve teacher staff context and assigned academic offerings.
   */
  static async resolveTeacherContext(orgId: string, userId: string) {
    const context = await AiCopilotRepository.getTeacherAcademicContext(orgId, userId);
    if (!context) {
      throw new AiCopilotForbiddenError(
        'Forbidden: No active teacher staff profile found for this user in the specified organization.',
      );
    }
    return context;
  }

  /**
   * Verify that the requested faculty assignment belongs to this teacher in this org.
   */
  static async verifyFacultyAssignment(
    orgId: string,
    staffId: string,
    facultyAssignmentId: string,
  ) {
    const assignment = await AiCopilotRepository.getFacultyAssignmentScoped(
      orgId,
      staffId,
      facultyAssignmentId,
    );
    if (!assignment) {
      throw new AiCopilotForbiddenError(
        'Forbidden: You are not assigned to this class section or subject offering.',
      );
    }
    return assignment;
  }

  /**
   * Assemble curriculum outline and units if a curriculum plan exists.
   */
  static async assembleCurriculumContext(curriculumPlanId?: string | null) {
    if (!curriculumPlanId) return '';
    try {
      const units = await AiCopilotRepository.getCurriculumUnits(curriculumPlanId);
      if (!units || units.length === 0) return '';
      return units
        .map(
          (u) =>
            `Unit ${u.unit_code}: ${u.unit_title} (${u.planned_duration_periods} periods)\nOutcomes:\n- ${Array.isArray(u.learning_outcomes) ? u.learning_outcomes.join('\n- ') : 'None specified'}`,
        )
        .join('\n\n');
    } catch {
      return '';
    }
  }

  /**
   * Build an anonymized performance context snapshot for student or section analysis.
   */
  static async buildPerformanceContextSnapshot(
    orgId: string,
    sectionId: string,
    targetStudentId?: string | null,
  ) {
    const students = await AiCopilotRepository.getSectionPerformanceSnapshot(orgId, sectionId);
    if (!students || students.length === 0) {
      return {
        student_count: 0,
        average_attendance: 100,
        sample_size: 'insufficient',
        anonymized_metrics: [],
      };
    }

    if (targetStudentId) {
      const target = students.find((s) => s.student_id === targetStudentId);
      if (!target) {
        throw new AiCopilotNotFoundError('Target student not found in this section.');
      }
      return {
        student_count: 1,
        target_student: {
          label: AiCopilotGuardrails.anonymizeStudentLabel(target.student_id, 0),
          attendance_rate: target.attendance_rate,
          submission_count: target.submission_count,
          average_marks: target.average_marks,
        },
      };
    }

    const avgAttendance =
      students.reduce((acc, s) => acc + s.attendance_rate, 0) / (students.length || 1);
    const validMarks = students.filter((s) => s.average_marks !== null);
    const overallAvgMarks =
      validMarks.length > 0
        ? validMarks.reduce((acc, s) => acc + (s.average_marks || 0), 0) / validMarks.length
        : null;

    const anonymizedList = students.map((s, idx) => ({
      label: AiCopilotGuardrails.anonymizeStudentLabel(s.student_id, idx),
      student_id: s.student_id,
      attendance: s.attendance_rate,
      submissions: s.submission_count,
      marks: s.average_marks,
    }));

    return {
      total_students: students.length,
      average_attendance: Math.round(avgAttendance * 10) / 10,
      average_marks: overallAvgMarks ? Math.round(overallAvgMarks * 10) / 10 : null,
      students: anonymizedList,
    };
  }
}
