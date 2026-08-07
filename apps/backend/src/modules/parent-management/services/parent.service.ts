import { ParentRepository } from '../repositories/parent.repository';
import { ParentSearchRepository } from '../repositories/parent.search.repository';
import { ParentValidator } from '../validators/parent.validator';
import { ParentNotFoundError, DuplicateParentError } from '../errors/parent.errors';
import { CreateParentDto } from '../dto/request/create-parent.dto';
import { UpdateParentDto } from '../dto/request/update-parent.dto';
import { SearchParentDto } from '../dto/request/search-parent.dto';
import { ParentMapper } from '../mappers/parent.mapper';
import { ParentResponseDto, PaginatedResponse } from '../dto/response/parent.response.dto';
import { ParentEvents, ParentEventType } from '../events/parent.events';
import { logger } from '../../../utils/logger';

export class ParentService {
  static async createParent(dto: CreateParentDto, performedBy?: string | null): Promise<ParentResponseDto> {
    ParentValidator.validateCreate(dto);

    const existingPhone = await ParentRepository.findByPhone(dto.org_id, dto.phone);
    if (existingPhone) {
      throw new DuplicateParentError(dto.phone);
    }

    const parent = await ParentRepository.create(dto);

    logger.info(`Parent profile created: ${parent.parent_id} (${parent.phone})`, {
      parentId: parent.parent_id,
      phone: parent.phone,
      performedBy,
    });

    // Post-commit event emission
    await ParentEvents.publish(ParentEventType.CREATED, {
      parentId: parent.parent_id,
      phone: parent.phone,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return ParentMapper.toResponseDto(parent);
  }

  static async getParentById(id: string): Promise<ParentResponseDto> {
    const parent = await ParentRepository.findById(id);
    if (!parent) {
      throw new ParentNotFoundError(id);
    }
    return ParentMapper.toResponseDto(parent);
  }

  static async updateParent(id: string, dto: UpdateParentDto, performedBy?: string | null): Promise<ParentResponseDto> {
    const existing = await ParentRepository.findById(id);
    if (!existing) {
      throw new ParentNotFoundError(id);
    }

    const updated = await ParentRepository.update(id, dto);

    logger.info(`Parent profile updated: ${id}`, { parentId: id, performedBy });

    // Post-commit event emission
    await ParentEvents.publish(ParentEventType.UPDATED, {
      parentId: id,
      phone: updated.phone,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return ParentMapper.toResponseDto(updated);
  }

  static async deleteParent(id: string, performedBy?: string | null): Promise<{ success: boolean }> {
    const existing = await ParentRepository.findById(id);
    if (!existing) {
      throw new ParentNotFoundError(id);
    }

    await ParentRepository.delete(id);

    logger.info(`Parent profile deleted: ${id}`, { parentId: id, performedBy });

    // Post-commit event emission
    await ParentEvents.publish(ParentEventType.DELETED, {
      parentId: id,
      phone: existing.phone,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  static async searchParents(params: SearchParentDto): Promise<PaginatedResponse<ParentResponseDto>> {
    const result = await ParentSearchRepository.search(params);

    return {
      data: result.items.map(ParentMapper.toResponseDto),
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
