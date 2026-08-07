import { SearchApplicationDto } from '../dto/request/search-application.dto';

export function sanitizeApplicationSearchQuery(params: SearchApplicationDto) {
  return {
    page: Math.max(1, params.page || 1),
    pageSize: Math.min(100, Math.max(1, params.pageSize || 20)),
    sort: params.sort || 'created_at',
    order: params.order || 'desc',
    searchText: params.searchText?.trim() || undefined,
    status: params.status || undefined,
    academic_year_id: params.academic_year_id || undefined,
    org_id: params.org_id || undefined,
    startDate: params.startDate ? new Date(params.startDate) : undefined,
    endDate: params.endDate ? new Date(params.endDate) : undefined,
  };
}
