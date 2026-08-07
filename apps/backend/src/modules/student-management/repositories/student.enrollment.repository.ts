import { enrollment_status } from '../constants/student.constants';
import prisma from '../../../lib/prismaClient';
import { EnrollStudentDto } from '../dto/request/enroll-student.dto';
import { AssignSectionDto } from '../dto/request/assign-section.dto';

const db: any = prisma;

export class StudentEnrollmentRepository {
  static async enroll(studentId: string, createdBy: string | null, dto: EnrollStudentDto) {
    return db.student_enrollments.create({
      data: {
        student_id: studentId,
        academic_year_grade_id: dto.academic_year_grade_id,
        section_id: dto.section_id || undefined,
        roll_number: dto.roll_number || undefined,
        enrollment_date: dto.enrollment_date ? new Date(dto.enrollment_date) : new Date(),
        status: dto.status || enrollment_status.active,
        remarks: dto.remarks || undefined,
        created_by: createdBy || undefined,
      },
      include: {
        sections: true,
        academic_year_grades: true,
      },
    });
  }

  static async findById(enrollment_id: string) {
    return db.student_enrollments.findUnique({
      where: { enrollment_id },
      include: { sections: true, academic_year_grades: true },
    });
  }

  static async findByStudentId(student_id: string) {
    return db.student_enrollments.findMany({
      where: { student_id },
      include: { sections: true, academic_year_grades: true },
      orderBy: { enrollment_date: 'desc' },
    });
  }

  static async assignSection(enrollment_id: string, dto: AssignSectionDto) {
    const data: any = {
      section_id: dto.section_id,
      updated_at: new Date(),
    };
    if (dto.roll_number !== undefined) data.roll_number = dto.roll_number;
    if (dto.remarks !== undefined) data.remarks = dto.remarks;

    return db.student_enrollments.update({
      where: { enrollment_id },
      data,
      include: { sections: true, academic_year_grades: true },
    });
  }

  static async updateStatus(enrollment_id: string, status: enrollment_status, exitDate?: string | null, remarks?: string | null) {
    const data: any = {
      status,
      updated_at: new Date(),
    };
    if (exitDate) data.exit_date = new Date(exitDate);
    if (remarks) data.remarks = remarks;

    return db.student_enrollments.update({
      where: { enrollment_id },
      data,
    });
  }
}
