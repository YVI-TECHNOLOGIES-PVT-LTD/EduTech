import { StudentEnrollmentRepository } from '../repositories/student.enrollment.repository';
import { StudentRepository } from '../repositories/student.repository';
import { StudentNotFoundError, EnrollmentNotFoundError } from '../errors/student.errors';
import { EnrollmentValidator } from '../validators/enrollment.validator';
import { EnrollStudentDto } from '../dto/request/enroll-student.dto';
import { AssignSectionDto } from '../dto/request/assign-section.dto';
import { StudentEvents, StudentEventType } from '../events/student.events';
import { logger } from '../../../utils/logger';

export class StudentEnrollmentService {
  static async enrollStudent(studentId: string, createdBy: string | null, dto: EnrollStudentDto) {
    const student = await StudentRepository.findById(studentId);
    if (!student) {
      throw new StudentNotFoundError(studentId);
    }

    EnrollmentValidator.validateEnroll(dto);

    const enrollment = await StudentEnrollmentRepository.enroll(studentId, createdBy, dto);

    logger.info(`Student ${studentId} enrolled in grade ${dto.academic_year_grade_id}`, {
      studentId,
      enrollmentId: enrollment.enrollment_id,
      createdBy,
    });

    // Post-commit event emission
    await StudentEvents.publish(StudentEventType.ENROLLED, {
      studentId,
      admissionNo: student.admission_no,
      performedBy: createdBy ? String(createdBy) : undefined,
      timestamp: new Date().toISOString(),
      metadata: {
        enrollmentId: enrollment.enrollment_id,
        academicYearGradeId: dto.academic_year_grade_id,
      },
    });

    return enrollment;
  }

  static async getEnrollmentsByStudent(studentId: string) {
    const student = await StudentRepository.findById(studentId);
    if (!student) {
      throw new StudentNotFoundError(studentId);
    }

    return StudentEnrollmentRepository.findByStudentId(studentId);
  }

  static async assignSection(
    enrollmentId: string,
    performedBy: string | null,
    dto: AssignSectionDto,
  ) {
    const existing = await StudentEnrollmentRepository.findById(enrollmentId);
    if (!existing) {
      throw new EnrollmentNotFoundError(enrollmentId);
    }

    EnrollmentValidator.validateAssignSection(dto);

    const updated = await StudentEnrollmentRepository.assignSection(enrollmentId, dto);

    logger.info(`Section ${dto.section_id} assigned to enrollment ${enrollmentId}`, {
      enrollmentId,
      sectionId: dto.section_id,
      rollNumber: dto.roll_number,
      performedBy,
    });

    // Post-commit event emission
    await StudentEvents.publish(StudentEventType.SECTION_ASSIGNED, {
      studentId: existing.student_id,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
      metadata: { enrollmentId, sectionId: dto.section_id, rollNumber: dto.roll_number },
    });

    return updated;
  }
}
