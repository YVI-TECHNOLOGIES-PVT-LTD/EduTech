import { SearchParentDto } from '../dto/request/search-parent.dto';

export function sanitizeParentSearchQuery(params: SearchParentDto) {
  return {
    page: Math.max(1, params.page || 1),
    pageSize: Math.min(100, Math.max(1, params.pageSize || 20)),
    sort: params.sort || 'created_at',
    order: params.order || 'desc',
    searchText: params.searchText?.trim() || undefined,
    org_id: params.org_id || undefined,
  };
}
