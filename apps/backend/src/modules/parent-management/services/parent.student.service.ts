import { ParentStudentRepository } from '../repositories/parent.student.repository';
import { ParentRepository } from '../repositories/parent.repository';
import { ParentNotFoundError } from '../errors/parent.errors';
import { ParentValidator } from '../validators/parent.validator';
import { LinkStudentDto } from '../dto/request/link-student.dto';
import { ParentEvents, ParentEventType } from '../events/parent.events';
import { logger } from '../../../utils/logger';

export class ParentStudentService {
  static async linkStudent(parentId: string, createdBy: string | null, dto: LinkStudentDto) {
    const parent = await ParentRepository.findById(parentId);
    if (!parent) {
      throw new ParentNotFoundError(parentId);
    }

    ParentValidator.validateLinkStudent(dto);

    const link = await ParentStudentRepository.linkStudent(parentId, createdBy, dto);

    logger.info(`Student ${dto.student_id} linked to parent ${parentId} (${dto.relationship})`, {
      parentId,
      studentId: dto.student_id,
      relationship: dto.relationship,
      createdBy,
    });

    // Post-commit event emission
    await ParentEvents.publish(ParentEventType.STUDENT_LINKED, {
      parentId,
      studentId: dto.student_id,
      performedBy: createdBy ? String(createdBy) : undefined,
      timestamp: new Date().toISOString(),
      metadata: { relationship: dto.relationship },
    });

    return link;
  }

  static async unlinkStudent(parentId: string, studentId: string, performedBy?: string | null) {
    const parent = await ParentRepository.findById(parentId);
    if (!parent) {
      throw new ParentNotFoundError(parentId);
    }

    const result = await ParentStudentRepository.unlinkStudent(parentId, studentId);

    logger.info(`Student ${studentId} unlinked from parent ${parentId}`, { parentId, studentId, performedBy });

    // Post-commit event emission
    await ParentEvents.publish(ParentEventType.STUDENT_UNLINKED, {
      parentId,
      studentId,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return result;
  }

  static async getStudentsByParent(parentId: string) {
    const parent = await ParentRepository.findById(parentId);
    if (!parent) {
      throw new ParentNotFoundError(parentId);
    }

    return ParentStudentRepository.findStudentsByParentId(parentId);
  }
}
