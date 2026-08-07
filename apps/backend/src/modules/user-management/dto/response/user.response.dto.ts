import { user_status } from '../../constants/user.constants';
import { RoleResponseDto } from './role.response.dto';

export interface UserResponseDto {
  user_id: string;
  id: string;
  org_id: string;
  first_name: string;
  last_name: string | null;
  full_name: string;
  email: string;
  phone: string;
  status: user_status;
  last_login_at: string | null;
  roles: RoleResponseDto[];
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
