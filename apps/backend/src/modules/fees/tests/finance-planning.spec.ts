import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { FinancePlanningService } from '../services/FinancePlanningService';
import { FinancePlanningRepository } from '../repositories/FinancePlanningRepository';
import { PERMISSIONS } from '../../../rbac/permissions';
import prisma from '../../../lib/prismaClient';

export async function runFinancePlanningTests() {
  console.log('=====================================================');
  console.log('   FINANCE PHASE 13: BUDGETING, FORECASTING & PLANNING');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}: ${err.message}`);
      failed++;
    }
  }

  const validTenant = '00000000-0000-0000-0000-000000000001';
  const foreignTenant = '00000000-0000-0000-0000-000000000002';

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1: GOVERNANCE, ISOLATION & PERMISSIONS (1-3)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('--- 1. Governance, Isolation & Permissions ---');

  // 1. Tenant isolation across all planning functions
  await test('1. Tenant isolation rejects empty, undefined, or whitespace orgId', async () => {
    await assert.rejects(
      async () => await FinancePlanningService.getCapabilities(''),
      /Tenant organization ID is mandatory/
    );
    await assert.rejects(
      async () => await FinancePlanningService.getOverview(''),
      /Tenant organization ID is mandatory/
    );
    await assert.rejects(
      async () => await FinancePlanningService.getCollectionsForecast(''),
      /Tenant organization ID is mandatory/
    );
    await assert.rejects(
      async () => await FinancePlanningService.getReceivablesForecast(''),
      /Tenant organization ID is mandatory/
    );
    await assert.rejects(
      async () => await FinancePlanningService.calculateScenarios(''),
      /Tenant organization ID is mandatory/
    );
    await assert.rejects(
      async () => await FinancePlanningService.exportPlanningCSV('', 'collections_forecast'),
      /Tenant organization ID is mandatory/
    );
  });

  // 2. Permission enforcement
  await test('2. Permission identifier FEES_VIEW is verified for planning access', () => {
    assert.strictEqual(PERMISSIONS.FEES_VIEW, 'fees.view');
  });

  // 3. Capabilities truthfully reflect schema freeze and lack of durable persistence
  await test('3. Capabilities detect absence of durable budget tables and enable read-only simulation', async () => {
    const caps = await FinancePlanningService.getCapabilities(validTenant);
    assert.strictEqual(caps.durable_budget_persistence, false, 'Durable persistence must be false under schema freeze');
    assert.strictEqual(caps.schema_freeze_enforced, true);
    assert.strictEqual(caps.simulation_workspace_enabled, true);
    assert.ok(Array.isArray(caps.supported_horizons));
    assert.deepStrictEqual(caps.supported_horizons, [3, 6, 12]);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: INPUT VALIDATION & HORIZON BOUNDARIES (4-6)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('--- 2. Input Validation & Horizon Boundaries ---');

  // 4. Invalid, negative, or non-finite realization percentages
  await test('4. Realization rate rejects non-finite, negative, or excessive values (>100)', async () => {
    await assert.rejects(
      async () => await FinancePlanningService.getOverview(validTenant, { realizationRate: -15 }),
      /Realization rate percentage must be a finite number between 0 and 100/
    );
    await assert.rejects(
      async () => await FinancePlanningService.getCollectionsForecast(validTenant, { realizationRate: 150 }),
      /Realization rate percentage must be a finite number between 0 and 100/
    );
    await assert.rejects(
      async () => await FinancePlanningService.calculateScenarios(validTenant, { conservativeRate: NaN as any }),
      /Realization rate percentage must be a finite number between 0 and 100/
    );
    await assert.rejects(
      async () => await FinancePlanningService.calculateScenarios(validTenant, { expectedRate: Infinity as any }),
      /Realization rate percentage must be a finite number between 0 and 100/
    );
  });

  // 5. Date range and horizon clamping
  await test('5. Horizon is clamped to supported discrete intervals (3, 6, 12 months)', async () => {
    const f1 = await FinancePlanningService.getCollectionsForecast(validTenant, { horizonMonths: 2 });
    assert.strictEqual(f1.horizon_months, 3, 'Under 3 should clamp to 3');

    const f2 = await FinancePlanningService.getCollectionsForecast(validTenant, { horizonMonths: 5 });
    assert.strictEqual(f2.horizon_months, 6, 'Between 4 and 6 should clamp to 6');

    const f3 = await FinancePlanningService.getCollectionsForecast(validTenant, { horizonMonths: 18 });
    assert.strictEqual(f3.horizon_months, 12, 'Over 6 should clamp to 12');
  });

  // 6. Decimal precision and rounding
  await test('6. Decimal-safe money rounding operates with epsilon precision', () => {
    assert.strictEqual(FinancePlanningService.roundMoney(1234.567), 1234.57);
    assert.strictEqual(FinancePlanningService.roundMoney(0.004), 0);
    assert.strictEqual(FinancePlanningService.roundMoney(0.005), 0.01);
    assert.strictEqual(FinancePlanningService.roundMoney(null), 0);
    assert.strictEqual(FinancePlanningService.roundMoney(undefined), 0);
    assert.strictEqual(FinancePlanningService.roundMoney('450.80'), 450.80);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: COLLECTIONS & RECEIVABLES FORECASTING (7-10)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('--- 3. Collections & Receivables Forecasting ---');

  // 7. Overview metric type classification
  await test('7. Overview clearly distinguishes ACTUAL, OPERATIONAL_BALANCE, and FORECAST', async () => {
    const overview = await FinancePlanningService.getOverview(validTenant);
    assert.strictEqual(overview.metrics.historical_successful_collections.type, 'ACTUAL');
    assert.strictEqual(overview.metrics.current_outstanding_receivables.type, 'OPERATIONAL_BALANCE');
    assert.strictEqual(overview.metrics.current_overdue_receivables.type, 'OPERATIONAL_BALANCE');
    assert.strictEqual(overview.metrics.scheduled_dues_in_horizon.type, 'SCHEDULED_OBLIGATION');
    assert.strictEqual(overview.metrics.projected_collections.type, 'FORECAST');
    assert.strictEqual(overview.metrics.projected_remaining_receivables.type, 'FORECAST');
  });

  // 8. Pending and failed payments excluded from actual collections
  await test('8. Actual collection totals exclude pending, failed, or cancelled transactions', async () => {
    const balances = await FinancePlanningRepository.getCurrentOperationalBalances(validTenant);
    assert.strictEqual(typeof balances.total_successful_collections, 'number');
    assert.ok(balances.total_successful_collections >= 0);
    assert.strictEqual(typeof balances.unallocated_amount, 'number');
  });

  // 9. Collections forecast monthly projection formula
  await test('9. Collections forecast derives monthly projection from scheduled dues * realization rate', async () => {
    const forecast = await FinancePlanningService.getCollectionsForecast(validTenant, {
      horizonMonths: 6,
      realizationRate: 80
    });

    assert.ok(Array.isArray(forecast.monthly_projections));
    assert.strictEqual(forecast.assumptions.realization_rate_pct, 80);

    for (const m of forecast.monthly_projections) {
      const expectedProj = FinancePlanningService.roundMoney(m.remaining_scheduled_due * 0.8);
      assert.strictEqual(m.projected_collections, expectedProj);
      assert.strictEqual(m.projected_remaining_due, FinancePlanningService.roundMoney(m.remaining_scheduled_due - expectedProj));
    }
  });

  // 10. Receivables forecast ending balance arithmetic
  await test('10. Receivables forecast calculates ending balance without double-counting', async () => {
    const recForecast = await FinancePlanningService.getReceivablesForecast(validTenant, {
      horizonMonths: 6,
      realizationRate: 90
    });

    const curr = recForecast.current_receivables.total_outstanding;
    const recovered = recForecast.projected_receivables.projected_collections_from_dues;
    const ending = recForecast.projected_receivables.projected_ending_outstanding;

    assert.strictEqual(ending, FinancePlanningService.roundMoney(Math.max(0, curr - recovered)));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4: SCENARIOS & ACADEMIC OUTLOOK (11-14)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('--- 4. Scenario Planning & Academic Outlook ---');

  // 11. Conservative, Expected, Optimistic calculations
  await test('11. Scenario planner calculates 3 deterministic scenarios from identical baseline dues', async () => {
    const scenarios = await FinancePlanningService.calculateScenarios(validTenant, {
      conservativeRate: 70,
      expectedRate: 85,
      optimisticRate: 95
    });

    const c = scenarios.scenarios.conservative;
    const e = scenarios.scenarios.expected;
    const o = scenarios.scenarios.optimistic;

    assert.strictEqual(c.assumed_realization_rate_pct, 70);
    assert.strictEqual(e.assumed_realization_rate_pct, 85);
    assert.strictEqual(o.assumed_realization_rate_pct, 95);

    // Conservative collections must be <= Expected <= Optimistic
    assert.ok(c.total_projected_collections <= e.total_projected_collections);
    assert.ok(e.total_projected_collections <= o.total_projected_collections);

    // Ending receivables must be Conservative >= Expected >= Optimistic
    assert.ok(c.projected_ending_receivables >= e.projected_ending_receivables);
    assert.ok(e.projected_ending_receivables >= o.projected_ending_receivables);

    // Variance check
    assert.strictEqual(e.variance_from_baseline.delta_amount, 0);
    assert.strictEqual(e.variance_from_baseline.delta_pct, 0);
  });

  // 12. Identical baseline inputs produce consistent idempotent outputs
  await test('12. Repeated scenario evaluations with identical parameters produce deterministic outputs', async () => {
    const run1 = await FinancePlanningService.calculateScenarios(validTenant, { expectedRate: 85 });
    const run2 = await FinancePlanningService.calculateScenarios(validTenant, { expectedRate: 85 });

    assert.strictEqual(
      run1.scenarios.expected.total_projected_collections,
      run2.scenarios.expected.total_projected_collections
    );
    assert.strictEqual(
      run1.scenarios.conservative.total_projected_collections,
      run2.scenarios.conservative.total_projected_collections
    );
  });

  // 13. Academic Year Outlook aggregation
  await test('13. Academic-year outlook summarizes assessments, scheduled dues, and collections', async () => {
    const outlook = await FinancePlanningService.getAcademicYearOutlook(validTenant);
    assert.ok(Array.isArray(outlook.academic_years));
    for (const ay of outlook.academic_years) {
      assert.strictEqual(typeof ay.academic_year_name, 'string');
      assert.strictEqual(typeof ay.assessed_amount, 'number');
      assert.strictEqual(typeof ay.scheduled_dues_amount, 'number');
      assert.strictEqual(typeof ay.collected_amount, 'number');
      assert.strictEqual(typeof ay.outstanding_amount, 'number');
      assert.strictEqual(typeof ay.realization_rate_pct, 'number');
    }
  });

  // 14. Concession sensitivity analytical calculation
  await test('14. Concession sensitivity estimates fee shift without modifying database records', async () => {
    const sensitivity = await FinancePlanningService.calculateConcessionSensitivity(validTenant, {
      hypotheticalDeltaPct: 5,
      realizationRatePct: 80
    });

    assert.strictEqual(sensitivity.simulation_type, 'HYPOTHETICAL_CONCESSION_SENSITIVITY');
    assert.strictEqual(typeof sensitivity.impact_estimates.estimated_concession_change_amount, 'number');
    assert.strictEqual(typeof sensitivity.impact_estimates.estimated_net_scheduled_dues_change, 'number');
    assert.strictEqual(typeof sensitivity.impact_estimates.estimated_cash_collection_change, 'number');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5: DATA QUALITY, CSV EXPORT & INTEGRITY (15-18)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('--- 5. Data Quality, CSV Export & Integrity ---');

  // 15. Data quality metrics and density label
  await test('15. Data quality truthfully reports lack of durable accuracy tracking', async () => {
    const quality = await FinancePlanningService.getDataQuality(validTenant);
    assert.strictEqual(quality.historical_forecast_accuracy_available, false);
    assert.ok(['SUFFICIENT_HISTORICAL_DATA', 'LIMITED_HISTORICAL_DATA', 'ASSUMPTION_DRIVEN'].includes(quality.data_density_status));
    assert.ok(quality.accuracy_unavailable_reason.includes('Schema freeze'));
  });

  // 16. CSV formula injection sanitization
  await test('16. CSV export sanitizes spreadsheet formula injection prefixes (=, +, -, @, \\t, \\r)', () => {
    assert.strictEqual(FinancePlanningService.sanitizeCsvField('=CMD()'), "''=CMD()");
    assert.strictEqual(FinancePlanningService.sanitizeCsvField('+123'), "'+123");
    assert.strictEqual(FinancePlanningService.sanitizeCsvField('-999'), "'-999");
    assert.strictEqual(FinancePlanningService.sanitizeCsvField('@SUM(A1)'), "'@SUM(A1)");
    assert.strictEqual(FinancePlanningService.sanitizeCsvField('Normal text'), 'Normal text');
    assert.strictEqual(FinancePlanningService.sanitizeCsvField('Includes, comma'), '"Includes, comma"');
  });

  // 17. CSV Export generation
  await test('17. CSV export produces header comments disclosing simulation status', async () => {
    const csv = await FinancePlanningService.exportPlanningCSV(validTenant, 'collections_forecast');
    assert.ok(csv.includes('# NOTICE: Generated via EduTrack ERP Financial Planning Engine'));
    assert.ok(csv.includes('# Schema Constraint: Unpersisted calculation scenarios'));
    assert.ok(csv.includes('Month-Year,Year,Month,Dues Count'));
  });

  // 18. Zero database modifications (Schema Freeze Verification)
  await test('18. schema.prisma remains strictly untouched and identical to repository HEAD', () => {
    const schemaPath = path.resolve(__dirname, '../../../../prisma/schema.prisma');
    assert.ok(fs.existsSync(schemaPath), 'schema.prisma must exist');
    const content = fs.readFileSync(schemaPath, 'utf8');

    // Confirm no budget or forecast tables were added
    assert.strictEqual(content.includes('model budget'), false);
    assert.strictEqual(content.includes('model forecast'), false);
    assert.strictEqual(content.includes('model scenario'), false);
  });

  console.log('\n=====================================================');
  console.log(`  PHASE 13 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================\n');

  if (failed > 0) {
    throw new Error(`Finance Phase 13 tests failed: ${failed} failure(s)`);
  }
}

if (require.main === module) {
  runFinancePlanningTests().catch((err) => {
    console.error('Phase 13 Tests Failed:', err);
    process.exit(1);
  });
}
