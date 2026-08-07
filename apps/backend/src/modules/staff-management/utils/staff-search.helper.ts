import { SearchStaffDto } from '../dto/request/search-staff.dto';

export function sanitizeStaffSearchQuery(params: SearchStaffDto) {
  return {
    page: Math.max(1, params.page || 1),
    pageSize: Math.min(100, Math.max(1, params.pageSize || 20)),
    sort: params.sort || 'created_at',
    order: params.order || 'desc',
    searchText: params.searchText?.trim() || undefined,
    org_id: params.org_id || undefined,
    designation_id: params.designation_id || undefined,
    department_id: params.department_id || undefined,
    is_active: params.is_active !== undefined ? params.is_active : undefined,
  };
}
