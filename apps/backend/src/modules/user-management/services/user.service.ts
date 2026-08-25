import { UserRepository } from '../repositories/user.repository';
import { UserSearchRepository } from '../repositories/user.search.repository';
import { UserValidator } from '../validators/user.validator';
import { UserNotFoundError, DuplicateUserEmailError } from '../errors/user.errors';
import { CreateUserDto } from '../dto/request/create-user.dto';
import { UpdateUserDto } from '../dto/request/update-user.dto';
import { UpdateUserStatusDto } from '../dto/request/update-user-status.dto';
import { SearchUserDto } from '../dto/request/search-user.dto';
import { UserMapper } from '../mappers/user.mapper';
import { UserResponseDto, PaginatedResponse } from '../dto/response/user.response.dto';
import { UserEvents, UserEventType } from '../events/user.events';
import { logger } from '../../../utils/logger';
import { UserAvatarRepository } from '../repositories/user-avatar.repository';
import { UserAvatarService } from './user-avatar.service';

export class UserService {
  static async createUser(
    dto: CreateUserDto,
    performedBy?: string | null,
  ): Promise<UserResponseDto> {
    UserValidator.validateCreate(dto);

    const existingEmail = await UserRepository.findByEmail(dto.email);
    if (existingEmail) {
      throw new DuplicateUserEmailError(dto.email);
    }

    const user = await UserRepository.create(dto, performedBy);

    logger.info(`User profile created: ${user.user_id} (${user.email})`, {
      userId: user.user_id,
      email: user.email,
      performedBy,
    });

    // Post-commit event emission
    await UserEvents.publish(UserEventType.CREATED, {
      userId: user.user_id,
      email: user.email,
      status: user.status,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return UserMapper.toUserResponseDto(user);
  }

  static async getUserById(id: string): Promise<UserResponseDto> {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new UserNotFoundError(id);
    }
    const dto = UserMapper.toUserResponseDto(user);
    try {
      const avatarPath = await UserAvatarRepository.getAvatarPath(id);
      dto.avatar_url = await UserAvatarService.getAvatarSignedUrl(avatarPath);
    } catch (aErr) {
      dto.avatar_url = null;
    }
    return dto;
  }

  static async updateUser(
    id: string,
    dto: UpdateUserDto,
    performedBy?: string | null,
  ): Promise<UserResponseDto> {
    const existing = await UserRepository.findById(id);
    if (!existing) {
      throw new UserNotFoundError(id);
    }

    if (dto.email && dto.email !== existing.email) {
      const duplicate = await UserRepository.findByEmail(dto.email);
      if (duplicate) throw new DuplicateUserEmailError(dto.email);
    }

    const updated = await UserRepository.update(id, dto, performedBy);

    logger.info(`User profile updated: ${id}`, { userId: id, performedBy });

    // Post-commit event emission
    await UserEvents.publish(UserEventType.UPDATED, {
      userId: id,
      email: updated.email,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return UserMapper.toUserResponseDto(updated);
  }

  static async updateUserStatus(
    id: string,
    dto: UpdateUserStatusDto,
    performedBy?: string | null,
  ): Promise<UserResponseDto> {
    const existing = await UserRepository.findById(id);
    if (!existing) {
      throw new UserNotFoundError(id);
    }

    const updated = await UserRepository.updateStatus(id, dto.status, performedBy);

    logger.info(`User status updated: ${id} -> ${dto.status}`, {
      userId: id,
      status: dto.status,
      performedBy,
    });

    // Post-commit event emission
    await UserEvents.publish(UserEventType.STATUS_CHANGED, {
      userId: id,
      status: dto.status,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return UserMapper.toUserResponseDto(updated);
  }

  static async searchUsers(params: SearchUserDto): Promise<PaginatedResponse<UserResponseDto>> {
    const result = await UserSearchRepository.search(params);

    return {
      data: result.items.map(UserMapper.toUserResponseDto),
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
