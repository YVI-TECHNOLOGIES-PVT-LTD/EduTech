import { SearchUserDto } from '../dto/request/search-user.dto';

export function sanitizeUserSearchQuery(params: SearchUserDto) {
  return {
    page: Math.max(1, params.page || 1),
    pageSize: Math.min(100, Math.max(1, params.pageSize || 20)),
    sort: params.sort || 'created_at',
    order: params.order || 'desc',
    searchText: params.searchText?.trim() || undefined,
    org_id: params.org_id || undefined,
    status: params.status || undefined,
    role_id: params.role_id || undefined,
  };
}
