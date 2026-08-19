import { SearchLeadDto } from '../dto/request/search-lead.dto';

export function sanitizeSearchQuery(params: SearchLeadDto) {
  return {
    page: Math.max(1, params.page || 1),
    pageSize: Math.min(100, Math.max(1, params.pageSize || 20)),
    sort: params.sort || 'created_at',
    order: params.order || 'desc',
    searchText: params.searchText?.trim() || undefined,
    stage: params.stage || params.status || undefined,
    status: params.stage || params.status || undefined,
    source: params.source || undefined,
    priority: params.priority || undefined,
    assigned_counsellor_id: params.assigned_counsellor_id || params.assignedTo || undefined,
    assignedTo: params.assigned_counsellor_id || params.assignedTo || undefined,
    academic_year_grade_id: params.academic_year_grade_id || undefined,
    academic_year_id: params.academic_year_id || undefined,
    grade_id: params.grade_id || undefined,
    org_id: params.org_id || undefined,
    startDate: params.startDate ? new Date(params.startDate) : undefined,
    endDate: params.endDate ? new Date(params.endDate) : undefined,
  };
}
