import { RoleRepository } from '../repositories/role.repository';
import { UserRoleRepository } from '../repositories/user-role.repository';

export class UserRoleQuery {
  static async getAllRoles(orgId?: string) {
    return RoleRepository.findAll(orgId);
  }

  static async getUserRoles(userId: string) {
    return UserRoleRepository.findByUser(userId);
  }
}
