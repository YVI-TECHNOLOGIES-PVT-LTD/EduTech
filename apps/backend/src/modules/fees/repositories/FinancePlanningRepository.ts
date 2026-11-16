/**
 * EduTrack ERP — Phase 13 Finance Planning Repository
 * ====================================================
 * High-performance, parameterized SQL database layer for Financial Planning,
 * Budgeting, and Collections/Receivables Forecasting.
 * 
 * Invariants:
 * - Read-only operational queries respecting the schema freeze.
 * - Strict tenant isolation on s.org_id / ay.org_id.
 * - Exact decimal-safe aggregations via numeric/float8 casts.
 * - Independent CTE aggregation to prevent Cartesian join duplication.
 * - Distinguishes actual historical collections from future scheduled dues.
 */

import prisma from '../../../lib/prismaClient';

export interface PlanningDateFilter {
  startDate?: string;
  horizonMonths?: number;
  academicYearId?: string;
}

export interface MonthlyDueSchedule {
  month_year: string;
  year: number;
  month: number;
  dues_count: number;
  student_count: number;
  scheduled_amount_due: number;
  already_allocated_amount: number;
  remaining_scheduled_due: number;
}

export interface HistoricalMonthlyCollection {
  month_year: string;
  year: number;
  month: number;
  transaction_count: number;
  total_collected: number;
}

export class FinancePlanningRepository {
  private static getClient(client?: any) {
    return client || prisma;
  }

  public static roundMoney(val: number | string | null | undefined): number {
    if (val === null || val === undefined) return 0;
    const num = typeof val === 'number' ? val : Number(val);
    if (isNaN(num)) return 0;
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  // =========================================================================
  // 1. CAPABILITIES & AUDIT DETECTION
  // =========================================================================
  public static async getPlanningCapabilities(tenantOrgId: string) {
    const db = this.getClient();

    // Check physical tables in PostgreSQL for any durable budgeting/planning tables
    const tables: any[] = await db.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND (table_name ILIKE '%budget%' 
          OR table_name ILIKE '%forecast%' 
          OR table_name ILIKE '%planning_scenario%');
    `);

    // Check historical payment data count
    const historyCheck: any[] = await db.$queryRawUnsafe(`
      SELECT COUNT(pt.payment_transaction_id)::int as count
      FROM payment_transactions pt
      JOIN payment_orders po ON pt.payment_order_id = po.payment_order_id
      JOIN students s ON po.student_id = s.student_id
      WHERE s.org_id = $1::uuid
        AND pt.status = 'success'::payment_transaction_status;
    `, tenantOrgId);

    // Check scheduled dues count
    const dueCheck: any[] = await db.$queryRawUnsafe(`
      SELECT 
        COUNT(scd.student_charge_due_id)::int as count,
        MIN(scd.due_date)::text as earliest_due,
        MAX(scd.due_date)::text as latest_due
      FROM student_charge_dues scd
      JOIN student_charges sc ON scd.student_charge_id = sc.student_charge_id
      JOIN students s ON sc.student_id = s.student_id
      WHERE s.org_id = $1::uuid;
    `, tenantOrgId);

    const hasDurablePersistence = tables.length > 0;
    const historicalTxnCount = historyCheck[0]?.count || 0;
    const scheduledDueCount = dueCheck[0]?.count || 0;

    return {
      durable_budget_persistence: hasDurablePersistence,
      schema_freeze_enforced: true,
      simulation_workspace_enabled: true,
      supported_horizons: [3, 6, 12],
      historical_transactions_available: historicalTxnCount > 0,
      historical_transactions_count: historicalTxnCount,
      scheduled_dues_available: scheduledDueCount > 0,
      scheduled_dues_count: scheduledDueCount,
      scheduled_due_range: {
        earliest_due: dueCheck[0]?.earliest_due || null,
        latest_due: dueCheck[0]?.latest_due || null,
      },
      supported_scenarios: ['conservative', 'expected', 'optimistic'],
      limitations: [
        'Durable budget persistence is unavailable in current database schema',
        'Scenarios operate as on-demand mathematical simulations',
        'Historical forecast snapshots cannot be persisted under schema freeze',
        'Planning calculations do not mutate operational ledger records'
      ]
    };
  }

  // =========================================================================
  // 2. HISTORICAL MONTHLY COLLECTIONS (Baseline Actuals)
  // =========================================================================
  public static async getHistoricalMonthlyCollections(
    tenantOrgId: string,
    monthsBack: number = 12
  ): Promise<HistoricalMonthlyCollection[]> {
    const db = this.getClient();
    const sql = `
      SELECT
        TO_CHAR(DATE_TRUNC('month', pt.transaction_date), 'YYYY-MM') as month_year,
        EXTRACT(YEAR FROM pt.transaction_date)::int as year,
        EXTRACT(MONTH FROM pt.transaction_date)::int as month,
        COUNT(pt.payment_transaction_id)::int as transaction_count,
        COALESCE(SUM(pt.amount), 0)::float8 as total_collected
      FROM payment_transactions pt
      JOIN payment_orders po ON pt.payment_order_id = po.payment_order_id
      JOIN students s ON po.student_id = s.student_id
      WHERE s.org_id = $1::uuid
        AND pt.status = 'success'::payment_transaction_status
        AND pt.transaction_date >= (CURRENT_DATE - INTERVAL '1 month' * $2::int)
      GROUP BY DATE_TRUNC('month', pt.transaction_date), EXTRACT(YEAR FROM pt.transaction_date), EXTRACT(MONTH FROM pt.transaction_date)
      ORDER BY month_year ASC;
    `;

    const rows: any[] = await db.$queryRawUnsafe(sql, tenantOrgId, monthsBack);
    return rows.map(r => ({
      ...r,
      total_collected: this.roundMoney(r.total_collected)
    }));
  }

  // =========================================================================
  // 3. SCHEDULED DUES FORWARD SCHEDULE (By Due Date Month)
  // =========================================================================
  public static async getScheduledDuesSchedule(
    tenantOrgId: string,
    horizonMonths: number = 6,
    startDateStr?: string
  ): Promise<MonthlyDueSchedule[]> {
    const db = this.getClient();
    const effectiveStart = startDateStr || new Date().toISOString().split('T')[0];

    const sql = `
      WITH allocated_per_due AS (
        SELECT
          pa.student_charge_due_id,
          COALESCE(SUM(pa.allocated_amount), 0)::numeric as total_allocated
        FROM payment_allocations pa
        JOIN payment_transactions pt ON pa.payment_transaction_id = pt.payment_transaction_id
        WHERE pt.status = 'success'::payment_transaction_status
        GROUP BY pa.student_charge_due_id
      )
      SELECT
        TO_CHAR(DATE_TRUNC('month', scd.due_date), 'YYYY-MM') as month_year,
        EXTRACT(YEAR FROM scd.due_date)::int as year,
        EXTRACT(MONTH FROM scd.due_date)::int as month,
        COUNT(scd.student_charge_due_id)::int as dues_count,
        COUNT(DISTINCT sc.student_id)::int as student_count,
        COALESCE(SUM(scd.amount_due), 0)::float8 as scheduled_amount_due,
        COALESCE(SUM(COALESCE(apd.total_allocated, 0)), 0)::float8 as already_allocated_amount,
        COALESCE(SUM(GREATEST(0, scd.amount_due::numeric - COALESCE(apd.total_allocated, 0))), 0)::float8 as remaining_scheduled_due
      FROM student_charge_dues scd
      JOIN student_charges sc ON scd.student_charge_id = sc.student_charge_id
      JOIN students s ON sc.student_id = s.student_id
      LEFT JOIN allocated_per_due apd ON scd.student_charge_due_id = apd.student_charge_due_id
      WHERE s.org_id = $1::uuid
        AND scd.due_date >= $2::date
        AND scd.due_date < ($2::date + INTERVAL '1 month' * $3::int)
      GROUP BY DATE_TRUNC('month', scd.due_date), EXTRACT(YEAR FROM scd.due_date), EXTRACT(MONTH FROM scd.due_date)
      ORDER BY month_year ASC;
    `;

    const rows: any[] = await db.$queryRawUnsafe(sql, tenantOrgId, effectiveStart, horizonMonths);
    return rows.map(r => ({
      ...r,
      scheduled_amount_due: this.roundMoney(r.scheduled_amount_due),
      already_allocated_amount: this.roundMoney(r.already_allocated_amount),
      remaining_scheduled_due: this.roundMoney(r.remaining_scheduled_due)
    }));
  }

  // =========================================================================
  // 4. CURRENT OPERATIONAL BALANCES (Baseline Overview)
  // =========================================================================
  public static async getCurrentOperationalBalances(tenantOrgId: string) {
    const db = this.getClient();

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
      dues_summary AS (
        SELECT
          COUNT(scd.student_charge_due_id)::int as total_dues_count,
          COALESCE(SUM(scd.amount_due), 0)::float8 as total_assessed_dues,
          COALESCE(SUM(COALESCE(apd.total_allocated, 0)), 0)::float8 as total_allocated_to_dues,
          COALESCE(SUM(GREATEST(0, scd.amount_due::numeric - COALESCE(apd.total_allocated, 0))), 0)::float8 as total_outstanding_due,
          COALESCE(SUM(
            CASE 
              WHEN scd.due_date < CURRENT_DATE 
              THEN GREATEST(0, scd.amount_due::numeric - COALESCE(apd.total_allocated, 0))
              ELSE 0 
            END
          ), 0)::float8 as total_overdue_amount,
          COUNT(
            CASE 
              WHEN scd.due_date < CURRENT_DATE 
                AND (scd.amount_due::numeric - COALESCE(apd.total_allocated, 0)) > 0 
              THEN 1 
            END
          )::int as overdue_dues_count
        FROM student_charge_dues scd
        JOIN student_charges sc ON scd.student_charge_id = sc.student_charge_id
        JOIN students s ON sc.student_id = s.student_id
        LEFT JOIN allocated_per_due apd ON scd.student_charge_due_id = apd.student_charge_due_id
        WHERE s.org_id = $1::uuid
      ),
      collections_summary AS (
        SELECT
          COUNT(pt.payment_transaction_id)::int as successful_txns_count,
          COALESCE(SUM(pt.amount), 0)::float8 as total_successful_collections
        FROM payment_transactions pt
        JOIN payment_orders po ON pt.payment_order_id = po.payment_order_id
        JOIN students s ON po.student_id = s.student_id
        WHERE s.org_id = $1::uuid
          AND pt.status = 'success'::payment_transaction_status
      ),
      unallocated_summary AS (
        SELECT
          COUNT(pt.payment_transaction_id)::int as unallocated_count,
          COALESCE(SUM(GREATEST(0, pt.amount::numeric - COALESCE(alloc.total_alloc, 0))), 0)::float8 as unallocated_amount
        FROM payment_transactions pt
        JOIN payment_orders po ON pt.payment_order_id = po.payment_order_id
        JOIN students s ON po.student_id = s.student_id
        LEFT JOIN (
          SELECT payment_transaction_id, COALESCE(SUM(allocated_amount), 0)::numeric as total_alloc
          FROM payment_allocations
          GROUP BY payment_transaction_id
        ) alloc ON pt.payment_transaction_id = alloc.payment_transaction_id
        WHERE s.org_id = $1::uuid
          AND pt.status = 'success'::payment_transaction_status
          AND (pt.amount::numeric - COALESCE(alloc.total_alloc, 0)) > 0.009
      )
      SELECT
        d.total_dues_count,
        d.total_assessed_dues,
        d.total_allocated_to_dues,
        d.total_outstanding_due,
        d.total_overdue_amount,
        d.overdue_dues_count,
        c.successful_txns_count,
        c.total_successful_collections,
        u.unallocated_count,
        u.unallocated_amount
      FROM dues_summary d
      CROSS JOIN collections_summary c
      CROSS JOIN unallocated_summary u;
    `;

    const rows: any[] = await db.$queryRawUnsafe(sql, tenantOrgId);
    const r = rows[0] || {};

    return {
      total_assessed_dues: this.roundMoney(r.total_assessed_dues),
      total_allocated_to_dues: this.roundMoney(r.total_allocated_to_dues),
      total_outstanding_due: this.roundMoney(r.total_outstanding_due),
      total_overdue_amount: this.roundMoney(r.total_overdue_amount),
      overdue_dues_count: r.overdue_dues_count || 0,
      total_successful_collections: this.roundMoney(r.total_successful_collections),
      successful_txns_count: r.successful_txns_count || 0,
      unallocated_amount: this.roundMoney(r.unallocated_amount),
      unallocated_count: r.unallocated_count || 0
    };
  }

  // =========================================================================
  // 5. ACADEMIC YEAR OUTLOOK (Assessment vs Scheduled vs Collected)
  // =========================================================================
  public static async getAcademicYearOutlook(tenantOrgId: string) {
    const db = this.getClient();

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
      charge_dues_agg AS (
        SELECT
          scd.student_charge_id,
          COALESCE(SUM(scd.amount_due), 0)::float8 as total_dues_amount,
          COALESCE(SUM(apd.total_allocated), 0)::float8 as total_paid_amount,
          COALESCE(SUM(GREATEST(0, scd.amount_due::numeric - COALESCE(apd.total_allocated, 0))), 0)::float8 as total_outstanding_amount
        FROM student_charge_dues scd
        LEFT JOIN allocated_per_due apd ON scd.student_charge_due_id = apd.student_charge_due_id
        GROUP BY scd.student_charge_id
      ),
      charges_with_ay AS (
        SELECT 
          sc.student_charge_id,
          sc.student_id,
          sc.amount,
          COALESCE(ayg.academic_year_id, ay_date.academic_year_id) as academic_year_id
        FROM student_charges sc
        JOIN students s ON sc.student_id = s.student_id
        LEFT JOIN student_fee_assignments sfa ON sc.student_fee_assignment_id = sfa.student_fee_assignment_id
        LEFT JOIN student_enrollments se ON sfa.enrollment_id = se.enrollment_id
        LEFT JOIN academic_year_grades ayg ON se.academic_year_grade_id = ayg.academic_year_grade_id
        LEFT JOIN academic_years ay_date ON s.org_id = ay_date.org_id 
          AND sc.charge_date >= ay_date.start_date 
          AND sc.charge_date <= ay_date.end_date
        WHERE s.org_id = $1::uuid
      )
      SELECT
        ay.academic_year_id::text,
        ay.academic_year_name,
        ay.start_date::text,
        ay.end_date::text,
        ay.status::text as status,
        COUNT(DISTINCT cway.student_charge_id)::int as charges_count,
        COUNT(DISTINCT cway.student_id)::int as student_count,
        COALESCE(SUM(cway.amount), 0)::float8 as assessed_amount,
        COALESCE(SUM(cda.total_dues_amount), 0)::float8 as scheduled_dues_amount,
        COALESCE(SUM(cda.total_paid_amount), 0)::float8 as collected_amount,
        COALESCE(SUM(cda.total_outstanding_amount), 0)::float8 as outstanding_amount
      FROM academic_years ay
      LEFT JOIN charges_with_ay cway ON ay.academic_year_id = cway.academic_year_id
      LEFT JOIN charge_dues_agg cda ON cway.student_charge_id = cda.student_charge_id
      WHERE ay.org_id = $1::uuid
      GROUP BY ay.academic_year_id, ay.academic_year_name, ay.start_date, ay.end_date, ay.status
      ORDER BY ay.start_date DESC;
    `;

    const rows: any[] = await db.$queryRawUnsafe(sql, tenantOrgId);
    return rows.map(r => {
      const scheduled = this.roundMoney(r.scheduled_dues_amount);
      const collected = this.roundMoney(r.collected_amount);
      const realizationRate = scheduled > 0 ? this.roundMoney((collected / scheduled) * 100) : 0;
      return {
        ...r,
        assessed_amount: this.roundMoney(r.assessed_amount),
        scheduled_dues_amount: scheduled,
        collected_amount: collected,
        outstanding_amount: this.roundMoney(r.outstanding_amount),
        realization_rate_pct: realizationRate
      };
    });
  }

  // =========================================================================
  // 6. CONCESSION SENSITIVITY BASE DATA
  // =========================================================================
  public static async getConcessionSensitivityBase(tenantOrgId: string) {
    const db = this.getClient();

    const sql = `
      SELECT
        sc.scholarship_type::text as scholarship_type,
        sc.status::text as status,
        COUNT(*)::int as count,
        COUNT(DISTINCT sc.student_id)::int as student_count,
        COALESCE(AVG(sc.concession_percentage), 0)::float8 as avg_percentage,
        COALESCE(MIN(sc.concession_percentage), 0)::float8 as min_percentage,
        COALESCE(MAX(sc.concession_percentage), 0)::float8 as max_percentage
      FROM scholarship_concessions sc
      JOIN students s ON sc.student_id = s.student_id
      WHERE s.org_id = $1::uuid
      GROUP BY sc.scholarship_type, sc.status;
    `;

    const rows: any[] = await db.$queryRawUnsafe(sql, tenantOrgId);

    // Get total assessed fee base for students with concessions
    const baseFeeRes: any[] = await db.$queryRawUnsafe(`
      SELECT
        COALESCE(SUM(sc.amount), 0)::float8 as total_assessed_charge_base,
        COUNT(DISTINCT sc.student_id)::int as assessed_students_count
      FROM student_charges sc
      JOIN students s ON sc.student_id = s.student_id
      WHERE s.org_id = $1::uuid;
    `, tenantOrgId);

    return {
      concessions: rows.map(r => ({
        ...r,
        avg_percentage: this.roundMoney(r.avg_percentage),
        min_percentage: this.roundMoney(r.min_percentage),
        max_percentage: this.roundMoney(r.max_percentage)
      })),
      total_assessed_base: this.roundMoney(baseFeeRes[0]?.total_assessed_charge_base || 0),
      assessed_students_count: baseFeeRes[0]?.assessed_students_count || 0
    };
  }

  // =========================================================================
  // 7. DATA QUALITY & INTEGRITY METRICS
  // =========================================================================
  public static async getDataQualityMetrics(tenantOrgId: string) {
    const db = this.getClient();

    // Check null due dates in dues table
    const nullDueDatesRes: any[] = await db.$queryRawUnsafe(`
      SELECT COUNT(*)::int as count
      FROM student_charge_dues scd
      JOIN student_charges sc ON scd.student_charge_id = sc.student_charge_id
      JOIN students s ON sc.student_id = s.student_id
      WHERE s.org_id = $1::uuid AND scd.due_date IS NULL;
    `, tenantOrgId);

    // Check multi-currency transactions
    const currencyRes: any[] = await db.$queryRawUnsafe(`
      SELECT DISTINCT pt.currency_code 
      FROM payment_transactions pt
      JOIN payment_orders po ON pt.payment_order_id = po.payment_order_id
      JOIN students s ON po.student_id = s.student_id
      WHERE s.org_id = $1::uuid;
    `, tenantOrgId);

    // Check captured unallocated transactions
    const unallocatedRes: any[] = await db.$queryRawUnsafe(`
      SELECT 
        COUNT(pt.payment_transaction_id)::int as count,
        COALESCE(SUM(GREATEST(0, pt.amount::numeric - COALESCE(alloc.total_alloc, 0))), 0)::float8 as amount
      FROM payment_transactions pt
      JOIN payment_orders po ON pt.payment_order_id = po.payment_order_id
      JOIN students s ON po.student_id = s.student_id
      LEFT JOIN (
        SELECT payment_transaction_id, COALESCE(SUM(allocated_amount), 0)::numeric as total_alloc
        FROM payment_allocations
        GROUP BY payment_transaction_id
      ) alloc ON pt.payment_transaction_id = alloc.payment_transaction_id
      WHERE s.org_id = $1::uuid
        AND pt.status = 'success'::payment_transaction_status
        AND (pt.amount::numeric - COALESCE(alloc.total_alloc, 0)) > 0.009;
    `, tenantOrgId);

    // Check historical monthly transaction count (density)
    const historyDensityRes: any[] = await db.$queryRawUnsafe(`
      SELECT COUNT(DISTINCT DATE_TRUNC('month', pt.transaction_date))::int as distinct_months,
             COUNT(*)::int as total_transactions
      FROM payment_transactions pt
      JOIN payment_orders po ON pt.payment_order_id = po.payment_order_id
      JOIN students s ON po.student_id = s.student_id
      WHERE s.org_id = $1::uuid
        AND pt.status = 'success'::payment_transaction_status;
    `, tenantOrgId);

    const distinctMonths = historyDensityRes[0]?.distinct_months || 0;
    const totalTransactions = historyDensityRes[0]?.total_transactions || 0;

    let dataDensityStatus: 'SUFFICIENT_HISTORICAL_DATA' | 'LIMITED_HISTORICAL_DATA' | 'ASSUMPTION_DRIVEN';
    if (distinctMonths >= 6 && totalTransactions >= 100) {
      dataDensityStatus = 'SUFFICIENT_HISTORICAL_DATA';
    } else if (distinctMonths >= 2 || totalTransactions >= 10) {
      dataDensityStatus = 'LIMITED_HISTORICAL_DATA';
    } else {
      dataDensityStatus = 'ASSUMPTION_DRIVEN';
    }

    return {
      null_due_dates_count: nullDueDatesRes[0]?.count || 0,
      distinct_currencies: currencyRes.map(c => c.currency_code).filter(Boolean),
      captured_unallocated_count: unallocatedRes[0]?.count || 0,
      captured_unallocated_amount: this.roundMoney(unallocatedRes[0]?.amount || 0),
      historical_distinct_months: distinctMonths,
      historical_total_transactions: totalTransactions,
      data_density_status: dataDensityStatus,
      historical_forecast_accuracy_available: false,
      accuracy_unavailable_reason: 'Durable forecast snapshot tables are not present in physical schema under Schema freeze.'
    };
  }
}
