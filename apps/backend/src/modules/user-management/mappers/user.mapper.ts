import { UserResponseDto } from '../dto/response/user.response.dto';
import { RoleResponseDto } from '../dto/response/role.response.dto';
import { UserSummaryDto } from '../dto/response/user-summary.dto';
import { user_status } from '../constants/user.constants';

export class UserMapper {
  static toUserResponseDto(record: any): UserResponseDto {
    const fullName = [record.first_name, record.last_name].filter(Boolean).join(' ');

    const roles: RoleResponseDto[] = (record.user_roles_user_idTousers || []).map((ur: any) => {
      const r = ur.roles || {};
      return {
        role_id: r.role_id || ur.role_id,
        id: r.role_id || ur.role_id,
        org_id: r.org_id || record.org_id,
        role_name: r.role_name || 'N/A',
        description: r.description || null,
        is_active: Boolean(r.is_active),
        granted_at: ur.granted_at ? new Date(ur.granted_at).toISOString() : null,
        granted_by: ur.granted_by || null,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
      };
    });

    return {
      user_id: record.user_id,
      id: record.user_id,
      org_id: record.org_id,
      first_name: record.first_name,
      last_name: record.last_name || null,
      full_name: fullName || record.email,
      email: record.email,
      phone: record.phone,
      status: (record.status as user_status) || user_status.active,
      last_login_at: record.last_login_at ? new Date(record.last_login_at).toISOString() : null,
      roles,
      created_at: record.created_at ? new Date(record.created_at).toISOString() : new Date().toISOString(),
      updated_at: record.updated_at ? new Date(record.updated_at).toISOString() : new Date().toISOString(),
    };
  }

  static toRoleResponseDto(record: any): RoleResponseDto {
    return {
      role_id: record.role_id,
      id: record.role_id,
      org_id: record.org_id,
      role_name: record.role_name,
      description: record.description || null,
      is_active: Boolean(record.is_active),
      created_at: record.created_at ? new Date(record.created_at).toISOString() : new Date().toISOString(),
      updated_at: record.updated_at ? new Date(record.updated_at).toISOString() : new Date().toISOString(),
    };
  }

  static toUserSummaryDto(record: any): UserSummaryDto {
    const fullName = [record.first_name, record.last_name].filter(Boolean).join(' ');
    const rolesCount = Array.isArray(record.user_roles_user_idTousers) ? record.user_roles_user_idTousers.length : 0;

    return {
      user_id: record.user_id,
      id: record.user_id,
      full_name: fullName || record.email,
      email: record.email,
      phone: record.phone,
      status: (record.status as user_status) || user_status.active,
      roles_count: rolesCount,
      created_at: record.created_at ? new Date(record.created_at).toISOString() : new Date().toISOString(),
    };
  }
}
