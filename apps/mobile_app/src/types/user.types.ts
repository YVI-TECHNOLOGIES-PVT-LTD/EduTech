import { UserRole, UserPermission } from './role.types';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl?: string;
  phoneNumber?: string;
  role: UserRole;
  permissions: UserPermission[];
  isActive: boolean;
  tenantId: string;
  schoolId: string;
}
