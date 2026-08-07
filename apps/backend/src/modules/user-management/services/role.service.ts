import { RoleRepository } from '../repositories/role.repository';
import { UserValidator } from '../validators/user.validator';
import { RoleNotFoundError, DuplicateRoleNameError } from '../errors/user.errors';
import { CreateRoleDto } from '../dto/request/create-role.dto';
import { UpdateRoleDto } from '../dto/request/update-role.dto';
import { RoleResponseDto } from '../dto/response/role.response.dto';
import { UserMapper } from '../mappers/user.mapper';
import { logger } from '../../../utils/logger';

export class RoleService {
  static async createRole(dto: CreateRoleDto, performedBy?: string | null): Promise<RoleResponseDto> {
    UserValidator.validateCreateRole(dto);

    const existing = await RoleRepository.findByName(dto.org_id, dto.role_name);
    if (existing) {
      throw new DuplicateRoleNameError(dto.role_name);
    }

    const role = await RoleRepository.create(dto, performedBy);

    logger.info(`Role created: ${role.role_id} (${role.role_name})`, {
      roleId: role.role_id,
      name: role.role_name,
      performedBy,
    });

    return UserMapper.toRoleResponseDto(role);
  }

  static async getRoleById(id: string): Promise<RoleResponseDto> {
    const role = await RoleRepository.findById(id);
    if (!role) {
      throw new RoleNotFoundError(id);
    }
    return UserMapper.toRoleResponseDto(role);
  }

  static async updateRole(id: string, dto: UpdateRoleDto, performedBy?: string | null): Promise<RoleResponseDto> {
    const existing = await RoleRepository.findById(id);
    if (!existing) {
      throw new RoleNotFoundError(id);
    }

    const updated = await RoleRepository.update(id, dto, performedBy);

    logger.info(`Role updated: ${id}`, { roleId: id, performedBy });

    return UserMapper.toRoleResponseDto(updated);
  }

  static async getAllRoles(orgId?: string): Promise<RoleResponseDto[]> {
    const roles = await RoleRepository.findAll(orgId);
    return roles.map(UserMapper.toRoleResponseDto);
  }
}
