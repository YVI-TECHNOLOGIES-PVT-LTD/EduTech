import { ReceivablesRepository, ReceivablesFilter, CollectionPerformanceFilter, FollowUpQueueFilter } from '../repositories/ReceivablesRepository';
import { toSafeUuid } from './FeeStructureManagerService';

const safeId = (val?: string): string | undefined => {
  const s = toSafeUuid(val);
  return s || undefined;
};

export class ReceivablesService {
  /**
   * Retrieves high-level KPI summary for the Receivables Command Center.
   * Scoped strictly to the tenant organization.
   */
  public static async getSummary(orgId: string, academicYearId?: string) {
    if (!orgId) {
      throw new Error('Tenant organization ID is required');
    }
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeYearId = safeId(academicYearId);

    return ReceivablesRepository.getReceivablesSummary(safeOrgId, safeYearId);
  }

  /**
   * Retrieves paginated receivables register with search, filter, and sorting.
   */
  public static async getRegister(orgId: string, filter: ReceivablesFilter = {}) {
    if (!orgId) {
      throw new Error('Tenant organization ID is required');
    }
    const safeOrgId = toSafeUuid(orgId) || orgId;

    // Validate and sanitize pagination
    const sanitizedFilter: ReceivablesFilter = {
      ...filter,
      page: Math.max(1, Number(filter.page) || 1),
      limit: Math.min(100, Math.max(1, Number(filter.limit) || 20)),
      academicYearId: safeId(filter.academicYearId),
      gradeId: safeId(filter.gradeId),
      sectionId: safeId(filter.sectionId),
      feeComponentId: safeId(filter.feeComponentId),
      installmentTermId: safeId(filter.installmentTermId),
    };

    return ReceivablesRepository.getReceivablesRegister(safeOrgId, sanitizedFilter);
  }

  /**
   * Retrieves overdue ageing analysis in 6 standard buckets:
   * Current (Not Yet Due), 1-7 days, 8-30 days, 31-60 days, 61-90 days, >90 days.
   */
  public static async getAgeing(orgId: string, academicYearId?: string) {
    if (!orgId) {
      throw new Error('Tenant organization ID is required');
    }
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeYearId = safeId(academicYearId);

    return ReceivablesRepository.getAgeingAnalysis(safeOrgId, safeYearId);
  }

  /**
   * Retrieves collection performance metrics for a specified reporting period.
   */
  public static async getCollections(orgId: string, filter: CollectionPerformanceFilter = {}) {
    if (!orgId) {
      throw new Error('Tenant organization ID is required');
    }
    const safeOrgId = toSafeUuid(orgId) || orgId;

    const validPeriods = ['today', 'this_week', 'this_month', 'this_academic_year', 'custom'];
    const period = filter.period && validPeriods.includes(filter.period) ? filter.period : 'this_month';

    const sanitizedFilter: CollectionPerformanceFilter = {
      ...filter,
      period: period as any,
      academicYearId: safeId(filter.academicYearId),
      gradeId: safeId(filter.gradeId),
    };

    return ReceivablesRepository.getCollectionPerformance(safeOrgId, sanitizedFilter);
  }

  /**
   * Retrieves comprehensive receivables and ledger details for a specific student.
   */
  public static async getStudentDetail(orgId: string, studentId: string) {
    if (!orgId) {
      throw new Error('Tenant organization ID is required');
    }
    if (!studentId) {
      throw new Error('Student ID is required');
    }

    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeStudentId = toSafeUuid(studentId);

    if (!safeStudentId) {
      const err: any = new Error('Invalid student identifier format');
      err.statusCode = 400;
      throw err;
    }

    const detail = await ReceivablesRepository.getStudentReceivableDetail(safeOrgId, safeStudentId);
    if (!detail) {
      const err: any = new Error('Student receivables record not found within authorized organization');
      err.statusCode = 404;
      throw err;
    }

    return detail;
  }

  /**
   * Retrieves the collections follow-up prioritization queue.
   */
  public static async getFollowUpQueue(orgId: string, filter: FollowUpQueueFilter = {}) {
    if (!orgId) {
      throw new Error('Tenant organization ID is required');
    }
    const safeOrgId = toSafeUuid(orgId) || orgId;

    const sanitizedFilter: FollowUpQueueFilter = {
      ...filter,
      page: Math.max(1, Number(filter.page) || 1),
      limit: Math.min(100, Math.max(1, Number(filter.limit) || 20)),
      academicYearId: safeId(filter.academicYearId),
      gradeId: safeId(filter.gradeId),
    };

    return ReceivablesRepository.getFollowUpQueue(safeOrgId, sanitizedFilter);
  }

  /**
   * Records follow-up action.
   * Under the frozen database constraint, physical follow-up storage table does not exist in schema.prisma.
   * Returns an explicit blocked status adhering to project constraint 1.1:
   * "If no safe alternative exists, report that feature as blocked. Do not simulate durable functionality."
   */
  public static async recordFollowUp(
    orgId: string,
    userId: string,
    payload: {
      studentId: string;
      actionType: 'phone_call' | 'meeting' | 'email' | 'note';
      notes?: string;
      nextFollowUpDate?: string;
    }
  ) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    if (!userId) throw new Error('User ID is required');

    const err: any = new Error(
      'Follow-up recording is currently blocked by database schema freeze (table `fee_collections_follow_ups` is unmapped). Simulation/in-memory persistence is prohibited.'
    );
    err.statusCode = 501;
    err.code = 'FEATURE_BLOCKED_SCHEMA_FREEZE';
    throw err;
  }

  /**
   * Generates structured export reports for receivables and collections.
   */
  public static async getReports(
    orgId: string,
    reportType: 'outstanding_by_grade' | 'outstanding_by_component' | 'ageing_summary' | 'collections_period',
    filter: any = {}
  ) {
    if (!orgId) {
      throw new Error('Tenant organization ID is required');
    }
    const safeOrgId = toSafeUuid(orgId) || orgId;

    return ReceivablesRepository.getReceivablesReport(safeOrgId, reportType, filter);
  }
}
