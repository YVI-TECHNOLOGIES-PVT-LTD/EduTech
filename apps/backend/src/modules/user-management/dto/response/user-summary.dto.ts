import { user_status } from '../../constants/user.constants';

export interface UserSummaryDto {
  user_id: string;
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: user_status;
  roles_count: number;
  created_at: string;
}
