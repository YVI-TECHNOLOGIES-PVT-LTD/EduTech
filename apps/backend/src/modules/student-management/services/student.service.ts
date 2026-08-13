import { enrollment_status } from '../constants/student.constants';
import { StudentRepository } from '../repositories/student.repository';
import { StudentSearchRepository } from '../repositories/student.search.repository';
import { StudentValidator } from '../validators/student.validator';
import {
  StudentNotFoundError,
  StudentValidationError,
  DuplicateAdmissionNumberError,
  DuplicateApplicationStudentError,
} from '../errors/student.errors';
import { CreateStudentDto } from '../dto/request/create-student.dto';
import { UpdateStudentDto } from '../dto/request/update-student.dto';
import { UpdateStudentStatusDto } from '../dto/request/update-status.dto';
import { SearchStudentDto } from '../dto/request/search-student.dto';
import { StudentMapper } from '../mappers/student.mapper';
import { StudentResponseDto, PaginatedResponse } from '../dto/response/student.response.dto';
import { StudentEvents, StudentEventType } from '../events/student.events';
import { logger } from '../../../utils/logger';

export class StudentService {
  static async createStudent(
    dto: CreateStudentDto,
    performedBy?: string | null,
  ): Promise<StudentResponseDto> {
    StudentValidator.validateCreate(dto);

    const existingApp = await StudentRepository.findByApplicationId(dto.application_id);
    if (existingApp) {
      throw new DuplicateApplicationStudentError(dto.application_id);
    }

    if (dto.admission_no) {
      const existingNo = await StudentRepository.findByAdmissionNo(dto.org_id, dto.admission_no);
      if (existingNo) {
        throw new DuplicateAdmissionNumberError(dto.admission_no);
      }
    }

    const student = await StudentRepository.create(dto);

    logger.info(`Student profile created: ${student.student_id} (${student.admission_no})`, {
      studentId: student.student_id,
      admissionNo: student.admission_no,
      applicationId: dto.application_id,
      performedBy,
    });

    // Post-commit event emission
    await StudentEvents.publish(StudentEventType.CREATED, {
      studentId: student.student_id,
      admissionNo: student.admission_no,
      applicationId: dto.application_id,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return StudentMapper.toResponseDto(student);
  }

  static async getStudentById(id: string): Promise<StudentResponseDto> {
    const student = await StudentRepository.findById(id);
    if (!student) {
      throw new StudentNotFoundError(id);
    }
    return StudentMapper.toResponseDto(student);
  }

  static async updateStudent(
    id: string,
    dto: UpdateStudentDto,
    performedBy?: string | null,
  ): Promise<StudentResponseDto> {
    const existing = await StudentRepository.findById(id);
    if (!existing) {
      throw new StudentNotFoundError(id);
    }

    if (dto.status && dto.status !== existing.status) {
      StudentValidator.validateStatusTransition(existing.status, dto.status);
    }

    const updated = await StudentRepository.update(id, dto);

    logger.info(`Student profile updated: ${id}`, { studentId: id, performedBy });

    // Post-commit event emission
    await StudentEvents.publish(StudentEventType.UPDATED, {
      studentId: id,
      admissionNo: existing.admission_no,
      previousStatus: existing.status,
      newStatus: updated.status,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return StudentMapper.toResponseDto(updated);
  }

  static async updateStatus(
    id: string,
    dto: UpdateStudentStatusDto,
    performedBy?: string | null,
  ): Promise<StudentResponseDto> {
    const existing = await StudentRepository.findById(id);
    if (!existing) {
      throw new StudentNotFoundError(id);
    }

    StudentValidator.validateStatusTransition(existing.status, dto.status);

    const updated = await StudentRepository.updateStatus(id, dto.status);

    logger.info(`Student status updated: ${id} (${existing.status} -> ${dto.status})`, {
      studentId: id,
      previousStatus: existing.status,
      newStatus: dto.status,
      performedBy,
    });

    // Post-commit event emission
    await StudentEvents.publish(StudentEventType.STATUS_CHANGED, {
      studentId: id,
      admissionNo: existing.admission_no,
      previousStatus: existing.status,
      newStatus: dto.status,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return StudentMapper.toResponseDto(updated);
  }

  static async deleteStudent(
    id: string,
    performedBy?: string | null,
  ): Promise<{ success: boolean }> {
    const existing = await StudentRepository.findById(id);
    if (!existing) {
      throw new StudentNotFoundError(id);
    }

    await StudentRepository.delete(id);

    logger.info(`Student profile deleted: ${id}`, { studentId: id, performedBy });

    // Post-commit event emission
    await StudentEvents.publish(StudentEventType.DELETED, {
      studentId: id,
      admissionNo: existing.admission_no,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  static async searchStudents(
    params: SearchStudentDto,
  ): Promise<PaginatedResponse<StudentResponseDto>> {
    const result = await StudentSearchRepository.search(params);

    return {
      data: result.items.map(StudentMapper.toResponseDto),
      meta: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
    };
  }

  static async getApprovedApplications(orgId?: string, search?: string) {
    const prisma = (await import('../../../lib/prismaClient')).default;
    const where: any = {
      status: 'approved',
    };
    if (orgId) {
      where.org_id = orgId;
    }
    if (search && search.trim() !== '') {
      const text = search.trim();
      where.OR = [
        { application_number: { contains: text, mode: 'insensitive' } },
        { leads: { student_first_name: { contains: text, mode: 'insensitive' } } },
        { leads: { student_last_name: { contains: text, mode: 'insensitive' } } },
        { leads: { contact_name: { contains: text, mode: 'insensitive' } } },
        { leads: { contact_phone: { contains: text, mode: 'insensitive' } } },
      ];
    }

    const applications = await prisma.admissions_applications.findMany({
      where,
      include: {
        leads: {
          include: {
            academic_year_grades: {
              include: {
                grades: true,
                sections: true,
              },
            },
          },
        },
        academic_years: true,
        students: {
          include: {
            student_enrollments: {
              include: {
                sections: true,
                academic_year_grades: {
                  include: { grades: true },
                },
              },
            },
            student_parents: {
              include: { parents: true },
            },
          },
        },
      },
      orderBy: { updated_at: 'desc' },
    });

    return applications.map((app: any) => {
      const isEnrolled = !!app.students;
      return {
        application_id: app.application_id,
        application_number: app.application_number,
        org_id: app.org_id,
        academic_year_id: app.academic_year_id,
        academic_year_name: app.academic_years?.academic_year_name,
        status: app.status,
        created_at: app.created_at,
        student_name:
          [app.leads?.student_first_name, app.leads?.student_last_name].filter(Boolean).join(' ') ||
          'Applicant',
        student_first_name: app.leads?.student_first_name || 'Applicant',
        student_last_name: app.leads?.student_last_name || '',
        contact_name: app.leads?.contact_name || '',
        contact_phone: app.leads?.contact_phone || '',
        contact_email: app.leads?.contact_email || '',
        contact_relationship: app.leads?.contact_relationship || 'guardian',
        grade_name: app.leads?.academic_year_grades?.grades?.grade_name || 'Grade N/A',
        academic_year_grade_id: app.leads?.academic_year_grade_id || '',
        available_sections: app.leads?.academic_year_grades?.sections || [],
        is_enrolled: isEnrolled,
        student: app.students || null,
      };
    });
  }

  static async convertApplicationToStudent(
    applicationId: string,
    performedBy?: string | null,
    orgId?: string,
    body?: { section_id?: string; roll_number?: string; remarks?: string },
  ) {
    const prisma = (await import('../../../lib/prismaClient')).default;
    const app = await prisma.admissions_applications.findUnique({
      where: { application_id: applicationId },
      include: {
        leads: {
          include: {
            academic_year_grades: true,
          },
        },
        students: {
          include: {
            student_enrollments: {
              include: { sections: true, academic_year_grades: { include: { grades: true } } },
            },
            student_parents: {
              include: { parents: true },
            },
          },
        },
      },
    });

    if (!app) {
      throw new StudentValidationError(`Application not found: ${applicationId}`);
    }

    if (orgId && app.org_id !== orgId) {
      throw new StudentValidationError(`Application not found: ${applicationId}`);
    }

    if (app.status !== 'approved') {
      throw new StudentValidationError(
        `Only approved applications can be enrolled. Current status: ${app.status}`,
      );
    }

    // IDEMPOTENCY CHECK: If already converted to student, return existing record without duplicate creation!
    if (app.students) {
      logger.info(
        `Application ${applicationId} is already enrolled. Returning existing student ${app.students.student_id}`,
      );
      return {
        is_existing: true,
        student: app.students,
      };
    }

    const lead = app.leads;
    const studentFirstName = lead?.student_first_name || 'Student';
    const studentLastName = lead?.student_last_name || undefined;
    const dob = lead?.dob ? new Date(lead.dob) : undefined;
    const gender = lead?.gender || undefined;

    // Resolve or create Parent record
    const parentPhone = lead?.contact_phone || '0000000000';
    const parentEmail = lead?.contact_email || undefined;
    const parentName = lead?.contact_name || 'Parent';

    let parent = await prisma.parents.findFirst({
      where: {
        org_id: app.org_id,
        phone: parentPhone,
      },
    });

    if (!parent) {
      const nameParts = parentName.trim().split(' ');
      const pFirstName = nameParts[0] || 'Parent';
      const pLastName = nameParts.slice(1).join(' ') || undefined;

      parent = await prisma.parents.create({
        data: {
          org_id: app.org_id,
          first_name: pFirstName,
          last_name: pLastName,
          phone: parentPhone,
          email: parentEmail,
          created_by: performedBy || undefined,
        },
      });
    }

    // Resolve academic_year_grade_id
    const aygId = lead?.academic_year_grade_id;
    if (!aygId) {
      throw new Error('Academic year grade is required for student enrollment');
    }

    // Generate collision-checked admission_no
    const year = new Date().getFullYear();
    let count = await prisma.students.count({ where: { org_id: app.org_id } });
    let admissionNo = `ADM-${year}-${String(count + 1).padStart(5, '0')}`;
    let attempts = 0;
    while (attempts < 10) {
      const exists = await prisma.students.findFirst({
        where: { org_id: app.org_id, admission_no: admissionNo },
      });
      if (!exists) break;
      count += 1;
      admissionNo = `ADM-${year}-${String(count + 1).padStart(5, '0')}`;
      attempts += 1;
    }

    // ATOMIC PRISMA TRANSACTION for Student + Parent Link + Student Enrollment + Lead Stage Update
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Student
      const student = await tx.students.create({
        data: {
          org_id: app.org_id,
          application_id: applicationId,
          admission_no: admissionNo,
          first_name: studentFirstName,
          last_name: studentLastName,
          dob,
          gender,
          admission_date: new Date(),
          status: 'active',
          created_by: performedBy || undefined,
        },
      });

      // 2. Link Parent
      const relationshipEnum = lead?.contact_relationship || 'guardian';
      await tx.student_parents.create({
        data: {
          student_id: student.student_id,
          parent_id: (parent as any).parent_id,
          relationship: relationshipEnum as any,
          is_primary_contact: true,
          created_by: performedBy || undefined,
        },
      });

      // 3. Create Student Enrollment
      const enrollment = await tx.student_enrollments.create({
        data: {
          student_id: student.student_id,
          academic_year_grade_id: aygId,
          section_id: body?.section_id || undefined,
          roll_number: body?.roll_number || undefined,
          enrollment_date: new Date(),
          status: 'active',
          remarks: body?.remarks || 'Enrolled from approved application',
          created_by: performedBy || undefined,
        },
      });

      // 4. Update Lead Stage to enrolled if lead exists
      if (app.lead_id) {
        await tx.leads.update({
          where: { lead_id: app.lead_id },
          data: { stage: 'enrolled', updated_at: new Date() },
        });
      }

      return { student, enrollment };
    });

    const fullStudent = await StudentRepository.findById(result.student.student_id);

    logger.info(
      `Student ${result.student.student_id} (${admissionNo}) created from application ${applicationId}`,
      {
        studentId: result.student.student_id,
        admissionNo,
        applicationId,
        performedBy,
      },
    );

    await StudentEvents.publish(StudentEventType.ENROLLED, {
      studentId: result.student.student_id,
      admissionNo,
      applicationId,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return {
      is_existing: false,
      student: fullStudent,
    };
  }
}
