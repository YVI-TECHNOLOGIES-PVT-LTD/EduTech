import { SearchAcademicDto } from '../dto/request/search-academic.dto';

export function sanitizeAcademicSearchQuery(params: SearchAcademicDto) {
  return {
    page: Math.max(1, params.page || 1),
    pageSize: Math.min(100, Math.max(1, params.pageSize || 20)),
    sort: params.sort || 'created_at',
    order: params.order || 'desc',
    searchText: params.searchText?.trim() || undefined,
    org_id: params.org_id || undefined,
    academic_year_id: params.academic_year_id || undefined,
    grade_id: params.grade_id || undefined,
  };
}
