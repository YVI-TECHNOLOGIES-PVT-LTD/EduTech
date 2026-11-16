import { SearchStudentDto } from '../dto/request/search-student.dto';

export function sanitizeStudentSearchQuery(params: SearchStudentDto) {
  return {
    page: Math.max(1, params.page || 1),
    pageSize: Math.min(100, Math.max(1, params.pageSize || 20)),
    sort: params.sort || 'created_at',
    order: params.order || 'desc',
    searchText: params.searchText?.trim() || undefined,
    status: params.status || undefined,
    org_id: params.org_id || undefined,
    academic_year_grade_id: params.academic_year_grade_id || undefined,
    section_id: params.section_id || undefined,
  };
}
