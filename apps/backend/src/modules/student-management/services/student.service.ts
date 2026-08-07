import { enrollment_status } from '../constants/student.constants';
import { StudentRepository } from '../repositories/student.repository';
import { StudentSearchRepository } from '../repositories/student.search.repository';
import { StudentValidator } from '../validators/student.validator';
import { StudentNotFoundError, DuplicateAdmissionNumberError, DuplicateApplicationStudentError } from '../errors/student.errors';
import { CreateStudentDto } from '../dto/request/create-student.dto';
import { UpdateStudentDto } from '../dto/request/update-student.dto';
import { UpdateStudentStatusDto } from '../dto/request/update-status.dto';
import { SearchStudentDto } from '../dto/request/search-student.dto';
import { StudentMapper } from '../mappers/student.mapper';
import { StudentResponseDto, PaginatedResponse } from '../dto/response/student.response.dto';
import { StudentEvents, StudentEventType } from '../events/student.events';
import { logger } from '../../../utils/logger';

export class StudentService {
  static async createStudent(dto: CreateStudentDto, performedBy?: string | null): Promise<StudentResponseDto> {
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

  static async updateStudent(id: string, dto: UpdateStudentDto, performedBy?: string | null): Promise<StudentResponseDto> {
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

  static async updateStatus(id: string, dto: UpdateStudentStatusDto, performedBy?: string | null): Promise<StudentResponseDto> {
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

  static async deleteStudent(id: string, performedBy?: string | null): Promise<{ success: boolean }> {
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

  static async searchStudents(params: SearchStudentDto): Promise<PaginatedResponse<StudentResponseDto>> {
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
}
