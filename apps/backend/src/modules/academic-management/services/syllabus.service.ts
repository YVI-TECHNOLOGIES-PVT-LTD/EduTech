import {
  CurriculumRepository,
  CurriculumPlanRecord,
  CurriculumUnitRecord,
} from '../repositories/curriculum.repository';
import {
  ListCurriculumInput,
  ListCurriculumRawInput,
  listCurriculumSchema,
} from '../dto/request/curriculum.dto';
import { AcademicError } from '../errors/academic.errors';

export class SyllabusService {
  /**
   * List syllabus records (curriculum plans with subject and grade offerings)
   */
  static async listSyllabus(
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
   * Get full syllabus hierarchical structure (units, sequence, duration, learning outcomes, Bloom level)
   */
  static async getSyllabusDetails(
    orgId: string,
    planId: string,
  ): Promise<CurriculumPlanRecord & { units: CurriculumUnitRecord[] }> {
    const syllabus = await CurriculumRepository.findWithStructure(orgId, planId);
    if (!syllabus) {
      throw new AcademicError(
        `Syllabus with ID '${planId}' was not found`,
        404,
        'SYLLABUS_NOT_FOUND',
      );
    }
    return syllabus;
  }

  /**
   * Derives read-only syllabus coverage progression from persisted unit dates and periods
   */
  static async getSyllabusCoverage(orgId: string, planId: string): Promise<any> {
    const syllabus = await this.getSyllabusDetails(orgId, planId);
    const now = new Date();

    const units = syllabus.units || [];
    const totalUnits = units.length;
    let totalPlannedPeriods = 0;
    let completedUnitsByDate = 0;
    let inProgressUnitsByDate = 0;

    for (const unit of units) {
      if (unit.planned_duration_periods) {
        totalPlannedPeriods += unit.planned_duration_periods;
      }

      if (unit.planned_end_date && new Date(unit.planned_end_date) < now) {
        completedUnitsByDate += 1;
      } else if (
        unit.planned_start_date &&
        new Date(unit.planned_start_date) <= now &&
        unit.planned_end_date &&
        new Date(unit.planned_end_date) >= now
      ) {
        inProgressUnitsByDate += 1;
      }
    }

    const scheduledCoveragePercent =
      totalUnits > 0 ? Math.round((completedUnitsByDate / totalUnits) * 100) : 0;

    return {
      syllabus_id: syllabus.curriculum_plan_id,
      plan_title: syllabus.plan_title,
      subject_name: syllabus.subject_name,
      grade_name: syllabus.grade_name,
      total_units: totalUnits,
      total_planned_periods: totalPlannedPeriods,
      planned_start_date: syllabus.planned_start_date,
      planned_end_date: syllabus.planned_end_date,
      schedule_progression: {
        completed_units_by_schedule: completedUnitsByDate,
        in_progress_units_by_schedule: inProgressUnitsByDate,
        pending_units: totalUnits - completedUnitsByDate - inProgressUnitsByDate,
        estimated_schedule_coverage_percent: scheduledCoveragePercent,
      },
      write_tracking_status: 'UNSUPPORTED_BY_STAGE_1_PERSISTENCE',
    };
  }

  /**
   * Explicit 501 handler for write-based coverage logging
   */
  static handleCoverageLogUnsupported(): never {
    throw new AcademicError(
      'Write-based syllabus coverage logging is unsupported: requires dedicated progress tracking persistence in Stage-2 finalization.',
      501,
      'FEATURE_NOT_IMPLEMENTED',
    );
  }
}
