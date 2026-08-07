import { StudentParentRepository } from '../repositories/student.parent.repository';
import { StudentRepository } from '../repositories/student.repository';
import { StudentNotFoundError } from '../errors/student.errors';
import { LinkParentDto } from '../dto/request/link-parent.dto';
import { StudentEvents, StudentEventType } from '../events/student.events';
import { logger } from '../../../utils/logger';

export class StudentParentService {
  static async linkParent(studentId: string, createdBy: string | null, dto: LinkParentDto) {
    const student = await StudentRepository.findById(studentId);
    if (!student) {
      throw new StudentNotFoundError(studentId);
    }

    const link = await StudentParentRepository.linkParent(studentId, createdBy, dto);

    logger.info(`Parent ${dto.parent_id} linked to student ${studentId} (${dto.relationship})`, {
      studentId,
      parentId: dto.parent_id,
      relationship: dto.relationship,
      createdBy,
    });

    // Post-commit event emission
    await StudentEvents.publish(StudentEventType.PARENT_LINKED, {
      studentId,
      admissionNo: student.admission_no,
      performedBy: createdBy ? String(createdBy) : undefined,
      timestamp: new Date().toISOString(),
      metadata: { parentId: dto.parent_id, relationship: dto.relationship },
    });

    return link;
  }

  static async unlinkParent(studentId: string, parentId: string) {
    const student = await StudentRepository.findById(studentId);
    if (!student) {
      throw new StudentNotFoundError(studentId);
    }

    return StudentParentRepository.unlinkParent(studentId, parentId);
  }

  static async getParentsByStudent(studentId: string) {
    const student = await StudentRepository.findById(studentId);
    if (!student) {
      throw new StudentNotFoundError(studentId);
    }

    return StudentParentRepository.findParentsByStudentId(studentId);
  }
}
