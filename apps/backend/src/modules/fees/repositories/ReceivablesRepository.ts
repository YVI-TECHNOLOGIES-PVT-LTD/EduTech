import { Prisma } from '@prisma/client';
import prisma from '../../../lib/prismaClient';
import { toSafeUuid } from '../services/FeeStructureManagerService';

export interface ReceivablesFilter {
  academicYearId?: string;
  gradeId?: string;
  sectionId?: string;
  feeComponentId?: string;
  installmentTermId?: string;
  status?: string; // 'all', 'overdue', 'pending', 'partially_paid', 'paid', 'waived'
  ageingBucket?: string; // 'all', 'CURRENT', 'OVERDUE_1_7', 'OVERDUE_8_30', 'OVERDUE_31_60', 'OVERDUE_61_90', 'OVERDUE_90_PLUS'
  dueDateFrom?: string;
  dueDateTo?: string;
  minOutstanding?: number;
  maxOutstanding?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CollectionPerformanceFilter {
  period?: 'today' | 'this_week' | 'this_month' | 'this_academic_year' | 'custom';
  startDate?: string;
  endDate?: string;
  academicYearId?: string;
  gradeId?: string;
}

export interface FollowUpQueueFilter {
  grouping?: 'all' | 'newly_overdue' | 'high_outstanding' | 'long_overdue' | 'due_soon';
  academicYearId?: string;
  gradeId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'days_overdue' | 'outstanding_amount' | 'due_date' | 'student_name' | 'grade';
  sortOrder?: 'asc' | 'desc';
}

export class ReceivablesRepository {
  private static getClient(client?: any) {
    return client || prisma;
  }

  private static roundMoney(val: number | string | Prisma.Decimal | null | undefined): number {
    if (val === null || val === undefined) return 0;
    const num = typeof val === 'number' ? val : Number(val.toString());
    if (isNaN(num)) return 0;
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  // =========================================================================
  // 1. RECEIVABLES & COLLECTIONS OVERVIEW SUMMARY (Screen A)
  // =========================================================================

  /**
   * Retrieves high-level KPI metrics derived from physical ledger dues and confirmed transactions.
   * Scoped strictly to the tenant organization (org_id).
   */
  public static async getReceivablesSummary(
    orgId: string,
    academicYearId?: string,
    client?: any
  ): Promise<{
    totalOutstanding: number;
    totalOverdue: number;
    dueInNext7Days: number;
    dueInNext30Days: number;
    collectedThisMonth: number;
    collectionRate: number;
    studentsWithOutstanding: number;
    overdueAccountsCount: number;
    totalAssessedDues: number;
    totalAllocatedPaid: number;
    currencyCode: string;
  }> {
    const db = this.getClient(client);
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeYearId = toSafeUuid(academicYearId);

    // 1. Calculate outstanding, overdue, upcoming dues directly from student_charge_dues
    // Joined with student_charges and students to enforce strict org_id tenancy
    let duesSql = `
      WITH allocated_per_due AS (
        SELECT
          pa.student_charge_due_id,
          COALESCE(SUM(pa.allocated_amount), 0)::numeric as total_allocated
        FROM payment_allocations pa
        JOIN payment_transactions pt ON pa.payment_transaction_id = pt.payment_transaction_id
        WHERE pt.status = 'success'::payment_transaction_status
        GROUP BY pa.student_charge_due_id
      ),
      dues_calculated AS (
        SELECT
          scd.student_charge_due_id,
          sc.student_id,
          scd.amount_due::numeric as amount_due,
          COALESCE(apd.total_allocated, 0) as allocated_amount,
          GREATEST(0, scd.amount_due::numeric - COALESCE(apd.total_allocated, 0)) as outstanding_amount,
          scd.due_date,
          scd.status as due_status,
          sc.status as charge_status,
          sc.currency_code
        FROM student_charge_dues scd
        JOIN student_charges sc ON scd.student_charge_id = sc.student_charge_id
        JOIN students s ON sc.student_id = s.student_id
        LEFT JOIN allocated_per_due apd ON scd.student_charge_due_id = apd.student_charge_due_id
        LEFT JOIN LATERAL (
          SELECT se.academic_year_grade_id
          FROM student_enrollments se
          WHERE se.student_id = s.student_id AND se.status = 'active'
          ORDER BY se.created_at DESC LIMIT 1
        ) latest_se ON true
        LEFT JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = latest_se.academic_year_grade_id
        WHERE s.org_id = $1::uuid
          AND sc.status = 'active'::student_charge_status
          AND scd.status NOT IN ('cancelled'::student_charge_due_status, 'waived'::student_charge_due_status)
    `;

    const duesParams: any[] = [safeOrgId];
    if (safeYearId) {
      duesParams.push(safeYearId);
      duesSql += ` AND ayg.academic_year_id = $${duesParams.length}::uuid `;
    }

    duesSql += `
      )
      SELECT
        COALESCE(SUM(amount_due), 0)::float8 as total_assessed_dues,
        COALESCE(SUM(allocated_amount), 0)::float8 as total_allocated_paid,
        COALESCE(SUM(outstanding_amount), 0)::float8 as total_outstanding,
        COALESCE(SUM(CASE WHEN due_date < CURRENT_DATE AND outstanding_amount > 0 THEN outstanding_amount ELSE 0 END), 0)::float8 as total_overdue,
        COALESCE(SUM(CASE WHEN due_date >= CURRENT_DATE AND due_date <= (CURRENT_DATE + INTERVAL '7 days') AND outstanding_amount > 0 THEN outstanding_amount ELSE 0 END), 0)::float8 as due_next_7_days,
        COALESCE(SUM(CASE WHEN due_date >= CURRENT_DATE AND due_date <= (CURRENT_DATE + INTERVAL '30 days') AND outstanding_amount > 0 THEN outstanding_amount ELSE 0 END), 0)::float8 as due_next_30_days,
        COUNT(DISTINCT CASE WHEN outstanding_amount > 0 THEN student_id END)::int as students_with_outstanding,
        COUNT(DISTINCT CASE WHEN due_date < CURRENT_DATE AND outstanding_amount > 0 THEN student_id END)::int as overdue_accounts_count,
        COALESCE(MAX(currency_code), 'INR') as currency_code
      FROM dues_calculated;
    `;

    const duesResult: any = await db.$queryRawUnsafe(duesSql, ...duesParams);
    const summaryRow = duesResult[0] || {};

    // 2. Query confirmed collections for this month strictly from successful transactions
    let monthSql = `
      SELECT COALESCE(SUM(pt.amount), 0)::float8 as collected_this_month
      FROM payment_transactions pt
      JOIN payment_orders po ON pt.payment_order_id = po.payment_order_id
      JOIN students s ON po.student_id = s.student_id
      LEFT JOIN LATERAL (
        SELECT se.academic_year_grade_id
        FROM student_enrollments se
        WHERE se.student_id = s.student_id AND se.status = 'active'
        ORDER BY se.created_at DESC LIMIT 1
      ) latest_se ON true
      LEFT JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = latest_se.academic_year_grade_id
      WHERE s.org_id = $1::uuid
        AND pt.status = 'success'::payment_transaction_status
        AND pt.transaction_date >= date_trunc('month', CURRENT_DATE)
        AND pt.transaction_date < (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')
    `;

    const monthParams: any[] = [safeOrgId];
    if (safeYearId) {
      monthParams.push(safeYearId);
      monthSql += ` AND ayg.academic_year_id = $${monthParams.length}::uuid `;
    }

    const monthResult: any = await db.$queryRawUnsafe(monthSql, ...monthParams);
    const collectedThisMonth = this.roundMoney(monthResult[0]?.collected_this_month || 0);

    const totalOutstanding = this.roundMoney(summaryRow.total_outstanding || 0);
    const totalAllocatedPaid = this.roundMoney(summaryRow.total_allocated_paid || 0);
    const totalAssessedDues = this.roundMoney(summaryRow.total_assessed_dues || 0);
    const totalDenominator = this.roundMoney(totalOutstanding + totalAllocatedPaid);
    const collectionRate = totalDenominator > 0
      ? this.roundMoney((totalAllocatedPaid / totalDenominator) * 100)
      : (totalAssessedDues > 0 ? 0 : 100);

    return {
      totalOutstanding,
      totalOverdue: this.roundMoney(summaryRow.total_overdue || 0),
      dueInNext7Days: this.roundMoney(summaryRow.due_next_7_days || 0),
      dueInNext30Days: this.roundMoney(summaryRow.due_next_30_days || 0),
      collectedThisMonth,
      collectionRate,
      studentsWithOutstanding: summaryRow.students_with_outstanding || 0,
      overdueAccountsCount: summaryRow.overdue_accounts_count || 0,
      totalAssessedDues,
      totalAllocatedPaid,
      currencyCode: summaryRow.currency_code || 'INR',
    };
  }

  // =========================================================================
  // 2. RECEIVABLES REGISTER (Screen B)
  // =========================================================================

  /**
   * Searchable, paginated, sortable register of student fee obligations.
   * Calculations use real payment allocations and due dates.
   */
  public static async getReceivablesRegister(
    orgId: string,
    filter: ReceivablesFilter = {},
    client?: any
  ): Promise<{
    items: any[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
    aggregates: {
      totalOriginalAmount: number;
      totalPaidAmount: number;
      totalOutstandingAmount: number;
    };
  }> {
    const db = this.getClient(client);
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const offset = (page - 1) * limit;

    const params: any[] = [safeOrgId];

    let whereSql = `
      WHERE s.org_id = $1::uuid
        AND sc.status = 'active'::student_charge_status
        AND scd.status NOT IN ('cancelled'::student_charge_due_status)
    `;

    if (filter.academicYearId) {
      const safeYearId = toSafeUuid(filter.academicYearId);
      if (safeYearId) {
        params.push(safeYearId);
        whereSql += ` AND ayg.academic_year_id = $${params.length}::uuid `;
      }
    }

    if (filter.gradeId) {
      const safeGradeId = toSafeUuid(filter.gradeId);
      if (safeGradeId) {
        params.push(safeGradeId);
        whereSql += ` AND ayg.grade_id = $${params.length}::uuid `;
      }
    }

    if (filter.feeComponentId) {
      const safeCompId = toSafeUuid(filter.feeComponentId);
      if (safeCompId) {
        params.push(safeCompId);
        whereSql += ` AND sc.fee_component_id = $${params.length}::uuid `;
      }
    }

    if (filter.dueDateFrom) {
      params.push(filter.dueDateFrom);
      whereSql += ` AND scd.due_date >= $${params.length}::date `;
    }

    if (filter.dueDateTo) {
      params.push(filter.dueDateTo);
      whereSql += ` AND scd.due_date <= $${params.length}::date `;
    }

    if (filter.search && filter.search.trim().length > 0) {
      const q = `%${filter.search.trim().toLowerCase()}%`;
      params.push(q);
      whereSql += ` AND (
        LOWER(s.admission_no) LIKE $${params.length}
        OR LOWER(s.first_name) LIKE $${params.length}
        OR LOWER(COALESCE(s.last_name, '')) LIKE $${params.length}
        OR LOWER(fc.component_name) LIKE $${params.length}
        OR LOWER(COALESCE(ipt.term_name, '')) LIKE $${params.length}
      ) `;
    }

    // Base CTE for calculating allocations and outstanding per due
    const baseCte = `
      WITH allocated_per_due AS (
        SELECT
          pa.student_charge_due_id,
          COALESCE(SUM(pa.allocated_amount), 0)::numeric as total_allocated,
          MAX(pt.transaction_date) as last_payment_date
        FROM payment_allocations pa
        JOIN payment_transactions pt ON pa.payment_transaction_id = pt.payment_transaction_id
        WHERE pt.status = 'success'::payment_transaction_status
        GROUP BY pa.student_charge_due_id
      ),
      concessions_per_student AS (
        SELECT
          sc_inner.student_id,
          COALESCE(SUM(sc_inner.concession_percentage), 0)::float8 as total_concession_pct
        FROM scholarship_concessions sc_inner
        WHERE sc_inner.status IN ('applied'::scholarship_concession_status, 'approved'::scholarship_concession_status)
        GROUP BY sc_inner.student_id
      ),
      due_records AS (
        SELECT
          scd.student_charge_due_id,
          scd.student_charge_id,
          sc.student_id,
          s.admission_no,
          s.first_name,
          s.last_name,
          TRIM(CONCAT(s.first_name, ' ', COALESCE(s.last_name, ''))) as student_name,
          ay.academic_year_name,
          ayg.academic_year_id,
          g.grade_name,
          ayg.grade_id,
          sec.section_name,
          fc.component_name,
          fc.fee_component_id,
          COALESCE(ipt.term_name, 'Single Due') as term_name,
          scd.installment_term_id,
          sc.amount::float8 as charge_assessed_amount,
          scd.amount_due::float8 as original_due_amount,
          COALESCE(apd.total_allocated, 0)::float8 as paid_amount,
          GREATEST(0, (scd.amount_due::numeric - COALESCE(apd.total_allocated, 0)))::float8 as outstanding_amount,
          scd.due_date,
          scd.status as due_status,
          apd.last_payment_date,
          COALESCE(cps.total_concession_pct, 0)::float8 as student_concession_pct,
          (CURRENT_DATE - scd.due_date::date)::int as days_overdue,
          CASE
            WHEN scd.status = 'waived' THEN 'Waived'
            WHEN GREATEST(0, (scd.amount_due::numeric - COALESCE(apd.total_allocated, 0))) = 0 THEN 'Settled'
            WHEN (CURRENT_DATE - scd.due_date::date) > 0 THEN 'Overdue'
            WHEN (CURRENT_DATE - scd.due_date::date) = 0 THEN 'Due Today'
            WHEN COALESCE(apd.total_allocated, 0) > 0 THEN 'Partially Paid'
            ELSE 'Not Yet Due'
          END as derived_status,
          CASE
            WHEN (CURRENT_DATE - scd.due_date::date) <= 0 THEN 'CURRENT'
            WHEN (CURRENT_DATE - scd.due_date::date) BETWEEN 1 AND 7 THEN 'OVERDUE_1_7'
            WHEN (CURRENT_DATE - scd.due_date::date) BETWEEN 8 AND 30 THEN 'OVERDUE_8_30'
            WHEN (CURRENT_DATE - scd.due_date::date) BETWEEN 31 AND 60 THEN 'OVERDUE_31_60'
            WHEN (CURRENT_DATE - scd.due_date::date) BETWEEN 61 AND 90 THEN 'OVERDUE_61_90'
            ELSE 'OVERDUE_90_PLUS'
          END as ageing_bucket
        FROM student_charge_dues scd
        JOIN student_charges sc ON scd.student_charge_id = sc.student_charge_id
        JOIN students s ON sc.student_id = s.student_id
        LEFT JOIN fee_components fc ON sc.fee_component_id = fc.fee_component_id
        LEFT JOIN installment_plan_terms ipt ON scd.installment_term_id = ipt.installment_term_id
        LEFT JOIN allocated_per_due apd ON scd.student_charge_due_id = apd.student_charge_due_id
        LEFT JOIN concessions_per_student cps ON sc.student_id = cps.student_id
        LEFT JOIN LATERAL (
          SELECT se.academic_year_grade_id, se.section_id
          FROM student_enrollments se
          WHERE se.student_id = s.student_id AND se.status = 'active'
          ORDER BY se.created_at DESC LIMIT 1
        ) latest_se ON true
        LEFT JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = latest_se.academic_year_grade_id
        LEFT JOIN academic_years ay ON ay.academic_year_id = ayg.academic_year_id
        LEFT JOIN grades g ON g.grade_id = ayg.grade_id
        LEFT JOIN sections sec ON sec.section_id = latest_se.section_id
        ${whereSql}
      )
    `;

    // Outer filter for derived fields (status, ageingBucket, min/max outstanding)
    let outerWhere = ' WHERE 1=1 ';
    const outerParams: any[] = [];

    if (filter.status && filter.status !== 'all') {
      outerParams.push(filter.status);
      outerWhere += ` AND LOWER(derived_status) = LOWER($${params.length + outerParams.length}) `;
    }

    if (filter.ageingBucket && filter.ageingBucket !== 'all') {
      outerParams.push(filter.ageingBucket);
      outerWhere += ` AND ageing_bucket = $${params.length + outerParams.length} `;
    }

    if (filter.minOutstanding !== undefined && filter.minOutstanding !== null) {
      outerParams.push(filter.minOutstanding);
      outerWhere += ` AND outstanding_amount >= $${params.length + outerParams.length}::numeric `;
    }

    if (filter.maxOutstanding !== undefined && filter.maxOutstanding !== null) {
      outerParams.push(filter.maxOutstanding);
      outerWhere += ` AND outstanding_amount <= $${params.length + outerParams.length}::numeric `;
    }

    // 1. Count & Aggregate Query
    const countSql = `
      ${baseCte}
      SELECT
        COUNT(*)::int as total,
        COALESCE(SUM(original_due_amount), 0)::float8 as total_original,
        COALESCE(SUM(paid_amount), 0)::float8 as total_paid,
        COALESCE(SUM(outstanding_amount), 0)::float8 as total_outstanding
      FROM due_records
      ${outerWhere};
    `;

    const countResult: any = await db.$queryRawUnsafe(countSql, ...params, ...outerParams);
    const total = countResult[0]?.total || 0;
    const totalOriginalAmount = this.roundMoney(countResult[0]?.total_original || 0);
    const totalPaidAmount = this.roundMoney(countResult[0]?.total_paid || 0);
    const totalOutstandingAmount = this.roundMoney(countResult[0]?.total_outstanding || 0);

    // 2. Sorting clause
    let sortClause = ' ORDER BY due_date ASC, days_overdue DESC ';
    if (filter.sortBy) {
      const order = filter.sortOrder?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
      switch (filter.sortBy) {
        case 'student_name':
          sortClause = ` ORDER BY student_name ${order}, due_date ASC `;
          break;
        case 'admission_no':
          sortClause = ` ORDER BY admission_no ${order} `;
          break;
        case 'outstanding_amount':
          sortClause = ` ORDER BY outstanding_amount ${order} `;
          break;
        case 'days_overdue':
          sortClause = ` ORDER BY days_overdue ${order} `;
          break;
        case 'due_date':
          sortClause = ` ORDER BY due_date ${order} `;
          break;
        case 'grade_name':
          sortClause = ` ORDER BY grade_name ${order} `;
          break;
        default:
          sortClause = ` ORDER BY due_date ASC, days_overdue DESC `;
      }
    }

    // 3. Data Query with Limit and Offset
    const paginationParams = [...params, ...outerParams, limit, offset];
    const dataSql = `
      ${baseCte}
      SELECT *
      FROM due_records
      ${outerWhere}
      ${sortClause}
      LIMIT $${paginationParams.length - 1} OFFSET $${paginationParams.length};
    `;

    const rows: any = await db.$queryRawUnsafe(dataSql, ...paginationParams);

    const formattedItems = rows.map((r: any) => ({
      student_charge_due_id: r.student_charge_due_id,
      student_charge_id: r.student_charge_id,
      student_id: r.student_id,
      admission_no: r.admission_no,
      student_name: r.student_name,
      academic_year_name: r.academic_year_name || 'N/A',
      academic_year_id: r.academic_year_id,
      grade_name: r.grade_name || 'N/A',
      grade_id: r.grade_id,
      section_name: r.section_name || 'N/A',
      component_name: r.component_name || 'Tuition / Fees',
      fee_component_id: r.fee_component_id,
      term_name: r.term_name,
      installment_term_id: r.installment_term_id,
      original_assessed_amount: this.roundMoney(r.original_due_amount),
      applied_concession_pct: this.roundMoney(r.student_concession_pct),
      paid_amount: this.roundMoney(r.paid_amount),
      outstanding_amount: this.roundMoney(r.outstanding_amount),
      due_date: r.due_date instanceof Date ? r.due_date.toISOString().split('T')[0] : String(r.due_date),
      days_overdue: Math.max(0, r.days_overdue || 0),
      receivable_status: r.derived_status,
      ageing_bucket: r.ageing_bucket,
      last_payment_date: r.last_payment_date
        ? (r.last_payment_date instanceof Date ? r.last_payment_date.toISOString().split('T')[0] : String(r.last_payment_date))
        : null,
      last_follow_up_date: null, // Read-only / unmapped table disclosure
    }));

    return {
      items: formattedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      aggregates: {
        totalOriginalAmount,
        totalPaidAmount,
        totalOutstandingAmount,
      },
    };
  }

  // =========================================================================
  // 3. OVERDUE AGEING ANALYSIS (Screen C)
  // =========================================================================

  /**
   * Calculates mutually exclusive ageing buckets covering all active dues:
   * - CURRENT (Not Yet Due): due_date >= CURRENT_DATE
   * - OVERDUE_1_7: 1-7 days overdue
   * - OVERDUE_8_30: 8-30 days overdue
   * - OVERDUE_31_60: 31-60 days overdue
   * - OVERDUE_61_90: 61-90 days overdue
   * - OVERDUE_90_PLUS: > 90 days overdue
   */
  public static async getAgeingAnalysis(
    orgId: string,
    academicYearId?: string,
    client?: any
  ): Promise<{
    buckets: Array<{
      bucketKey: string;
      bucketLabel: string;
      outstandingAmount: number;
      dueCount: number;
      studentCount: number;
      percentageOfOverdue: number;
      percentageOfTotal: number;
    }>;
    totalOutstanding: number;
    totalOverdue: number;
    totalDueCount: number;
    totalStudentCount: number;
  }> {
    const db = this.getClient(client);
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeYearId = toSafeUuid(academicYearId);

    const params: any[] = [safeOrgId];
    let yearFilterSql = '';
    if (safeYearId) {
      params.push(safeYearId);
      yearFilterSql = ` AND ayg.academic_year_id = $${params.length}::uuid `;
    }

    const sql = `
      WITH allocated_per_due AS (
        SELECT
          pa.student_charge_due_id,
          COALESCE(SUM(pa.allocated_amount), 0)::numeric as total_allocated
        FROM payment_allocations pa
        JOIN payment_transactions pt ON pa.payment_transaction_id = pt.payment_transaction_id
        WHERE pt.status = 'success'::payment_transaction_status
        GROUP BY pa.student_charge_due_id
      ),
      active_dues AS (
        SELECT
          scd.student_charge_due_id,
          sc.student_id,
          GREATEST(0, (scd.amount_due::numeric - COALESCE(apd.total_allocated, 0)))::float8 as outstanding_amount,
          scd.due_date,
          (CURRENT_DATE - scd.due_date::date)::int as days_past_due,
          CASE
            WHEN scd.due_date >= CURRENT_DATE THEN 'CURRENT'
            WHEN (CURRENT_DATE - scd.due_date::date) BETWEEN 1 AND 7 THEN 'OVERDUE_1_7'
            WHEN (CURRENT_DATE - scd.due_date::date) BETWEEN 8 AND 30 THEN 'OVERDUE_8_30'
            WHEN (CURRENT_DATE - scd.due_date::date) BETWEEN 31 AND 60 THEN 'OVERDUE_31_60'
            WHEN (CURRENT_DATE - scd.due_date::date) BETWEEN 61 AND 90 THEN 'OVERDUE_61_90'
            ELSE 'OVERDUE_90_PLUS'
          END as bucket_key
        FROM student_charge_dues scd
        JOIN student_charges sc ON scd.student_charge_id = sc.student_charge_id
        JOIN students s ON sc.student_id = s.student_id
        LEFT JOIN allocated_per_due apd ON scd.student_charge_due_id = apd.student_charge_due_id
        LEFT JOIN LATERAL (
          SELECT se.academic_year_grade_id
          FROM student_enrollments se
          WHERE se.student_id = s.student_id AND se.status = 'active'
          ORDER BY se.created_at DESC LIMIT 1
        ) latest_se ON true
        LEFT JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = latest_se.academic_year_grade_id
        WHERE s.org_id = $1::uuid
          AND sc.status = 'active'::student_charge_status
          AND scd.status NOT IN ('cancelled'::student_charge_due_status, 'waived'::student_charge_due_status)
          ${yearFilterSql}
      )
      SELECT
        bucket_key,
        COALESCE(SUM(outstanding_amount), 0)::float8 as outstanding_amount,
        COUNT(student_charge_due_id)::int as due_count,
        COUNT(DISTINCT student_id)::int as student_count
      FROM active_dues
      WHERE outstanding_amount > 0
      GROUP BY bucket_key;
    `;

    const rows: any = await db.$queryRawUnsafe(sql, ...params);
    const rowMap = new Map<string, any>();
    for (const r of rows) {
      rowMap.set(r.bucket_key, r);
    }

    const bucketDefinitions = [
      { key: 'CURRENT', label: 'Not Yet Due' },
      { key: 'OVERDUE_1_7', label: '1–7 Days Overdue' },
      { key: 'OVERDUE_8_30', label: '8–30 Days Overdue' },
      { key: 'OVERDUE_31_60', label: '31–60 Days Overdue' },
      { key: 'OVERDUE_61_90', label: '61–90 Days Overdue' },
      { key: 'OVERDUE_90_PLUS', label: 'More Than 90 Days Overdue' },
    ];

    let totalOutstanding = 0;
    let totalOverdue = 0;
    let totalDueCount = 0;
    const uniqueStudents = new Set<string>();

    for (const def of bucketDefinitions) {
      const match = rowMap.get(def.key);
      const amt = match ? Number(match.outstanding_amount) : 0;
      totalOutstanding += amt;
      if (def.key !== 'CURRENT') {
        totalOverdue += amt;
      }
      totalDueCount += match ? Number(match.due_count) : 0;
    }

    totalOutstanding = this.roundMoney(totalOutstanding);
    totalOverdue = this.roundMoney(totalOverdue);

    const buckets = bucketDefinitions.map((def) => {
      const match = rowMap.get(def.key);
      const outstandingAmount = this.roundMoney(match ? Number(match.outstanding_amount) : 0);
      const dueCount = match ? Number(match.due_count) : 0;
      const studentCount = match ? Number(match.student_count) : 0;

      const percentageOfTotal = totalOutstanding > 0
        ? this.roundMoney((outstandingAmount / totalOutstanding) * 100)
        : 0;

      const percentageOfOverdue = (def.key !== 'CURRENT' && totalOverdue > 0)
        ? this.roundMoney((outstandingAmount / totalOverdue) * 100)
        : (def.key === 'CURRENT' ? 0 : 0);

      return {
        bucketKey: def.key,
        bucketLabel: def.label,
        outstandingAmount,
        dueCount,
        studentCount,
        percentageOfOverdue,
        percentageOfTotal,
      };
    });

    return {
      buckets,
      totalOutstanding,
      totalOverdue,
      totalDueCount,
      totalStudentCount: rows.reduce((acc: number, r: any) => acc + Number(r.student_count || 0), 0),
    };
  }

  // =========================================================================
  // 4. COLLECTION PERFORMANCE (Screen D)
  // =========================================================================

  /**
   * Confirmed collections and trends over a selected reporting period.
   * Derives amounts exclusively from successful payment transactions and valid allocations.
   */
  public static async getCollectionPerformance(
    orgId: string,
    filter: CollectionPerformanceFilter = {},
    client?: any
  ): Promise<{
    period: string;
    startDate: string;
    endDate: string;
    grossCollectedAmount: number;
    transactionCount: number;
    onlineCollectionsAmount: number;
    offlineCollectionsAmount: number;
    paymentMethodBreakdown: Array<{ method: string; amount: number; count: number }>;
    trendByDate: Array<{ date: string; amount: number; count: number }>;
    collectionsByGrade: Array<{ gradeId: string; gradeName: string; amount: number; count: number }>;
    collectionsByComponent: Array<{ componentId: string; componentName: string; amount: number }>;
  }> {
    const db = this.getClient(client);
    const safeOrgId = toSafeUuid(orgId) || orgId;

    // Resolve date range based on requested period
    const period = filter.period || 'this_month';
    let startDate: string;
    let endDate: string;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    switch (period) {
      case 'today':
        startDate = todayStr;
        endDate = todayStr;
        break;
      case 'this_week': {
        const d = new Date(now);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
        d.setDate(diff);
        startDate = d.toISOString().split('T')[0];
        endDate = todayStr;
        break;
      }
      case 'this_month': {
        const d = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate = d.toISOString().split('T')[0];
        endDate = todayStr;
        break;
      }
      case 'this_academic_year': {
        // Query active academic year dates or default to 1 year back
        const ayRows: any = await db.$queryRaw`
          SELECT start_date, end_date FROM academic_years
          WHERE org_id = ${safeOrgId}::uuid AND status IN ('open', 'admissions_open', 'planning')
          ORDER BY start_date DESC LIMIT 1;
        `;
        if (ayRows.length > 0 && ayRows[0].start_date) {
          startDate = ayRows[0].start_date.toISOString().split('T')[0];
          endDate = ayRows[0].end_date ? ayRows[0].end_date.toISOString().split('T')[0] : todayStr;
        } else {
          const d = new Date(now.getFullYear(), 0, 1);
          startDate = d.toISOString().split('T')[0];
          endDate = todayStr;
        }
        break;
      }
      case 'custom':
      default:
        startDate = filter.startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        endDate = filter.endDate || todayStr;
        break;
    }

    const params: any[] = [safeOrgId, startDate, endDate];

    // 1. Gross metrics and method breakdown
    const txSql = `
      SELECT
        COALESCE(SUM(pt.amount), 0)::float8 as total_amount,
        COUNT(pt.payment_transaction_id)::int as tx_count,
        pt.payment_method,
        COALESCE(SUM(CASE WHEN LOWER(pt.payment_method::text) IN ('online', 'gateway', 'razorpay', 'stripe', 'card', 'upi', 'netbanking') THEN pt.amount ELSE 0 END), 0)::float8 as online_amount,
        COALESCE(SUM(CASE WHEN LOWER(pt.payment_method::text) IN ('cash', 'cheque', 'dd', 'demand_draft', 'bank_transfer', 'offline') THEN pt.amount ELSE 0 END), 0)::float8 as offline_amount
      FROM payment_transactions pt
      JOIN payment_orders po ON pt.payment_order_id = po.payment_order_id
      JOIN students s ON po.student_id = s.student_id
      WHERE s.org_id = $1::uuid
        AND pt.status = 'success'::payment_transaction_status
        AND pt.transaction_date::date >= $2::date
        AND pt.transaction_date::date <= $3::date
      GROUP BY pt.payment_method;
    `;

    const txRows: any = await db.$queryRawUnsafe(txSql, ...params);

    let grossCollectedAmount = 0;
    let transactionCount = 0;
    let onlineCollectionsAmount = 0;
    let offlineCollectionsAmount = 0;
    const paymentMethodBreakdown: any[] = [];

    for (const r of txRows) {
      const amt = Number(r.total_amount || 0);
      const cnt = Number(r.tx_count || 0);
      grossCollectedAmount += amt;
      transactionCount += cnt;

      const methodLower = (r.payment_method || '').toLowerCase();
      if (['online', 'gateway', 'razorpay', 'stripe', 'card', 'upi', 'netbanking'].includes(methodLower)) {
        onlineCollectionsAmount += amt;
      } else {
        offlineCollectionsAmount += amt;
      }

      paymentMethodBreakdown.push({
        method: r.payment_method || 'other',
        amount: this.roundMoney(amt),
        count: cnt,
      });
    }

    // 2. Trend by Date
    const trendSql = `
      SELECT
        pt.transaction_date::date as tx_date,
        COALESCE(SUM(pt.amount), 0)::float8 as date_amount,
        COUNT(pt.payment_transaction_id)::int as date_count
      FROM payment_transactions pt
      JOIN payment_orders po ON pt.payment_order_id = po.payment_order_id
      JOIN students s ON po.student_id = s.student_id
      WHERE s.org_id = $1::uuid
        AND pt.status = 'success'::payment_transaction_status
        AND pt.transaction_date::date >= $2::date
        AND pt.transaction_date::date <= $3::date
      GROUP BY pt.transaction_date::date
      ORDER BY pt.transaction_date::date ASC;
    `;

    const trendRows: any = await db.$queryRawUnsafe(trendSql, ...params);
    const trendByDate = trendRows.map((r: any) => ({
      date: r.tx_date instanceof Date ? r.tx_date.toISOString().split('T')[0] : String(r.tx_date),
      amount: this.roundMoney(r.date_amount),
      count: Number(r.date_count || 0),
    }));

    // 3. Collections by Grade (via student active enrollment)
    const gradeSql = `
      SELECT
        g.grade_id,
        COALESCE(g.grade_name, 'Unassigned') as grade_name,
        COALESCE(SUM(pt.amount), 0)::float8 as grade_amount,
        COUNT(DISTINCT pt.payment_transaction_id)::int as tx_count
      FROM payment_transactions pt
      JOIN payment_orders po ON pt.payment_order_id = po.payment_order_id
      JOIN students s ON po.student_id = s.student_id
      LEFT JOIN LATERAL (
        SELECT se.academic_year_grade_id
        FROM student_enrollments se
        WHERE se.student_id = s.student_id AND se.status = 'active'
        ORDER BY se.created_at DESC LIMIT 1
      ) latest_se ON true
      LEFT JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = latest_se.academic_year_grade_id
      LEFT JOIN grades g ON g.grade_id = ayg.grade_id
      WHERE s.org_id = $1::uuid
        AND pt.status = 'success'::payment_transaction_status
        AND pt.transaction_date::date >= $2::date
        AND pt.transaction_date::date <= $3::date
      GROUP BY g.grade_id, g.grade_name
      ORDER BY grade_amount DESC;
    `;

    const gradeRows: any = await db.$queryRawUnsafe(gradeSql, ...params);
    const collectionsByGrade = gradeRows.map((r: any) => ({
      gradeId: r.grade_id || 'unassigned',
      gradeName: r.grade_name || 'Unassigned Grade',
      amount: this.roundMoney(r.grade_amount),
      count: Number(r.tx_count || 0),
    }));

    // 4. Collections by Fee Component (attributed through payment_allocations)
    const compSql = `
      SELECT
        fc.fee_component_id,
        COALESCE(fc.component_name, 'General / Miscellaneous') as component_name,
        COALESCE(SUM(pa.allocated_amount), 0)::float8 as allocated_amount
      FROM payment_allocations pa
      JOIN payment_transactions pt ON pa.payment_transaction_id = pt.payment_transaction_id
      JOIN student_charge_dues scd ON pa.student_charge_due_id = scd.student_charge_due_id
      JOIN student_charges sc ON scd.student_charge_id = sc.student_charge_id
      JOIN students s ON sc.student_id = s.student_id
      LEFT JOIN fee_components fc ON sc.fee_component_id = fc.fee_component_id
      WHERE s.org_id = $1::uuid
        AND pt.status = 'success'::payment_transaction_status
        AND pt.transaction_date::date >= $2::date
        AND pt.transaction_date::date <= $3::date
      GROUP BY fc.fee_component_id, fc.component_name
      ORDER BY allocated_amount DESC;
    `;

    const compRows: any = await db.$queryRawUnsafe(compSql, ...params);
    const collectionsByComponent = compRows.map((r: any) => ({
      componentId: r.fee_component_id || 'general',
      componentName: r.component_name || 'Tuition / Fees',
      amount: this.roundMoney(r.allocated_amount),
    }));

    return {
      period,
      startDate,
      endDate,
      grossCollectedAmount: this.roundMoney(grossCollectedAmount),
      transactionCount,
      onlineCollectionsAmount: this.roundMoney(onlineCollectionsAmount),
      offlineCollectionsAmount: this.roundMoney(offlineCollectionsAmount),
      paymentMethodBreakdown,
      trendByDate,
      collectionsByGrade,
      collectionsByComponent,
    };
  }

  // =========================================================================
  // 5. STUDENT RECEIVABLES DETAIL (Screen E)
  // =========================================================================

  /**
   * Detailed breakdown for a single student reconciling with the existing StudentLedgerService.
   */
  public static async getStudentReceivableDetail(
    orgId: string,
    studentId: string,
    client?: any
  ): Promise<any> {
    const db = this.getClient(client);
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeStudentId = toSafeUuid(studentId);

    if (!safeStudentId) {
      throw new Error('Invalid student identifier');
    }

    // 1. Fetch student info
    const studentRows: any = await db.$queryRaw`
      SELECT
        s.student_id, s.admission_no, s.first_name, s.last_name, s.dob, s.gender, s.status as student_status,
        ay.academic_year_name, g.grade_name, sec.section_name,
        ayg.academic_year_id, ayg.grade_id, se.enrollment_id
      FROM students s
      LEFT JOIN LATERAL (
        SELECT se_inner.enrollment_id, se_inner.academic_year_grade_id, se_inner.section_id
        FROM student_enrollments se_inner
        WHERE se_inner.student_id = s.student_id AND se_inner.status = 'active'
        ORDER BY se_inner.created_at DESC LIMIT 1
      ) se ON true
      LEFT JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = se.academic_year_grade_id
      LEFT JOIN academic_years ay ON ay.academic_year_id = ayg.academic_year_id
      LEFT JOIN grades g ON g.grade_id = ayg.grade_id
      LEFT JOIN sections sec ON sec.section_id = se.section_id
      WHERE s.student_id = ${safeStudentId}::uuid
        AND s.org_id = ${safeOrgId}::uuid
      LIMIT 1;
    `;

    if (!studentRows.length) {
      return null;
    }

    const student = studentRows[0];

    // 2. Fetch dues with allocations
    const duesRows: any = await db.$queryRaw`
      SELECT
        scd.student_charge_due_id, scd.student_charge_id, scd.amount_due::float8 as amount_due,
        scd.due_date, scd.status as due_status,
        sc.description as charge_description, sc.amount::float8 as charge_amount,
        fc.component_name, fc.fee_component_id,
        ipt.term_name, ipt.installment_term_id,
        COALESCE((
          SELECT SUM(pa.allocated_amount)::float8
          FROM payment_allocations pa
          JOIN payment_transactions pt ON pt.payment_transaction_id = pa.payment_transaction_id
          WHERE pa.student_charge_due_id = scd.student_charge_due_id
            AND pt.status = 'success'::payment_transaction_status
        ), 0) as allocated_amount,
        (CURRENT_DATE - scd.due_date::date)::int as days_past_due
      FROM student_charge_dues scd
      JOIN student_charges sc ON scd.student_charge_id = sc.student_charge_id
      LEFT JOIN fee_components fc ON fc.fee_component_id = sc.fee_component_id
      LEFT JOIN installment_plan_terms ipt ON ipt.installment_term_id = scd.installment_term_id
      WHERE sc.student_id = ${safeStudentId}::uuid
        AND sc.status = 'active'::student_charge_status
        AND scd.status NOT IN ('cancelled'::student_charge_due_status)
      ORDER BY scd.due_date ASC;
    `;

    let totalAssessed = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;

    const dues = duesRows.map((d: any) => {
      const amtDue = this.roundMoney(d.amount_due);
      const allocated = this.roundMoney(d.allocated_amount);
      const outstanding = Math.max(0, this.roundMoney(amtDue - allocated));
      const daysOverdue = Math.max(0, d.days_past_due || 0);

      totalAssessed += amtDue;
      totalPaid += allocated;
      totalOutstanding += outstanding;

      if (d.days_past_due > 0 && outstanding > 0 && d.due_status !== 'waived') {
        totalOverdue += outstanding;
      }

      let derivedStatus = 'Not Yet Due';
      if (d.due_status === 'waived') derivedStatus = 'Waived';
      else if (outstanding === 0) derivedStatus = 'Settled';
      else if (d.days_past_due > 0) derivedStatus = 'Overdue';
      else if (d.days_past_due === 0) derivedStatus = 'Due Today';
      else if (allocated > 0) derivedStatus = 'Partially Paid';

      return {
        student_charge_due_id: d.student_charge_due_id,
        student_charge_id: d.student_charge_id,
        component_name: d.component_name || 'Tuition / Fees',
        term_name: d.term_name || 'Standard Term',
        amount_due: amtDue,
        paid_amount: allocated,
        outstanding_amount: outstanding,
        due_date: d.due_date instanceof Date ? d.due_date.toISOString().split('T')[0] : String(d.due_date),
        days_overdue: daysOverdue,
        status: derivedStatus,
      };
    });

    // 3. Fetch confirmed payment history
    const paymentRows: any = await db.$queryRaw`
      SELECT
        pt.payment_transaction_id, pt.payment_order_id, pt.payment_method, pt.status as transaction_status,
        pt.amount::float8 as transaction_amount, pt.transaction_date, pt.gateway_name, pt.gateway_transaction_id,
        po.order_reference, po.description as order_description
      FROM payment_transactions pt
      JOIN payment_orders po ON pt.payment_order_id = po.payment_order_id
      WHERE po.student_id = ${safeStudentId}::uuid
        AND pt.status = 'success'::payment_transaction_status
      ORDER BY pt.transaction_date DESC;
    `;

    const paymentHistory = paymentRows.map((p: any) => ({
      payment_transaction_id: p.payment_transaction_id,
      payment_order_id: p.payment_order_id,
      payment_method: p.payment_method,
      amount: this.roundMoney(p.transaction_amount),
      transaction_date: p.transaction_date instanceof Date ? p.transaction_date.toISOString().split('T')[0] : String(p.transaction_date),
      gateway_name: p.gateway_name,
      gateway_transaction_id: p.gateway_transaction_id,
      order_reference: p.order_reference,
    }));

    // 4. Fetch concessions
    const concessionRows: any = await db.$queryRaw`
      SELECT
        sc.scholarship_concession_id, sc.concession_name, sc.scholarship_type,
        sc.concession_percentage::float8 as concession_percentage,
        sc.approved_percentage::float8 as approved_percentage,
        sc.scope, sc.status, sc.created_at
      FROM scholarship_concessions sc
      WHERE sc.student_id = ${safeStudentId}::uuid
      ORDER BY sc.created_at DESC;
    `;

    return {
      student: {
        student_id: student.student_id,
        admission_no: student.admission_no,
        full_name: `${student.first_name} ${student.last_name || ''}`.trim(),
        first_name: student.first_name,
        last_name: student.last_name,
        academic_year_name: student.academic_year_name || 'N/A',
        grade_name: student.grade_name || 'N/A',
        section_name: student.section_name || 'N/A',
        status: student.student_status,
      },
      summary: {
        totalAssessed: this.roundMoney(totalAssessed),
        totalPaid: this.roundMoney(totalPaid),
        totalOutstanding: this.roundMoney(totalOutstanding),
        totalOverdue: this.roundMoney(totalOverdue),
      },
      dues,
      paymentHistory,
      concessions: concessionRows.map((c: any) => ({
        scholarship_concession_id: c.scholarship_concession_id,
        concession_name: c.concession_name,
        scholarship_type: c.scholarship_type,
        concession_percentage: c.concession_percentage,
        approved_percentage: c.approved_percentage,
        scope: c.scope,
        status: c.status,
      })),
      followUpHistory: [], // Read-only / unmapped table disclosure
    };
  }

  // =========================================================================
  // 6. COLLECTIONS FOLLOW-UP WORK QUEUE (Screen F)
  // =========================================================================

  /**
   * Prioritized list of students requiring collections follow-up.
   * Read-only operational prioritization queue.
   */
  public static async getFollowUpQueue(
    orgId: string,
    filter: FollowUpQueueFilter = {},
    client?: any
  ): Promise<{
    items: any[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
    tierCounts: {
      all: number;
      high_outstanding: number;
      long_overdue: number;
      newly_overdue: number;
      due_soon: number;
    };
  }> {
    const db = this.getClient(client);
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const offset = (page - 1) * limit;

    const baseCte = `
      WITH allocated_per_due AS (
        SELECT
          pa.student_charge_due_id,
          COALESCE(SUM(pa.allocated_amount), 0)::numeric as total_allocated
        FROM payment_allocations pa
        JOIN payment_transactions pt ON pa.payment_transaction_id = pt.payment_transaction_id
        WHERE pt.status = 'success'::payment_transaction_status
        GROUP BY pa.student_charge_due_id
      ),
      student_dues_agg AS (
        SELECT
          s.student_id,
          s.admission_no,
          s.first_name,
          s.last_name,
          TRIM(CONCAT(s.first_name, ' ', COALESCE(s.last_name, ''))) as student_name,
          ay.academic_year_name,
          ayg.academic_year_id,
          g.grade_name,
          ayg.grade_id,
          sec.section_name,
          COALESCE(SUM(GREATEST(0, scd.amount_due::numeric - COALESCE(apd.total_allocated, 0))), 0)::float8 as total_outstanding,
          COALESCE(SUM(CASE WHEN scd.due_date < CURRENT_DATE THEN GREATEST(0, scd.amount_due::numeric - COALESCE(apd.total_allocated, 0)) ELSE 0 END), 0)::float8 as total_overdue,
          COALESCE(MAX(CASE WHEN scd.due_date < CURRENT_DATE AND (scd.amount_due::numeric - COALESCE(apd.total_allocated, 0)) > 0 THEN (CURRENT_DATE - scd.due_date::date) ELSE 0 END), 0)::int as max_days_overdue,
          MIN(CASE WHEN (scd.amount_due::numeric - COALESCE(apd.total_allocated, 0)) > 0 THEN scd.due_date END) as earliest_due_date,
          COUNT(scd.student_charge_due_id)::int as total_due_count
        FROM students s
        JOIN student_charges sc ON s.student_id = sc.student_id
        JOIN student_charge_dues scd ON sc.student_charge_id = scd.student_charge_id
        LEFT JOIN allocated_per_due apd ON scd.student_charge_due_id = apd.student_charge_due_id
        LEFT JOIN LATERAL (
          SELECT se.academic_year_grade_id, se.section_id
          FROM student_enrollments se
          WHERE se.student_id = s.student_id AND se.status = 'active'
          ORDER BY se.created_at DESC LIMIT 1
        ) latest_se ON true
        LEFT JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = latest_se.academic_year_grade_id
        LEFT JOIN academic_years ay ON ay.academic_year_id = ayg.academic_year_id
        LEFT JOIN grades g ON g.grade_id = ayg.grade_id
        LEFT JOIN sections sec ON sec.section_id = latest_se.section_id
        WHERE s.org_id = $1::uuid
          AND sc.status = 'active'::student_charge_status
          AND scd.status NOT IN ('cancelled'::student_charge_due_status, 'waived'::student_charge_due_status)
        GROUP BY s.student_id, s.admission_no, s.first_name, s.last_name,
                 ay.academic_year_name, ayg.academic_year_id, g.grade_name, ayg.grade_id, sec.section_name
        HAVING COALESCE(SUM(GREATEST(0, scd.amount_due::numeric - COALESCE(apd.total_allocated, 0))), 0) > 0
      )
    `;

    // Tier counts query across all active accounts
    const tierSql = `
      ${baseCte}
      SELECT
        COUNT(*)::int as count_all,
        COUNT(CASE WHEN total_outstanding >= 10000 THEN 1 END)::int as count_high_outstanding,
        COUNT(CASE WHEN max_days_overdue > 60 THEN 1 END)::int as count_long_overdue,
        COUNT(CASE WHEN max_days_overdue BETWEEN 1 AND 7 THEN 1 END)::int as count_newly_overdue,
        COUNT(CASE WHEN max_days_overdue = 0 AND earliest_due_date <= (CURRENT_DATE + INTERVAL '7 days') THEN 1 END)::int as count_due_soon
      FROM student_dues_agg;
    `;

    const tierRows: any = await db.$queryRawUnsafe(tierSql, safeOrgId);
    const tierCounts = {
      all: tierRows[0]?.count_all || 0,
      high_outstanding: tierRows[0]?.count_high_outstanding || 0,
      long_overdue: tierRows[0]?.count_long_overdue || 0,
      newly_overdue: tierRows[0]?.count_newly_overdue || 0,
      due_soon: tierRows[0]?.count_due_soon || 0,
    };

    // Filter by grouping tier
    const params: any[] = [safeOrgId];
    let whereClause = ' WHERE 1=1 ';

    if (filter.grouping && filter.grouping !== 'all') {
      switch (filter.grouping) {
        case 'high_outstanding':
          whereClause += ' AND total_outstanding >= 10000 ';
          break;
        case 'long_overdue':
          whereClause += ' AND max_days_overdue > 60 ';
          break;
        case 'newly_overdue':
          whereClause += ' AND max_days_overdue BETWEEN 1 AND 7 ';
          break;
        case 'due_soon':
          whereClause += " AND max_days_overdue = 0 AND earliest_due_date <= (CURRENT_DATE + INTERVAL '7 days') ";
          break;
      }
    }

    if (filter.academicYearId) {
      const safeYearId = toSafeUuid(filter.academicYearId);
      if (safeYearId) {
        params.push(safeYearId);
        whereClause += ` AND academic_year_id = $${params.length}::uuid `;
      }
    }

    if (filter.gradeId) {
      const safeGradeId = toSafeUuid(filter.gradeId);
      if (safeGradeId) {
        params.push(safeGradeId);
        whereClause += ` AND grade_id = $${params.length}::uuid `;
      }
    }

    if (filter.search && filter.search.trim().length > 0) {
      const q = `%${filter.search.trim().toLowerCase()}%`;
      params.push(q);
      whereClause += ` AND (
        LOWER(admission_no) LIKE $${params.length}
        OR LOWER(first_name) LIKE $${params.length}
        OR LOWER(COALESCE(last_name, '')) LIKE $${params.length}
      ) `;
    }

    // Count
    const countSql = `
      ${baseCte}
      SELECT COUNT(*)::int as total
      FROM student_dues_agg
      ${whereClause};
    `;

    const countRes: any = await db.$queryRawUnsafe(countSql, ...params);
    const total = countRes[0]?.total || 0;

    // Sorting
    let sortSql = ' ORDER BY max_days_overdue DESC, total_outstanding DESC ';
    if (filter.sortBy) {
      const order = filter.sortOrder?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
      switch (filter.sortBy) {
        case 'outstanding_amount':
          sortSql = ` ORDER BY total_outstanding ${order} `;
          break;
        case 'days_overdue':
          sortSql = ` ORDER BY max_days_overdue ${order} `;
          break;
        case 'due_date':
          sortSql = ` ORDER BY earliest_due_date ${order} `;
          break;
        case 'student_name':
          sortSql = ` ORDER BY student_name ${order} `;
          break;
        case 'grade':
          sortSql = ` ORDER BY grade_name ${order} `;
          break;
      }
    }

    const dataParams = [...params, limit, offset];
    const dataSql = `
      ${baseCte}
      SELECT *
      FROM student_dues_agg
      ${whereClause}
      ${sortSql}
      LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length};
    `;

    const rows: any = await db.$queryRawUnsafe(dataSql, ...dataParams);

    const items = rows.map((r: any) => ({
      student_id: r.student_id,
      admission_no: r.admission_no,
      student_name: r.student_name,
      academic_year_name: r.academic_year_name || 'N/A',
      academic_year_id: r.academic_year_id,
      grade_name: r.grade_name || 'N/A',
      grade_id: r.grade_id,
      section_name: r.section_name || 'N/A',
      total_outstanding: this.roundMoney(r.total_outstanding),
      total_overdue: this.roundMoney(r.total_overdue),
      days_overdue: r.max_days_overdue || 0,
      earliest_due_date: r.earliest_due_date instanceof Date ? r.earliest_due_date.toISOString().split('T')[0] : String(r.earliest_due_date),
      priority_tier: r.max_days_overdue > 60 ? 'HIGH_RISK' : (r.total_outstanding >= 10000 ? 'HIGH_VALUE' : 'STANDARD'),
      status: r.max_days_overdue > 0 ? 'Overdue' : 'Due Soon',
      last_follow_up: null,
      follow_up_supported: false, // Disclose schema freeze constraint
    }));

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      tierCounts,
    };
  }

  // =========================================================================
  // 7. RECEIVABLES REPORTS (Exports)
  // =========================================================================

  /**
   * Generates structured report datasets matching on-screen calculations.
   */
  public static async getReceivablesReport(
    orgId: string,
    reportType: 'outstanding_by_grade' | 'outstanding_by_component' | 'ageing_summary' | 'collections_period',
    filter: any = {},
    client?: any
  ): Promise<any> {
    const safeOrgId = toSafeUuid(orgId) || orgId;

    switch (reportType) {
      case 'outstanding_by_grade': {
        const result = await this.getReceivablesRegister(safeOrgId, { ...filter, limit: 1000 }, client);
        // Group by grade
        const gradeMap = new Map<string, { gradeName: string; totalOutstanding: number; count: number }>();
        for (const item of result.items) {
          const gName = item.grade_name || 'Unassigned';
          const curr = gradeMap.get(gName) || { gradeName: gName, totalOutstanding: 0, count: 0 };
          curr.totalOutstanding = this.roundMoney(curr.totalOutstanding + item.outstanding_amount);
          curr.count += 1;
          gradeMap.set(gName, curr);
        }
        return Array.from(gradeMap.values()).sort((a, b) => b.totalOutstanding - a.totalOutstanding);
      }
      case 'outstanding_by_component': {
        const result = await this.getReceivablesRegister(safeOrgId, { ...filter, limit: 1000 }, client);
        const compMap = new Map<string, { componentName: string; totalOutstanding: number; count: number }>();
        for (const item of result.items) {
          const cName = item.component_name || 'General';
          const curr = compMap.get(cName) || { componentName: cName, totalOutstanding: 0, count: 0 };
          curr.totalOutstanding = this.roundMoney(curr.totalOutstanding + item.outstanding_amount);
          curr.count += 1;
          compMap.set(cName, curr);
        }
        return Array.from(compMap.values()).sort((a, b) => b.totalOutstanding - a.totalOutstanding);
      }
      case 'ageing_summary': {
        return this.getAgeingAnalysis(safeOrgId, filter.academicYearId, client);
      }
      case 'collections_period': {
        return this.getCollectionPerformance(safeOrgId, filter, client);
      }
      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }
  }
}
