import {
  CurriculumRepository,
  CurriculumPlanRecord,
  CurriculumUnitRecord,
} from '../repositories/curriculum.repository';
import { SubjectRepository } from '../repositories/subject.repository';
import { AcademicCalendarRepository } from '../repositories/academic-calendar.repository';
import { AcademicTermRepository } from '../repositories/academic-term.repository';
import { AcademicYearRepository } from '../repositories/academic-year.repository';
import { GradeRepository } from '../repositories/grade.repository';
import {
  ListCurriculumInput,
  ListCurriculumRawInput,
  UpdateCurriculumStatusInput,
  UpdateCurriculumStatusRawInput,
  UpdateCurriculumPlanInput,
  UpdateCurriculumPlanRawInput,
  listCurriculumSchema,
  updateCurriculumStatusSchema,
  updateCurriculumPlanSchema,
} from '../dto/request/curriculum.dto';
import { AcademicError } from '../errors/academic.errors';

export class CurriculumService {
  /**
   * List paginated curriculum plans with filtering and sorting
   */
  static async listCurriculum(
    orgId: string,
    rawParams: ListCurriculumRawInput,
  ): Promise<{
    items: CurriculumPlanRecord[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const params = listCurriculumSchema.parse(rawParams);
    const { items, total } = await CurriculumRepository.findMany(orgId, params);
    const page = params.page || 1;
    const limit = params.limit || 20;

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieve single curriculum plan by ID
   */
  static async getCurriculumById(orgId: string, planId: string): Promise<CurriculumPlanRecord> {
    const plan = await CurriculumRepository.findById(orgId, planId);
    if (!plan) {
      throw new AcademicError(
        `Curriculum plan with ID '${planId}' was not found`,
        404,
        'CURRICULUM_NOT_FOUND',
      );
    }
    return plan;
  }

  /**
   * Retrieve full hierarchical curriculum plan with units and learning outcomes
   */
  static async getCurriculumStructure(
    orgId: string,
    planId: string,
  ): Promise<CurriculumPlanRecord & { units: CurriculumUnitRecord[] }> {
    const plan = await CurriculumRepository.findWithStructure(orgId, planId);
    if (!plan) {
      throw new AcademicError(
        `Curriculum plan with ID '${planId}' was not found`,
        404,
        'CURRICULUM_NOT_FOUND',
      );
    }
    return plan;
  }

  /**
   * Transition curriculum plan status
   */
  static async updateStatus(
    orgId: string,
    planId: string,
    rawInput: UpdateCurriculumStatusRawInput,
    actorId: string | null,
  ): Promise<CurriculumPlanRecord> {
    const input = updateCurriculumStatusSchema.parse(rawInput);
    const plan = await this.getCurriculumById(orgId, planId);

    // Business-level status transition validation matching PostgreSQL trigger rules
    if (plan.status === 'archived') {
      throw new AcademicError(
        'Archived curriculum plan versions are immutable',
        400,
        'IMMUTABLE_ARCHIVED_PLAN',
      );
    }

    if (plan.status === 'published' && input.status !== 'archived') {
      throw new AcademicError(
        'Published curriculum plans may only transition to archived',
        400,
        'INVALID_STATUS_TRANSITION',
      );
    }

    if (plan.status === 'approved' && !['published', 'archived'].includes(input.status)) {
      throw new AcademicError(
        'Approved curriculum plans may only transition to published or archived',
        400,
        'INVALID_STATUS_TRANSITION',
      );
    }

    if (plan.status === 'review' && !['review', 'draft', 'approved'].includes(input.status)) {
      throw new AcademicError(
        'A plan in review may only remain in review, return to draft, or be approved',
        400,
        'INVALID_STATUS_TRANSITION',
      );
    }

    if (plan.status === 'draft' && !['draft', 'review'].includes(input.status)) {
      throw new AcademicError(
        'A draft curriculum plan must enter review before approval',
        400,
        'INVALID_STATUS_TRANSITION',
      );
    }

    try {
      return await CurriculumRepository.updateStatus(orgId, planId, input.status, actorId);
    } catch (err: any) {
      throw new AcademicError(
        err.message || 'Failed to update curriculum plan status',
        400,
        'STATUS_TRANSITION_FAILED',
      );
    }
  }

  /**
   * Update plan metadata (only allowed in draft status)
   */
  static async updatePlan(
    orgId: string,
    planId: string,
    rawInput: UpdateCurriculumPlanRawInput,
    actorId: string | null,
  ): Promise<CurriculumPlanRecord> {
    const input = updateCurriculumPlanSchema.parse(rawInput);
    const plan = await this.getCurriculumById(orgId, planId);

    if (plan.status !== 'draft') {
      throw new AcademicError(
        'Curriculum plan content is immutable outside draft status',
        400,
        'PLAN_CONTENT_LOCKED',
      );
    }

    try {
      return await CurriculumRepository.updatePlan(orgId, planId, input, actorId);
    } catch (err: any) {
      throw new AcademicError(
        err.message || 'Failed to update curriculum plan',
        400,
        'UPDATE_FAILED',
      );
    }
  }

  /**
   * Consolidated academic overview metrics combining curriculum, subjects, calendar, and terms
   */
  static async getCurriculumOverview(orgId: string): Promise<any> {
    const [activeYear, curriculumMetrics, subjectMetrics, calendarMetrics, termMetrics, gradeList] =
      await Promise.all([
        AcademicYearRepository.findCurrent(orgId),
        CurriculumRepository.getOverviewMetrics(orgId),
        SubjectRepository.getMetrics(orgId),
        AcademicCalendarRepository.getMetrics(orgId),
        AcademicTermRepository.getMetrics(orgId),
        GradeRepository.findAll(orgId),
      ]);

    return {
      active_academic_year: activeYear
        ? {
            academic_year_id: activeYear.academic_year_id,
            name: activeYear.academic_year_name,
            start_date: activeYear.start_date,
            end_date: activeYear.end_date,
            status: activeYear.status,
          }
        : null,
      grades: {
        total: gradeList.total,
      },
      subjects: {
        total: subjectMetrics.total_subjects,
        active: subjectMetrics.active_subjects,
        categories_count: subjectMetrics.total_categories,
      },
      curriculum: {
        total_plans: curriculumMetrics.total_plans,
        published_plans: curriculumMetrics.published_plans,
        in_review_plans: curriculumMetrics.in_review_plans,
        draft_plans: curriculumMetrics.draft_plans,
        archived_plans: curriculumMetrics.archived_plans,
        total_units: curriculumMetrics.total_units,
        total_learning_outcomes: curriculumMetrics.total_learning_outcomes,
      },
      calendar: {
        has_calendar: calendarMetrics.has_calendar,
        status: calendarMetrics.calendar_status,
        total_entries: calendarMetrics.total_entries,
        total_holidays: calendarMetrics.total_holidays,
        upcoming_events_30_days: calendarMetrics.upcoming_events_30_days,
      },
      terms: {
        total: termMetrics.total_terms,
        active: termMetrics.active_terms,
      },
    };
  }
}
