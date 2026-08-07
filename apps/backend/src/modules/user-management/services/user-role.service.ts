import { UserRepository } from '../repositories/user.repository';
import { RoleRepository } from '../repositories/role.repository';
import { UserRoleRepository } from '../repositories/user-role.repository';
import { UserNotFoundError, RoleNotFoundError } from '../errors/user.errors';
import { AssignRoleDto } from '../dto/request/assign-role.dto';
import { UserResponseDto } from '../dto/response/user.response.dto';
import { UserMapper } from '../mappers/user.mapper';
import { UserEvents, UserEventType } from '../events/user.events';
import { logger } from '../../../utils/logger';

export class UserRoleService {
  static async assignRole(
    userId: string,
    dto: AssignRoleDto,
    performedBy?: string | null,
  ): Promise<UserResponseDto> {
    const user = await UserRepository.findById(userId);
    if (!user) throw new UserNotFoundError(userId);

    const role = await RoleRepository.findById(dto.role_id);
    if (!role) throw new RoleNotFoundError(dto.role_id);

    const existing = await UserRoleRepository.find(userId, dto.role_id);
    if (!existing) {
      await UserRoleRepository.assign(userId, dto.role_id, performedBy);
      logger.info(`Role ${dto.role_id} assigned to user ${userId}`, {
        userId,
        roleId: dto.role_id,
        performedBy,
      });

      // Post-commit event emission
      await UserEvents.publish(UserEventType.ROLE_ASSIGNED, {
        userId,
        roleId: dto.role_id,
        performedBy: performedBy ? String(performedBy) : undefined,
        timestamp: new Date().toISOString(),
      });
    }

    const updatedUser = await UserRepository.findById(userId);
    return UserMapper.toUserResponseDto(updatedUser);
  }

  static async removeRole(
    userId: string,
    roleId: string,
    performedBy?: string | null,
  ): Promise<UserResponseDto> {
    const user = await UserRepository.findById(userId);
    if (!user) throw new UserNotFoundError(userId);

    const existing = await UserRoleRepository.find(userId, roleId);
    if (existing) {
      await UserRoleRepository.remove(userId, roleId);
      logger.info(`Role ${roleId} removed from user ${userId}`, { userId, roleId, performedBy });

      // Post-commit event emission
      await UserEvents.publish(UserEventType.ROLE_REMOVED, {
        userId,
        roleId,
        performedBy: performedBy ? String(performedBy) : undefined,
        timestamp: new Date().toISOString(),
      });
    }

    const updatedUser = await UserRepository.findById(userId);
    return UserMapper.toUserResponseDto(updatedUser);
  }
}
