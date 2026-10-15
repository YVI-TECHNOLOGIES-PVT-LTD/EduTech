/**
 * EduTrack ERP — Phase 13 Finance Planning Service
 * ==================================================
 * Business logic and deterministic forecasting engine for Financial Planning,
 * Budgeting, and Collections/Receivables Projections.
 * 
 * Invariants:
 * - Read-only operational analysis respecting the schema freeze.
 * - Strict tenant isolation on org_id.
 * - Decimal-safe money arithmetic (roundMoney).
 * - Distinguishes actuals, operational balances, forecasts, and hypothetical assumptions.
 * - Protects against CSV formula injection.
 * - Transparent and explainable deterministic formulas (zero unsupported AI claims).
 */

import { FinancePlanningRepository, MonthlyDueSchedule } from '../repositories/FinancePlanningRepository';

export interface ScenarioInputAssumption {
  realizationRatePct: number;
  monthlyAdjustment?: number;
  label?: string;
}

export interface ScenarioRequestOptions {
  horizonMonths?: number;
  startDate?: string;
  conservativeRate?: number;
  expectedRate?: number;
  optimisticRate?: number;
  monthlyAdjustment?: number;
}

export interface ConcessionSensitivityOptions {
  hypotheticalDeltaPct?: number; // e.g. +5% or -5%
  realizationRatePct?: number;   // e.g. 85%
}

export class FinancePlanningService {
  public static roundMoney(val: number | string | null | undefined): number {
    return FinancePlanningRepository.roundMoney(val);
  }

  /**
   * Sanitizes spreadsheet formula injection prefixes (=, +, -, @, \t, \r)
   */
  public static sanitizeCsvField(val: any): string {
    if (val === null || val === undefined) return '';
    let str = String(val);
    if (/^=/.test(str)) {
      str = "''" + str;
    } else if (/^[+\-@\t\r]/.test(str)) {
      str = "'" + str;
    }
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  private static validateTenant(tenantOrgId: string) {
    if (!tenantOrgId || typeof tenantOrgId !== 'string' || tenantOrgId.trim() === '') {
      throw new Error('Tenant organization ID is mandatory for financial planning.');
    }
  }

  private static sanitizeHorizon(horizonMonths?: number): number {
    if (!horizonMonths || isNaN(Number(horizonMonths)) || !isFinite(Number(horizonMonths))) {
      return 6;
    }
    const h = Math.round(Number(horizonMonths));
    if (h <= 3) return 3;
    if (h <= 6) return 6;
    return 12;
  }

  private static sanitizePercentage(pct: any, defaultPct: number = 85): number {
    if (pct === undefined || pct === null || pct === '') return defaultPct;
    const num = Number(pct);
    if (isNaN(num) || !isFinite(num) || num < 0 || num > 100) {
      throw new Error(`Realization rate percentage must be a finite number between 0 and 100. Received: ${pct}`);
    }
    return this.roundMoney(num);
  }

  // =========================================================================
  // 1. CAPABILITIES & SYSTEM STATE
  // =========================================================================
  public static async getCapabilities(tenantOrgId: string) {
    this.validateTenant(tenantOrgId);
    return FinancePlanningRepository.getPlanningCapabilities(tenantOrgId);
  }

  // =========================================================================
  // 2. PLANNING OVERVIEW (Screen A)
  // =========================================================================
  public static async getOverview(
    tenantOrgId: string,
    options?: { horizonMonths?: number; startDate?: string; realizationRate?: number }
  ) {
    this.validateTenant(tenantOrgId);
    const horizonMonths = this.sanitizeHorizon(options?.horizonMonths);
    const realizationRate = this.sanitizePercentage(options?.realizationRate, 85);
    const startDate = options?.startDate || new Date().toISOString().split('T')[0];

    // Parallel fetch of operational balances, future dues, and data quality
    const [balances, futureDues, dataQuality] = await Promise.all([
      FinancePlanningRepository.getCurrentOperationalBalances(tenantOrgId),
      FinancePlanningRepository.getScheduledDuesSchedule(tenantOrgId, horizonMonths, startDate),
      FinancePlanningRepository.getDataQualityMetrics(tenantOrgId)
    ]);

    const scheduledInHorizonTotal = this.roundMoney(
      futureDues.reduce((acc, d) => acc + d.remaining_scheduled_due, 0)
    );

    const projectedCollections = this.roundMoney(
      scheduledInHorizonTotal * (realizationRate / 100)
    );

    const projectedRemainingReceivables = this.roundMoney(
      Math.max(0, balances.total_outstanding_due - projectedCollections)
    );

    return {
      planning_horizon_months: horizonMonths,
      forecast_start_date: startDate,
      assumptions: {
        baseline_realization_rate_pct: realizationRate,
        model_type: 'DETERMINISTIC_SCHEDULED_DUE_REALIZATION',
        persisted_budget_status: 'UNPERSISTED_SIMULATION'
      },
      metrics: {
        // Actual historical data
        historical_successful_collections: {
          value: balances.total_successful_collections,
          type: 'ACTUAL',
          transaction_count: balances.successful_txns_count
        },
        // Current operational balances
        current_outstanding_receivables: {
          value: balances.total_outstanding_due,
          type: 'OPERATIONAL_BALANCE',
          description: 'Current remaining net dues across all student obligations'
        },
        current_overdue_receivables: {
          value: balances.total_overdue_amount,
          type: 'OPERATIONAL_BALANCE',
          overdue_dues_count: balances.overdue_dues_count
        },
        captured_unallocated_funds: {
          value: balances.unallocated_amount,
          type: 'OPERATIONAL_BALANCE',
          unallocated_txns_count: balances.unallocated_count
        },
        // Forward looking scheduled dues
        scheduled_dues_in_horizon: {
          value: scheduledInHorizonTotal,
          type: 'SCHEDULED_OBLIGATION',
          horizon_months: horizonMonths
        },
        // Projections
        projected_collections: {
          value: projectedCollections,
          type: 'FORECAST',
          formula: `scheduled_in_horizon (${scheduledInHorizonTotal}) * ${realizationRate}%`
        },
        projected_remaining_receivables: {
          value: projectedRemainingReceivables,
          type: 'FORECAST',
          formula: `max(0, current_outstanding (${balances.total_outstanding_due}) - projected_collections (${projectedCollections}))`
        }
      },
      data_quality: {
        status: dataQuality.data_density_status,
        historical_months_density: dataQuality.historical_distinct_months,
        historical_accuracy_available: false,
        schema_limitation: 'Schema freeze prohibits durable budget and forecast persistence.'
      }
    };
  }

  // =========================================================================
  // 3. COLLECTIONS FORECAST (Screen B)
  // =========================================================================
  public static async getCollectionsForecast(
    tenantOrgId: string,
    options?: { horizonMonths?: number; startDate?: string; realizationRate?: number; monthlyAdjustment?: number }
  ) {
    this.validateTenant(tenantOrgId);
    const horizonMonths = this.sanitizeHorizon(options?.horizonMonths);
    const realizationRate = this.sanitizePercentage(options?.realizationRate, 85);
    const monthlyAdjustment = Number(options?.monthlyAdjustment || 0);
    const startDate = options?.startDate || new Date().toISOString().split('T')[0];

    const [futureDues, historicalActuals] = await Promise.all([
      FinancePlanningRepository.getScheduledDuesSchedule(tenantOrgId, horizonMonths, startDate),
      FinancePlanningRepository.getHistoricalMonthlyCollections(tenantOrgId, 6)
    ]);

    const monthlyProjections = futureDues.map((dueMonth) => {
      const baseProjected = this.roundMoney(
        dueMonth.remaining_scheduled_due * (realizationRate / 100)
      );
      const totalProjected = this.roundMoney(
        Math.max(0, baseProjected + monthlyAdjustment)
      );
      const projectedRemaining = this.roundMoney(
        Math.max(0, dueMonth.remaining_scheduled_due - totalProjected)
      );

      return {
        month_year: dueMonth.month_year,
        year: dueMonth.year,
        month: dueMonth.month,
        dues_count: dueMonth.dues_count,
        student_count: dueMonth.student_count,
        scheduled_amount_due: dueMonth.scheduled_amount_due,
        already_allocated: dueMonth.already_allocated_amount,
        remaining_scheduled_due: dueMonth.remaining_scheduled_due,
        applied_realization_rate_pct: realizationRate,
        monthly_adjustment: monthlyAdjustment,
        projected_collections: totalProjected,
        projected_remaining_due: projectedRemaining
      };
    });

    const totalScheduledDue = this.roundMoney(
      monthlyProjections.reduce((acc, m) => acc + m.remaining_scheduled_due, 0)
    );
    const totalProjectedCollections = this.roundMoney(
      monthlyProjections.reduce((acc, m) => acc + m.projected_collections, 0)
    );

    return {
      horizon_months: horizonMonths,
      start_date: startDate,
      assumptions: {
        realization_rate_pct: realizationRate,
        monthly_adjustment: monthlyAdjustment,
        model: 'SCHEDULED_DUE_REALIZATION'
      },
      summary: {
        total_eligible_scheduled_dues: totalScheduledDue,
        total_projected_collections: totalProjectedCollections,
        projected_overall_realization_pct: totalScheduledDue > 0
          ? this.roundMoney((totalProjectedCollections / totalScheduledDue) * 100)
          : 0
      },
      monthly_projections: monthlyProjections,
      historical_actuals: historicalActuals
    };
  }

  // =========================================================================
  // 4. RECEIVABLES FORECAST (Screen C)
  // =========================================================================
  public static async getReceivablesForecast(
    tenantOrgId: string,
    options?: { horizonMonths?: number; startDate?: string; realizationRate?: number }
  ) {
    this.validateTenant(tenantOrgId);
    const horizonMonths = this.sanitizeHorizon(options?.horizonMonths);
    const realizationRate = this.sanitizePercentage(options?.realizationRate, 85);
    const startDate = options?.startDate || new Date().toISOString().split('T')[0];

    const [balances, futureDues] = await Promise.all([
      FinancePlanningRepository.getCurrentOperationalBalances(tenantOrgId),
      FinancePlanningRepository.getScheduledDuesSchedule(tenantOrgId, horizonMonths, startDate)
    ]);

    const scheduledInHorizon = this.roundMoney(
      futureDues.reduce((acc, d) => acc + d.remaining_scheduled_due, 0)
    );

    const projectedRecoveries = this.roundMoney(
      scheduledInHorizon * (realizationRate / 100)
    );

    const projectedEndingReceivables = this.roundMoney(
      Math.max(0, balances.total_outstanding_due - projectedRecoveries)
    );

    return {
      horizon_months: horizonMonths,
      start_date: startDate,
      current_receivables: {
        total_outstanding: balances.total_outstanding_due,
        current_overdue: balances.total_overdue_amount,
        current_not_yet_due: this.roundMoney(
          Math.max(0, balances.total_outstanding_due - balances.total_overdue_amount)
        )
      },
      projected_receivables: {
        scheduled_in_horizon: scheduledInHorizon,
        applied_recovery_rate_pct: realizationRate,
        projected_collections_from_dues: projectedRecoveries,
        projected_ending_outstanding: projectedEndingReceivables,
        projected_net_reduction: this.roundMoney(
          balances.total_outstanding_due - projectedEndingReceivables
        )
      },
      monthly_distribution: futureDues.map((d) => {
        const recovery = this.roundMoney(d.remaining_scheduled_due * (realizationRate / 100));
        return {
          month_year: d.month_year,
          scheduled_remaining_due: d.remaining_scheduled_due,
          projected_collections: recovery,
          projected_uncollected: this.roundMoney(
            Math.max(0, d.remaining_scheduled_due - recovery)
          )
        };
      })
    };
  }

  // =========================================================================
  // 5. SCENARIO PLANNER (Screen D — Conservative / Expected / Optimistic)
  // =========================================================================
  public static async calculateScenarios(
    tenantOrgId: string,
    options?: ScenarioRequestOptions
  ) {
    this.validateTenant(tenantOrgId);
    const horizonMonths = this.sanitizeHorizon(options?.horizonMonths);
    const startDate = options?.startDate || new Date().toISOString().split('T')[0];

    // Sanitize rates
    const conservativeRate = this.sanitizePercentage(options?.conservativeRate, 70);
    const expectedRate = this.sanitizePercentage(options?.expectedRate, 85);
    const optimisticRate = this.sanitizePercentage(options?.optimisticRate, 95);
    const monthlyAdjustment = Number(options?.monthlyAdjustment || 0);

    const [balances, futureDues] = await Promise.all([
      FinancePlanningRepository.getCurrentOperationalBalances(tenantOrgId),
      FinancePlanningRepository.getScheduledDuesSchedule(tenantOrgId, horizonMonths, startDate)
    ]);

    const eligibleScheduledDueTotal = this.roundMoney(
      futureDues.reduce((acc, d) => acc + d.remaining_scheduled_due, 0)
    );

    // Calculate Scenario Projections
    const calculateScenario = (rate: number, label: string) => {
      const monthly = futureDues.map((d) => {
        const base = this.roundMoney(d.remaining_scheduled_due * (rate / 100));
        const collections = this.roundMoney(Math.max(0, base + monthlyAdjustment));
        const remaining = this.roundMoney(Math.max(0, d.remaining_scheduled_due - collections));
        return {
          month_year: d.month_year,
          scheduled_due: d.remaining_scheduled_due,
          projected_collections: collections,
          projected_remaining: remaining
        };
      });

      const totalCollections = this.roundMoney(
        monthly.reduce((acc, m) => acc + m.projected_collections, 0)
      );
      const endingReceivables = this.roundMoney(
        Math.max(0, balances.total_outstanding_due - totalCollections)
      );

      return {
        label,
        assumed_realization_rate_pct: rate,
        total_projected_collections: totalCollections,
        projected_ending_receivables: endingReceivables,
        monthly_breakdown: monthly
      };
    };

    const conservative = calculateScenario(conservativeRate, 'Conservative Scenario');
    const expected = calculateScenario(expectedRate, 'Expected (Baseline) Scenario');
    const optimistic = calculateScenario(optimisticRate, 'Optimistic Scenario');

    // Variance against baseline (expected)
    const conservativeVariance = {
      delta_amount: this.roundMoney(
        conservative.total_projected_collections - expected.total_projected_collections
      ),
      delta_pct: expected.total_projected_collections > 0
        ? this.roundMoney(
            ((conservative.total_projected_collections - expected.total_projected_collections) /
              expected.total_projected_collections) * 100
          )
        : 0
    };

    const optimisticVariance = {
      delta_amount: this.roundMoney(
        optimistic.total_projected_collections - expected.total_projected_collections
      ),
      delta_pct: expected.total_projected_collections > 0
        ? this.roundMoney(
            ((optimistic.total_projected_collections - expected.total_projected_collections) /
              expected.total_projected_collections) * 100
          )
        : 0
    };

    return {
      horizon_months: horizonMonths,
      start_date: startDate,
      calculation_timestamp: new Date().toISOString(),
      durable_persistence: false,
      disclaimer: 'These figures are on-demand simulation scenarios, not persisted or approved institutional budgets.',
      baseline_source_balances: {
        eligible_scheduled_dues: eligibleScheduledDueTotal,
        current_outstanding_receivables: balances.total_outstanding_due
      },
      scenarios: {
        conservative: {
          ...conservative,
          variance_from_baseline: conservativeVariance
        },
        expected: {
          ...expected,
          variance_from_baseline: { delta_amount: 0, delta_pct: 0 }
        },
        optimistic: {
          ...optimistic,
          variance_from_baseline: optimisticVariance
        }
      }
    };
  }

  // =========================================================================
  // 6. ACADEMIC YEAR OUTLOOK (Screen E)
  // =========================================================================
  public static async getAcademicYearOutlook(
    tenantOrgId: string,
    options?: { realizationRate?: number }
  ) {
    this.validateTenant(tenantOrgId);
    const realizationRate = this.sanitizePercentage(options?.realizationRate, 85);

    const outlookRows = await FinancePlanningRepository.getAcademicYearOutlook(tenantOrgId);

    return {
      assumed_realization_rate_pct: realizationRate,
      academic_years: outlookRows.map((ay) => {
        const projectedFutureCollections = this.roundMoney(
          ay.outstanding_amount * (realizationRate / 100)
        );
        const projectedFinalRealization = this.roundMoney(
          ay.collected_amount + projectedFutureCollections
        );
        const projectedFinalRealizationPct = ay.scheduled_dues_amount > 0
          ? this.roundMoney((projectedFinalRealization / ay.scheduled_dues_amount) * 100)
          : 0;

        return {
          ...ay,
          projected_future_collections: projectedFutureCollections,
          projected_final_realization_amount: projectedFinalRealization,
          projected_final_realization_pct: projectedFinalRealizationPct
        };
      })
    };
  }

  // =========================================================================
  // 7. CONCESSION SENSITIVITY ANALYSIS (Screen F)
  // =========================================================================
  public static async calculateConcessionSensitivity(
    tenantOrgId: string,
    options?: ConcessionSensitivityOptions
  ) {
    this.validateTenant(tenantOrgId);
    const deltaPct = Number(options?.hypotheticalDeltaPct || 0);
    const realizationRate = this.sanitizePercentage(options?.realizationRatePct, 85);

    if (isNaN(deltaPct) || !isFinite(deltaPct) || deltaPct < -100 || deltaPct > 100) {
      throw new Error('Hypothetical concession delta percentage must be a finite number between -100 and +100.');
    }

    const baseData = await FinancePlanningRepository.getConcessionSensitivityBase(tenantOrgId);

    // Calculate current average concession across all concessions
    const totalRecords = baseData.concessions.reduce((acc, c) => acc + c.count, 0);
    const weightedAvgPct = totalRecords > 0
      ? this.roundMoney(
          baseData.concessions.reduce((acc, c) => acc + c.avg_percentage * c.count, 0) / totalRecords
        )
      : 0;

    const hypotheticalAvgPct = this.roundMoney(
      Math.max(0, Math.min(100, weightedAvgPct + deltaPct))
    );

    // Estimated concession discount volume on assessed base
    const currentEstimatedDiscount = this.roundMoney(
      baseData.total_assessed_base * (weightedAvgPct / 100)
    );
    const hypotheticalEstimatedDiscount = this.roundMoney(
      baseData.total_assessed_base * (hypotheticalAvgPct / 100)
    );

    const discountDifference = this.roundMoney(
      hypotheticalEstimatedDiscount - currentEstimatedDiscount
    );

    // Estimated net demand change
    const estimatedNetDuesChange = this.roundMoney(-discountDifference);
    const estimatedCashRealizationChange = this.roundMoney(
      estimatedNetDuesChange * (realizationRate / 100)
    );

    return {
      simulation_type: 'HYPOTHETICAL_CONCESSION_SENSITIVITY',
      disclaimer: 'This simulation is strictly analytical and does not modify, approve, or apply actual student concessions.',
      base_metrics: {
        total_assessed_charge_base: baseData.total_assessed_base,
        concession_records_count: totalRecords,
        current_weighted_average_concession_pct: weightedAvgPct
      },
      simulation_parameters: {
        hypothetical_delta_pct: deltaPct,
        hypothetical_average_concession_pct: hypotheticalAvgPct,
        assumed_collection_realization_rate_pct: realizationRate
      },
      impact_estimates: {
        current_estimated_concession_amount: currentEstimatedDiscount,
        hypothetical_estimated_concession_amount: hypotheticalEstimatedDiscount,
        estimated_concession_change_amount: discountDifference,
        estimated_net_scheduled_dues_change: estimatedNetDuesChange,
        estimated_cash_collection_change: estimatedCashRealizationChange
      },
      concession_categories: baseData.concessions
    };
  }

  // =========================================================================
  // 8. DATA QUALITY & INTEGRITY AUDIT (Screen G)
  // =========================================================================
  public static async getDataQuality(tenantOrgId: string) {
    this.validateTenant(tenantOrgId);
    return FinancePlanningRepository.getDataQualityMetrics(tenantOrgId);
  }

  // =========================================================================
  // 9. PLANNING CSV EXPORT (Screen H)
  // =========================================================================
  public static async exportPlanningCSV(
    tenantOrgId: string,
    exportType: 'collections_forecast' | 'scenario_planner' | 'academic_year_outlook',
    options?: any
  ): Promise<string> {
    this.validateTenant(tenantOrgId);

    const timestamp = new Date().toISOString();
    const headers: string[] = [];
    const rows: string[][] = [];

    if (exportType === 'collections_forecast') {
      const forecast = await this.getCollectionsForecast(tenantOrgId, options);
      headers.push(
        'Month-Year',
        'Year',
        'Month',
        'Dues Count',
        'Student Count',
        'Scheduled Amount Due (INR)',
        'Already Allocated (INR)',
        'Remaining Due (INR)',
        'Realization Rate (%)',
        'Projected Collections (INR)',
        'Projected Remaining (INR)',
        'Classification'
      );

      for (const m of forecast.monthly_projections) {
        rows.push([
          this.sanitizeCsvField(m.month_year),
          this.sanitizeCsvField(m.year),
          this.sanitizeCsvField(m.month),
          this.sanitizeCsvField(m.dues_count),
          this.sanitizeCsvField(m.student_count),
          this.sanitizeCsvField(m.scheduled_amount_due),
          this.sanitizeCsvField(m.already_allocated),
          this.sanitizeCsvField(m.remaining_scheduled_due),
          this.sanitizeCsvField(m.applied_realization_rate_pct),
          this.sanitizeCsvField(m.projected_collections),
          this.sanitizeCsvField(m.projected_remaining_due),
          this.sanitizeCsvField('DETERMINISTIC_FORECAST')
        ]);
      }
    } else if (exportType === 'scenario_planner') {
      const scenarios = await this.calculateScenarios(tenantOrgId, options);
      headers.push(
        'Scenario',
        'Assumed Realization Rate (%)',
        'Eligible Scheduled Dues (INR)',
        'Projected Collections (INR)',
        'Projected Ending Receivables (INR)',
        'Variance from Baseline (INR)',
        'Variance (%)',
        'Classification'
      );

      const scList = [
        scenarios.scenarios.conservative,
        scenarios.scenarios.expected,
        scenarios.scenarios.optimistic
      ];

      for (const sc of scList) {
        rows.push([
          this.sanitizeCsvField(sc.label),
          this.sanitizeCsvField(sc.assumed_realization_rate_pct),
          this.sanitizeCsvField(scenarios.baseline_source_balances.eligible_scheduled_dues),
          this.sanitizeCsvField(sc.total_projected_collections),
          this.sanitizeCsvField(sc.projected_ending_receivables),
          this.sanitizeCsvField(sc.variance_from_baseline.delta_amount),
          this.sanitizeCsvField(sc.variance_from_baseline.delta_pct),
          this.sanitizeCsvField('SIMULATION_SCENARIO')
        ]);
      }
    } else {
      const outlook = await this.getAcademicYearOutlook(tenantOrgId, options);
      headers.push(
        'Academic Year',
        'Start Date',
        'End Date',
        'Status',
        'Assessed Amount (INR)',
        'Scheduled Net Dues (INR)',
        'Actual Collected (INR)',
        'Outstanding Dues (INR)',
        'Current Realization (%)',
        'Projected Future Collections (INR)',
        'Projected Final Realization (INR)'
      );

      for (const ay of outlook.academic_years) {
        rows.push([
          this.sanitizeCsvField(ay.academic_year_name),
          this.sanitizeCsvField(ay.start_date),
          this.sanitizeCsvField(ay.end_date),
          this.sanitizeCsvField(ay.status),
          this.sanitizeCsvField(ay.assessed_amount),
          this.sanitizeCsvField(ay.scheduled_dues_amount),
          this.sanitizeCsvField(ay.collected_amount),
          this.sanitizeCsvField(ay.outstanding_amount),
          this.sanitizeCsvField(ay.realization_rate_pct),
          this.sanitizeCsvField(ay.projected_future_collections),
          this.sanitizeCsvField(ay.projected_final_realization_amount)
        ]);
      }
    }

    const disclaimerComment = '# NOTICE: Generated via EduTrack ERP Financial Planning Engine (Simulation Model)';
    const timestampComment = `# Generated At: ${timestamp}`;
    const freezeComment = '# Schema Constraint: Unpersisted calculation scenarios. Not an approved institutional budget.';

    return [
      disclaimerComment,
      timestampComment,
      freezeComment,
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
  }
}
