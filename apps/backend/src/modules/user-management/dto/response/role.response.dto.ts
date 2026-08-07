export interface RoleResponseDto {
  role_id: string;
  id: string;
  org_id: string;
  role_name: string;
  description: string | null;
  is_active: boolean;
  granted_at?: string | null;
  granted_by?: string | null;
  created_at: string;
  updated_at: string;
}
