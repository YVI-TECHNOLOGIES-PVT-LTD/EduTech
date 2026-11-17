import { UserRole, UserPermission } from './role.types';

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatarUrl?: string;
  avatar_url?: string | null;
  photo_url?: string | null;
  profileImage?: { available: boolean; url: string | null };
  phone?: string;
  phoneNumber?: string;
  roles?: string[];
  role?: string | UserRole;
  permissions?: string[] | UserPermission[];
  isActive?: boolean;
  login_status?: string;
  school_id?: string;
  org_id?: string;
  tenantId?: string;
  schoolId?: string;
  hasEnrolledStudent?: boolean;
  isPostAdmission?: boolean;
}
