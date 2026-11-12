import { apiClient } from '@/lib/api-client';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface AcademicYearItem {
  academic_year_id: string;
  id?: string;
  org_id: string;
  academic_year_name: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  grade_offerings?: AcademicYearGradeItem[];
}

export interface GradeItem {
  grade_id: string;
  id?: string;
  org_id: string;
  grade_code: string;
  grade_name: string;
  board: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SectionItem {
  section_id: string;
  id?: string;
  academic_year_grade_id: string;
  section_name: string;
  class_teacher_id: string | null;
  class_teacher_name?: string | null;
  room_no: string | null;
  capacity: number | null;
  is_active: boolean;
  grade_id?: string;
  grade_name?: string;
  grade_code?: string;
  academic_year_id?: string;
  academic_year_name?: string;
}

export interface AcademicYearGradeItem {
  academic_year_grade_id: string;
  id?: string;
  academic_year_id: string;
  grade_id: string;
  intake_capacity: number | null;
  is_active: boolean;
  academic_year_name?: string;
  grade_code?: string;
  grade_name?: string;
  sections?: SectionItem[];
}

export interface AcademicOverviewMetrics {
  academic_years: {
    total: number;
    current: {
      academic_year_id: string;
      academic_year_name: string;
      start_date: string;
      end_date: string;
      status: string;
    } | null;
  };
  grades: { total: number };
  grade_offerings: { total: number };
  sections: { total: number };
  teacher_assignments: { assigned: number; unassigned: number };
  readiness: {
    academic_year_configured: boolean;
    grades_configured: boolean;
    grade_offerings_configured: boolean;
    sections_configured: boolean;
    class_teachers_assigned: boolean;
  };
}

export interface AcademicDashboardMetrics {
  total_academic_years: number;
  total_grades: number;
  total_sections: number;
  total_academic_year_grades: number;
  academic_years_by_status: Record<string, number>;
}

export interface BoardOverview {
  institutional_affiliation: string | null;
  organization_id: string;
  organization_name: string;
  configured_boards: Array<{ board: string | null; grades_count: number }>;
  total_configured_boards: number;
  supported_standards: Array<{
    code: string;
    name: string;
    description: string;
    category: string;
  }>;
}

export interface AcademicStructureTree {
  academic_year: AcademicYearItem;
  grades: AcademicYearGradeItem[];
}

export interface SubjectItem {
  subject_id: string;
  org_id: string;
  subject_category_id: string | null;
  subject_code: string;
  subject_name: string;
  description: string | null;
  is_active: boolean;
  category_code: string | null;
  category_name: string | null;
}

export interface SubjectCategoryItem {
  subject_category_id: string;
  category_code: string;
  category_name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

export interface GradeSubjectOfferingItem {
  academic_year_grade_subject_id: string;
  subject_id: string;
  subject_code: string;
  subject_name: string;
  category_name: string | null;
  subject_requirement: string;
  weekly_periods: number | null;
  theory_periods: number | null;
  practical_periods: number | null;
  grade_name: string;
  academic_year_name: string;
}

export interface FacultyWorkloadItem {
  staff_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string | null;
  employee_id: string | null;
  designation_name: string | null;
  department_name: string | null;
  weekly_periods: number;
  distinct_sections_count: number;
  distinct_subjects_count: number;
  primary_assignments_count: number;
  co_teacher_assignments_count: number;
  max_daily_periods: number;
  daily_breakdown: Record<string, number>;
  assigned_subjects: Array<{ subject_id: string; subject_name: string; subject_code: string }>;
  workload_status: 'LIGHT' | 'BALANCED' | 'HEAVY';
}

export interface TimetableOverview {
  total_timetables: number;
  published_timetables: number;
  draft_timetables: number;
  review_timetables: number;
  archived_timetables: number;
  total_scheduled_entries: number;
  total_sections_scheduled: number;
  total_sections_count: number;
  coverage_percentage: number;
  total_teachers_scheduled: number;
  total_classrooms_utilized: number;
}

export interface TimetableVersionItem {
  timetable_version_id: string;
  academic_year_id: string;
  academic_year_name: string;
  version_number: number;
  status: string;
  version_name: string | null;
  notes: string | null;
  published_at: string | null;
  total_entries?: number;
  sections_count?: number;
  teachers_count?: number;
  classrooms_count?: number;
}

export interface TimetableEntryDetail {
  timetable_entry_id: string;
  timetable_version_id: string;
  section_id: string;
  section_name: string;
  grade_name: string;
  grade_code: string;
  subject_id: string;
  subject_code: string;
  subject_name: string;
  staff_id: string;
  teacher_name: string;
  assignment_role: string;
  period_number: number;
  period_name: string;
  period_type: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  weekday: number;
  classroom_id: string | null;
  room_code: string | null;
  room_name: string | null;
  lesson_type: string;
  lesson_topic: string | null;
}

export interface ClassroomItem {
  classroom_id: string;
  room_code: string;
  room_name: string;
  room_type: string;
  building_name: string | null;
  floor_name: string | null;
  capacity: number | null;
  is_active: boolean;
}

export interface CalendarOverview {
  academic_calendar_id: string;
  academic_year_id: string;
  academic_year_name: string;
  start_date: string;
  end_date: string;
  status: string;
  version: number;
  published_at: string | null;
  working_days: number[];
  terms_count: number;
  entries_count: number;
}

export interface CalendarEntryItem {
  academic_calendar_entry_id: string;
  academic_calendar_id: string;
  academic_term_id: string | null;
  term_name: string | null;
  entry_name: string;
  entry_type: string;
  start_date: string;
  end_date: string;
  is_all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  description: string | null;
}

export interface AcademicTermItem {
  academic_term_id: string;
  academic_calendar_id: string;
  academic_year_id: string;
  academic_year_name: string;
  term_name: string;
  term_number: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface CurriculumOverview {
  active_academic_year: {
    academic_year_id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: string;
  } | null;
  grades: { total: number };
  subjects: { total: number; active: number; categories_count: number };
  curriculum: {
    total_plans: number;
    published_plans: number;
    in_review_plans: number;
    draft_plans: number;
    archived_plans: number;
    total_units: number;
    total_learning_outcomes: number;
  };
  calendar: {
    has_calendar: boolean;
    status: string | null;
    total_entries: number;
    total_holidays: number;
    upcoming_events_30_days: number;
  };
  terms: { total: number; active: number };
}

export interface CurriculumOutcomeItem {
  learning_outcome_id: string;
  curriculum_unit_id: string;
  outcome_code: string | null;
  outcome_statement: string;
  bloom_level: string | null;
  assessment_criteria: string | null;
  sequence_number: number;
}

export interface CurriculumUnitItem {
  curriculum_unit_id: string;
  curriculum_plan_id: string;
  unit_code: string | null;
  unit_title: string;
  unit_description: string | null;
  sequence_number: number;
  planned_duration_periods: number | null;
  planned_start_date: string | null;
  planned_end_date: string | null;
  outcomes?: CurriculumOutcomeItem[];
}

export interface CurriculumPlanItem {
  curriculum_plan_id: string;
  academic_year_grade_subject_id: string;
  version_number: number;
  plan_title: string;
  plan_description: string | null;
  status: string;
  coordinator_staff_id: string | null;
  coordinator_name: string | null;
  planned_start_date: string | null;
  planned_end_date: string | null;
  subject_id: string;
  subject_code: string;
  subject_name: string;
  grade_id: string;
  grade_code: string;
  grade_name: string;
  board: string | null;
  academic_year_id: string;
  academic_year_name: string;
  unit_count: number;
  units?: CurriculumUnitItem[];
}

export interface StructuredLessonPlan {
  lesson_title: string;
  estimated_duration_minutes: number;
  topic: string;
  grade: string;
  subject: string;
  curriculum_unit_title: string;
  prerequisite_knowledge: string;
  teaching_approach: string;
  learning_objectives: Array<{
    description: string;
    bloom_level: string;
    curriculum_alignment: string;
    is_official_outcome: boolean;
    assessment_method: string;
  }>;
  introduction?: {
    hook: string;
    previous_knowledge_connection: string;
    motivational_questions: string[];
  };
  lesson_activities?: Array<{
    sequence_number: number;
    activity_title: string;
    activity_type: string;
    duration_minutes: number;
    teacher_instructions: string;
    student_participation: string;
    materials_required: string;
    expected_result: string;
  }>;
  recommended_resources?: Array<{
    resource_id?: string | null;
    title: string;
    resource_type: string;
    recommendation_reason: string;
    usage_guidelines: string;
    is_existing_resource: boolean;
  }>;
  assessments?: {
    formative_questions: string[];
    exit_ticket?: {
      prompt: string;
      expected_criteria: string;
    };
    homework: string;
  };
  differentiated_instruction?: Array<{
    learner_group: string;
    strategy_description: string;
  }>;
  closure?: {
    summary: string;
    reflection_questions: string[];
    next_steps: string;
  };
}

export interface SavedLessonPlanSummary {
  lesson_plan_id: string;
  curriculum_unit_id: string;
  unit_title: string;
  curriculum_plan_id: string;
  plan_title: string;
  grade_name: string;
  subject_name: string;
  subject_code: string;
  teacher_name: string;
  lesson_title: string;
  lesson_summary: string | null;
  sequence_number: number;
  planned_date: string | null;
  duration_minutes: number | null;
  teaching_approach: string | null;
  is_active: boolean;
  activities_count: number;
  outcomes_count: number;
}

export interface LearningResourceItem {
  resource_id: string;
  title: string;
  description: string | null;
  resource_type: 'file' | 'external_link';
  file_name: string | null;
  file_size_bytes: string | number | null;
  mime_type: string | null;
  external_url: string | null;
  category_id: string | null;
  category_name?: string | null;
  resource_status: 'draft' | 'published' | 'archived';
  created_at: string;
  grades?: Array<{ grade_id: string; grade_name: string; grade_code: string }>;
}

export interface ResourceCategoryItem {
  category_id: string;
  category_name: string;
  category_code: string | null;
  description: string | null;
}

export interface ReadinessTenantYearItem {
  academic_year_id: string;
  academic_year_name: string;
  start_date: string;
  end_date: string;
  status: string;
  grade_offerings_count: number;
  sections_count: number;
  has_published_timetable: number;
  has_published_calendar: number;
}

export interface ValidationFinding {
  rule_code: string;
  category: string;
  severity: 'ERROR' | 'WARNING' | 'INFO' | 'UNSUPPORTED';
  title: string;
  description: string;
  entity_type: string;
  remediation_guidance: string;
  blocking: boolean;
  validation_status: 'PASSED' | 'FAILED' | 'WARNING' | 'UNSUPPORTED';
}

export interface AcademicYearReadinessReport {
  organization_id: string;
  academic_year_id: string;
  academic_year_name: string;
  academic_year_status: string;
  evaluated_at: string;
  overall_score: number;
  readiness_status: 'READY' | 'NEEDS_ATTENTION' | 'BLOCKED';
  publishing_eligibility: 'READY_TO_PUBLISH' | 'BLOCKED' | 'NEEDS_REVIEW' | 'UNSUPPORTED';
  summary: {
    total_checks: number;
    passed: number;
    failed: number;
    warnings: number;
    unsupported: number;
    categories_count: number;
    evaluated_categories: number;
  };
  categories: Array<{
    category: string;
    display_name: string;
    status: 'PASSED' | 'FAILED' | 'WARNING' | 'UNSUPPORTED';
    score: number;
    checks_count: number;
    passed_count: number;
    failed_count: number;
    warnings_count: number;
    unsupported_count: number;
    findings: ValidationFinding[];
  }>;
  blocking_errors: ValidationFinding[];
  warnings: ValidationFinding[];
  unsupported_checks: ValidationFinding[];
}

export interface ReadinessDependencyGraph {
  academic_year_id: string;
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    status: 'CONFIGURED' | 'PARTIAL' | 'MISSING' | 'UNSUPPORTED';
  }>;
  edges: Array<{
    from: string;
    to: string;
    relationship: string;
    verified: boolean;
  }>;
  summary: {
    total_nodes: number;
    total_edges: number;
    configured_nodes: number;
    missing_nodes: number;
  };
}

function unwrapData<T>(res: any): T {
  const payload = res?.data;
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
}

function unwrapList<T>(res: any): PaginatedResult<T> {
  const payload = res?.data;
  if (payload && typeof payload === 'object' && Array.isArray(payload.data)) {
    const meta = payload.meta || {
      page: 1,
      limit: payload.data.length || 20,
      total: payload.data.length,
      totalPages: 1,
    };
    return { items: payload.data as T[], meta };
  }
  if (Array.isArray(payload)) {
    return {
      items: payload as T[],
      meta: { page: 1, limit: payload.length || 20, total: payload.length, totalPages: 1 },
    };
  }
  return { items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } };
}

export function extractAcademicApiError(err: any, fallback = 'Request failed'): string {
  const data = err?.response?.data;
  return data?.error?.message || data?.message || err?.message || fallback;
}

export const AcademicManagementService = {
  // Overview & Dashboard
  async getOverview(): Promise<AcademicOverviewMetrics> {
    const res = await apiClient.get('/v1/academic/overview');
    return unwrapData<AcademicOverviewMetrics>(res);
  },

  async getDashboardMetrics(): Promise<AcademicDashboardMetrics> {
    const res = await apiClient.get('/v1/academic/dashboard');
    return unwrapData<AcademicDashboardMetrics>(res);
  },

  // Academic Years & Structure
  async listAcademicYears(params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<AcademicYearItem>> {
    const res = await apiClient.get('/v1/academic/years', { params });
    return unwrapList<AcademicYearItem>(res);
  },

  async createAcademicYear(payload: {
    academic_year_name: string;
    start_date: string;
    end_date: string;
    status?: string;
  }): Promise<AcademicYearItem> {
    const res = await apiClient.post('/v1/academic/years', payload);
    return unwrapData<AcademicYearItem>(res);
  },

  async updateAcademicYear(
    id: string,
    payload: Partial<{
      academic_year_name: string;
      start_date: string;
      end_date: string;
      status: string;
    }>,
  ): Promise<AcademicYearItem> {
    const res = await apiClient.patch(`/v1/academic/years/${id}`, payload);
    return unwrapData<AcademicYearItem>(res);
  },

  async setCurrentAcademicYear(id: string): Promise<AcademicYearItem> {
    const res = await apiClient.post(`/v1/academic/years/${id}/set-current`);
    return unwrapData<AcademicYearItem>(res);
  },

  async archiveAcademicYear(id: string): Promise<AcademicYearItem> {
    const res = await apiClient.post(`/v1/academic/years/${id}/archive`);
    return unwrapData<AcademicYearItem>(res);
  },

  async getStructureTree(academicYearId: string): Promise<AcademicStructureTree> {
    const res = await apiClient.get(`/v1/academic/years/${academicYearId}/structure`);
    return unwrapData<AcademicStructureTree>(res);
  },

  // Boards
  async getBoardsOverview(): Promise<BoardOverview> {
    const res = await apiClient.get('/v1/academic/boards');
    return unwrapData<BoardOverview>(res);
  },

  async updateBoardAffiliation(boardAffiliation: string | null): Promise<any> {
    const res = await apiClient.patch('/v1/academic/boards/affiliation', {
      board_affiliation: boardAffiliation,
    });
    return unwrapData(res);
  },

  // Grades & Year-Grade Offerings & Sections
  async listGrades(params?: {
    search?: string;
    board?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<GradeItem>> {
    const res = await apiClient.get('/v1/academic/grades', { params });
    return unwrapList<GradeItem>(res);
  },

  async createGrade(payload: {
    grade_code: string;
    grade_name: string;
    board?: string | null;
    display_order?: number;
    is_active?: boolean;
  }): Promise<GradeItem> {
    const res = await apiClient.post('/v1/academic/grades', payload);
    return unwrapData<GradeItem>(res);
  },

  async updateGrade(
    id: string,
    payload: Partial<{
      grade_code: string;
      grade_name: string;
      board: string | null;
      display_order: number;
      is_active: boolean;
    }>,
  ): Promise<GradeItem> {
    const res = await apiClient.patch(`/v1/academic/grades/${id}`, payload);
    return unwrapData<GradeItem>(res);
  },

  async listYearGrades(academicYearId: string): Promise<AcademicYearGradeItem[]> {
    const res = await apiClient.get(`/v1/academic/years/${academicYearId}/grades`);
    return unwrapList<AcademicYearGradeItem>(res).items;
  },

  async createYearGrade(
    academicYearId: string,
    payload: { grade_id: string; intake_capacity?: number | null; is_active?: boolean },
  ): Promise<AcademicYearGradeItem> {
    const res = await apiClient.post(`/v1/academic/years/${academicYearId}/grades`, payload);
    return unwrapData<AcademicYearGradeItem>(res);
  },

  async updateYearGrade(
    id: string,
    payload: { intake_capacity?: number | null; is_active?: boolean },
  ): Promise<AcademicYearGradeItem> {
    const res = await apiClient.patch(`/v1/academic/year-grades/${id}`, payload);
    return unwrapData<AcademicYearGradeItem>(res);
  },

  async deleteYearGrade(id: string): Promise<void> {
    await apiClient.delete(`/v1/academic/year-grades/${id}`);
  },

  async listSections(params?: {
    academic_year_id?: string;
    academic_year_grade_id?: string;
    grade_id?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<SectionItem>> {
    const res = await apiClient.get('/v1/academic/sections', { params });
    return unwrapList<SectionItem>(res);
  },

  async createSection(payload: {
    academic_year_grade_id: string;
    section_name: string;
    room_no?: string | null;
    capacity?: number | null;
    class_teacher_id?: string | null;
  }): Promise<SectionItem> {
    const res = await apiClient.post('/v1/academic/sections', payload);
    return unwrapData<SectionItem>(res);
  },

  async updateSection(
    id: string,
    payload: Partial<{
      section_name: string;
      room_no: string | null;
      capacity: number | null;
      is_active: boolean;
    }>,
  ): Promise<SectionItem> {
    const res = await apiClient.patch(`/v1/academic/sections/${id}`, payload);
    return unwrapData<SectionItem>(res);
  },

  async deleteSection(id: string): Promise<void> {
    await apiClient.delete(`/v1/academic/sections/${id}`);
  },

  async assignClassTeacher(sectionId: string, staffId: string | null): Promise<SectionItem> {
    const res = await apiClient.patch(`/v1/academic/sections/${sectionId}/class-teacher`, {
      staff_id: staffId,
    });
    return unwrapData<SectionItem>(res);
  },

  async listClassesDropdown(academicYearId?: string): Promise<any[]> {
    const res = await apiClient.get('/v1/academic/classes', {
      params: academicYearId ? { academic_year_id: academicYearId } : undefined,
    });
    const data = unwrapData<any>(res);
    return Array.isArray(data) ? data : [];
  },

  async listStaffDirectory(): Promise<any[]> {
    const res = await apiClient.get('/v1/staff', { params: { limit: 100 } });
    const data = unwrapData<any>(res);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  },

  // Subjects & Catalog
  async listSubjects(params?: {
    search?: string;
    category_id?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<SubjectItem>> {
    const res = await apiClient.get('/v1/academic/subjects', { params });
    return unwrapList<SubjectItem>(res);
  },

  async listSubjectCategories(): Promise<SubjectCategoryItem[]> {
    const res = await apiClient.get('/v1/academic/subjects/categories');
    const data = unwrapData<SubjectCategoryItem[]>(res);
    return Array.isArray(data) ? data : [];
  },

  async getSubjectById(id: string): Promise<SubjectItem> {
    const res = await apiClient.get(`/v1/academic/subjects/${id}`);
    return unwrapData<SubjectItem>(res);
  },

  async getSubjectResources(id: string): Promise<LearningResourceItem[]> {
    const res = await apiClient.get(`/v1/academic/subjects/${id}/resources`);
    const data = unwrapData<LearningResourceItem[]>(res);
    return Array.isArray(data) ? data : [];
  },

  async getClassSubjects(
    gradeId: string,
    academicYearId?: string,
  ): Promise<GradeSubjectOfferingItem[]> {
    const res = await apiClient.get(`/v1/academic/classes/${gradeId}/subjects`, {
      params: academicYearId ? { academic_year_id: academicYearId } : undefined,
    });
    const data = unwrapData<GradeSubjectOfferingItem[]>(res);
    return Array.isArray(data) ? data : [];
  },

  // Faculty Workload
  async listFacultyWorkload(params?: {
    search?: string;
    academic_year_id?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<FacultyWorkloadItem>> {
    const res = await apiClient.get('/v1/academic/faculty-workload', { params });
    return unwrapList<FacultyWorkloadItem>(res);
  },

  async getFacultyWorkloadDetail(staffId: string, academicYearId?: string): Promise<any> {
    const res = await apiClient.get(`/v1/academic/faculty-workload/${staffId}`, {
      params: academicYearId ? { academic_year_id: academicYearId } : undefined,
    });
    return unwrapData(res);
  },

  // Timetable Master
  async getTimetableOverview(): Promise<TimetableOverview> {
    const res = await apiClient.get('/v1/academic/timetables/overview');
    return unwrapData<TimetableOverview>(res);
  },

  async listTimetables(params?: {
    academic_year_id?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<TimetableVersionItem>> {
    const res = await apiClient.get('/v1/academic/timetables', { params });
    return unwrapList<TimetableVersionItem>(res);
  },

  async getTimetableConflicts(versionId: string): Promise<any> {
    const res = await apiClient.get(`/v1/academic/timetables/${versionId}/conflicts`);
    return unwrapData(res);
  },

  async getSectionTimetable(
    sectionId: string,
    versionId?: string,
  ): Promise<{
    section_id: string;
    timetable_version_id: string | null;
    total_entries: number;
    schedule_by_day: Record<number, TimetableEntryDetail[]>;
  }> {
    const res = await apiClient.get(`/v1/academic/sections/${sectionId}/timetable`, {
      params: versionId ? { timetable_version_id: versionId } : undefined,
    });
    return unwrapData(res);
  },

  async getTeacherTimetable(staffId: string, versionId?: string): Promise<any> {
    const res = await apiClient.get(`/v1/academic/teachers/${staffId}/timetable`, {
      params: versionId ? { timetable_version_id: versionId } : undefined,
    });
    return unwrapData(res);
  },

  async listClassrooms(params?: {
    search?: string;
    room_type?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<ClassroomItem>> {
    const res = await apiClient.get('/v1/academic/classrooms', { params });
    return unwrapList<ClassroomItem>(res);
  },

  async getClassroomSchedule(
    classroomId: string,
    versionId?: string,
  ): Promise<TimetableEntryDetail[]> {
    const res = await apiClient.get(`/v1/academic/classrooms/${classroomId}/schedule`, {
      params: versionId ? { timetable_version_id: versionId } : undefined,
    });
    const data = unwrapData<TimetableEntryDetail[]>(res);
    return Array.isArray(data) ? data : [];
  },

  // Calendar & Terms
  async getCalendarOverview(academicYearId?: string): Promise<CalendarOverview | null> {
    const res = await apiClient.get('/v1/academic/calendar', {
      params: academicYearId ? { academic_year_id: academicYearId } : undefined,
    });
    return unwrapData<CalendarOverview | null>(res);
  },

  async listCalendarEvents(params?: {
    academic_year_id?: string;
    entry_type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<CalendarEntryItem>> {
    const res = await apiClient.get('/v1/academic/calendar/events', { params });
    return unwrapList<CalendarEntryItem>(res);
  },

  async listTerms(params?: {
    academic_year_id?: string;
    is_active?: boolean;
  }): Promise<AcademicTermItem[]> {
    const res = await apiClient.get('/v1/academic/terms', { params });
    const data = unwrapData<AcademicTermItem[]>(res);
    return Array.isArray(data) ? data : [];
  },

  // Curriculum & Syllabus
  async getCurriculumOverview(): Promise<CurriculumOverview> {
    const res = await apiClient.get('/v1/academic/curriculum/overview');
    return unwrapData<CurriculumOverview>(res);
  },

  async listCurriculum(params?: {
    academic_year_id?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<CurriculumPlanItem>> {
    const res = await apiClient.get('/v1/academic/curriculum', { params });
    return unwrapList<CurriculumPlanItem>(res);
  },

  async getCurriculumDetail(
    id: string,
  ): Promise<CurriculumPlanItem & { units: CurriculumUnitItem[] }> {
    const res = await apiClient.get(`/v1/academic/curriculum/${id}`);
    return unwrapData(res);
  },

  async updateCurriculumStatus(id: string, status: string): Promise<CurriculumPlanItem> {
    const res = await apiClient.patch(`/v1/academic/curriculum/${id}/status`, { status });
    return unwrapData<CurriculumPlanItem>(res);
  },

  async updateCurriculumPlan(
    id: string,
    payload: Partial<{
      plan_title: string;
      plan_description: string | null;
      planned_start_date: string | null;
      planned_end_date: string | null;
    }>,
  ): Promise<CurriculumPlanItem> {
    const res = await apiClient.patch(`/v1/academic/curriculum/${id}`, payload);
    return unwrapData<CurriculumPlanItem>(res);
  },

  async getSyllabusCoverage(id: string): Promise<any> {
    const res = await apiClient.get(`/v1/academic/syllabus/${id}/coverage`);
    return unwrapData(res);
  },

  // AI Lesson Planning
  async getLessonPlanningCurriculum(params: {
    grade_id: string;
    subject_id: string;
    academic_year_id?: string;
  }): Promise<any[]> {
    const res = await apiClient.get('/v1/academic/lesson-planning/curriculum', { params });
    const data = unwrapData<any[]>(res);
    return Array.isArray(data) ? data : [];
  },

  async getLessonPlanningUnits(curriculumPlanId: string): Promise<CurriculumUnitItem[]> {
    const res = await apiClient.get('/v1/academic/lesson-planning/units', {
      params: { curriculum_plan_id: curriculumPlanId },
    });
    const data = unwrapData<CurriculumUnitItem[]>(res);
    return Array.isArray(data) ? data : [];
  },

  async getLessonPlanningOutcomes(curriculumUnitId: string): Promise<CurriculumOutcomeItem[]> {
    const res = await apiClient.get('/v1/academic/lesson-planning/outcomes', {
      params: { curriculum_unit_id: curriculumUnitId },
    });
    const data = unwrapData<CurriculumOutcomeItem[]>(res);
    return Array.isArray(data) ? data : [];
  },

  async listSavedLessonPlans(params?: {
    grade_id?: string;
    subject_id?: string;
    academic_year_id?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<SavedLessonPlanSummary>> {
    const res = await apiClient.get('/v1/academic/lesson-planning/plans', { params });
    return unwrapList<SavedLessonPlanSummary>(res);
  },

  async getSavedLessonPlanById(id: string): Promise<any> {
    const res = await apiClient.get(`/v1/academic/lesson-planning/plans/${id}`);
    return unwrapData(res);
  },

  async generateLessonPlan(payload: {
    academic_year_id: string;
    grade_id: string;
    subject_id: string;
    curriculum_plan_id?: string;
    curriculum_unit_id: string;
    focal_outcome_ids?: string[];
    topic: string;
    duration_minutes?: number;
    preferred_methodology?: string;
    difficulty_level?: 'standard' | 'introductory' | 'advanced';
  }): Promise<any> {
    const res = await apiClient.post('/v1/academic/lesson-planning/generate', payload);
    return unwrapData(res);
  },

  async refineLessonPlan(payload: {
    current_plan: StructuredLessonPlan;
    refinement_instructions: string;
    target_duration_minutes?: number;
  }): Promise<any> {
    const res = await apiClient.post('/v1/academic/lesson-planning/refine', payload);
    return unwrapData(res);
  },

  async validateLessonPlan(payload: {
    plan: StructuredLessonPlan;
    curriculum_unit_id?: string;
  }): Promise<any> {
    const res = await apiClient.post('/v1/academic/lesson-planning/validate', payload);
    return unwrapData(res);
  },

  // Digital Resource Library
  async listResources(params?: {
    search?: string;
    category_id?: string;
    grade_id?: string;
    resource_type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<LearningResourceItem>> {
    const res = await apiClient.get('/v1/academic/resources', { params });
    return unwrapList<LearningResourceItem>(res);
  },

  async listResourceCategories(): Promise<ResourceCategoryItem[]> {
    const res = await apiClient.get('/v1/academic/resources/categories');
    const data = unwrapData<ResourceCategoryItem[]>(res);
    return Array.isArray(data) ? data : [];
  },

  async createResource(formData: FormData): Promise<LearningResourceItem> {
    const res = await apiClient.post('/v1/academic/resources', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrapData<LearningResourceItem>(res);
  },

  async createExternalResource(payload: {
    title: string;
    description?: string | null;
    resource_type: 'external_link';
    external_url: string;
    category_id?: string | null;
    resource_status?: 'draft' | 'published';
    grade_ids?: string[];
  }): Promise<LearningResourceItem> {
    const res = await apiClient.post('/v1/academic/resources', payload);
    return unwrapData<LearningResourceItem>(res);
  },

  async updateResource(
    id: string,
    payload: Partial<{
      title: string;
      description: string | null;
      resource_status: 'draft' | 'published' | 'archived';
    }>,
  ): Promise<LearningResourceItem> {
    const res = await apiClient.patch(`/v1/academic/resources/${id}`, payload);
    return unwrapData<LearningResourceItem>(res);
  },

  async archiveResource(id: string): Promise<LearningResourceItem> {
    const res = await apiClient.post(`/v1/academic/resources/${id}/archive`);
    return unwrapData<LearningResourceItem>(res);
  },

  async deleteResource(id: string): Promise<void> {
    await apiClient.delete(`/v1/academic/resources/${id}`);
  },

  async getResourcePreview(id: string): Promise<any> {
    const res = await apiClient.get(`/v1/academic/resources/${id}/preview`);
    return unwrapData(res);
  },

  async getResourceDownload(id: string): Promise<any> {
    const res = await apiClient.get(`/v1/academic/resources/${id}/download`);
    return unwrapData(res);
  },

  // Readiness & Publishing
  async getReadinessOverview(): Promise<ReadinessTenantYearItem[]> {
    const res = await apiClient.get('/v1/academic/readiness/overview');
    const data = unwrapData<ReadinessTenantYearItem[]>(res);
    return Array.isArray(data) ? data : [];
  },

  async getYearReadiness(academicYearId: string): Promise<AcademicYearReadinessReport> {
    const res = await apiClient.get(`/v1/academic/readiness/${academicYearId}`);
    return unwrapData<AcademicYearReadinessReport>(res);
  },

  async runReadinessValidation(academicYearId: string): Promise<AcademicYearReadinessReport> {
    const res = await apiClient.post(`/v1/academic/readiness/${academicYearId}/validate`);
    return unwrapData<AcademicYearReadinessReport>(res);
  },

  async getReadinessDependencies(academicYearId: string): Promise<ReadinessDependencyGraph> {
    const res = await apiClient.get(`/v1/academic/readiness/${academicYearId}/dependencies`);
    return unwrapData<ReadinessDependencyGraph>(res);
  },
};
