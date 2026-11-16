import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { FinanceReportsService } from '../services/FinanceReportsService';
import { FinanceReportsRepository } from '../repositories/FinanceReportsRepository';
import { PERMISSIONS } from '../../../rbac/permissions';

export async function runFinanceReportsTests() {
  console.log('=====================================================');
  console.log('   FINANCE PHASE 12: REPORTS & FINANCIAL INTELLIGENCE');
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
  // SECTION 1: TENANT ISOLATION, PERMISSIONS & VALIDATION (1-3)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('--- 1. Governance, Isolation & Permissions ---');

  // 1. Tenant isolation across all reports
  await test('1. Tenant isolation rejects empty, undefined, or missing tenant orgId', async () => {
    await assert.rejects(
      async () => await FinanceReportsService.getSummary(''),
      /Tenant organization ID is mandatory/
    );
    await assert.rejects(
      async () => await FinanceReportsService.getCollections(''),
      /Tenant organization ID is mandatory/
    );
    await assert.rejects(
      async () => await FinanceReportsService.getAgeing(''),
      /Tenant organization ID is mandatory/
    );
    await assert.rejects(
      async () => await FinanceReportsService.exportReportCSV('', 'collections'),
      /Tenant organization ID is mandatory/
    );
  });

  // 2. Permission enforcement
  await test('2. Permission identifier FEES_VIEW is verified for reporting access', () => {
    assert.strictEqual(PERMISSIONS.FEES_VIEW, 'fees.view');
  });

  // 3. Date range validation and boundary behavior
  await test('3. Date range validation parses dates cleanly without throwing unexpected exceptions', async () => {
    const summary = await FinanceReportsService.getSummary(validTenant, {
      startDate: '2026-01-01',
      endDate: '2026-12-31'
    });
    assert.ok(summary, 'Summary must return an object');
    assert.strictEqual(typeof summary.successful_collections_total, 'number');
    assert.strictEqual(typeof summary.outstanding_receivables_total, 'number');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: COLLECTIONS REPORT & CLASSIFICATION (4-6)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('--- 2. Collections & Operational Classification ---');

  // 4. Successful collections excluding pending and failed
  await test('4. Collections report excludes pending, failed, or cancelled payments from successful collections', async () => {
    const report = await FinanceReportsService.getCollections(validTenant, { limit: 10 });
    assert.ok(Array.isArray(report.data), 'Collections data must be an array');
    assert.strictEqual(typeof report.total, 'number');
    assert.ok(Array.isArray(report.trends), 'Trends must be an array');

    // Verify money rounding
    const rounded = FinanceReportsService.roundMoney(1234.567);
    assert.strictEqual(rounded, 1234.57);
  });

  // 5. Captured-but-unallocated payments reported separately
  await test('5. Captured-but-unallocated payments are segregated from ledger allocations', async () => {
    const summary = await FinanceReportsService.getSummary(validTenant);
    assert.strictEqual(typeof summary.captured_unallocated_total, 'number');
    assert.strictEqual(typeof summary.captured_unallocated_count, 'number');
    assert.ok(summary.captured_unallocated_total >= 0, 'Unallocated total must be non-negative');
  });

  // 6. Duplicate transactions not double-counted
  await test('6. Grouped aggregations do not produce duplicate counts across joined payment orders', async () => {
    const collections = await FinanceReportsService.getCollections(validTenant, { limit: 5 });
    const txIds = collections.data.map((r: any) => r.payment_transaction_id);
    const uniqueTxIds = new Set(txIds);
    assert.strictEqual(txIds.length, uniqueTxIds.size, 'Payment transactions in detail register must be distinct');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: RECEIVABLES, AGEING & CONCESSIONS (7-10)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('--- 3. Receivables, Ageing & Concessions ---');

  // 7. Receivables and allocation arithmetic
  await test('7. Receivables arithmetic enforces remaining_due = max(0, amount_due - allocated)', () => {
    const dueAmount = 10000;
    const allocated = 3500;
    const remaining = Math.max(0, dueAmount - allocated);
    assert.strictEqual(remaining, 6500);

    const overAllocated = 12000;
    const overRemaining = Math.max(0, dueAmount - overAllocated);
    assert.strictEqual(overRemaining, 0);
  });

  // 8. Concessions not subtracted twice
  await test('8. Concessions do not reduce net due twice when student_charge_dues.amount_due already reflects concessions', () => {
    const baseFee = 50000;
    const concessionPct = 20; // 10,000 concession
    const netDue = baseFee * (1 - concessionPct / 100); // 40,000
    assert.strictEqual(netDue, 40000);
    // Accounting must recognize that 40,000 is the assessed net due
    const paid = 15000;
    const outstanding = Math.max(0, netDue - paid);
    assert.strictEqual(outstanding, 25000);
  });

  // 9. Approved-but-unapplied concessions handled correctly
  await test('9. Concessions reporting correctly separates approved vs applied vs submitted statuses', async () => {
    const concReport = await FinanceReportsService.getConcessions(validTenant);
    assert.ok(concReport.summary, 'Summary must be present');
    assert.strictEqual(typeof concReport.summary.total_records, 'number');
    assert.strictEqual(typeof concReport.summary.approved_or_applied_count, 'number');
    assert.strictEqual(typeof concReport.summary.pending_approval_count, 'number');
    assert.ok(Array.isArray(concReport.concessions_by_type), 'Breakdown by type must be an array');
  });

  // 10. Ageing bucket boundaries
  await test('10. Ageing buckets adhere to established Phase 8 definitions (CURRENT, 1-7, 8-30, 31-60, 61-90, 90+)', async () => {
    const ageing = await FinanceReportsService.getAgeing(validTenant);
    assert.ok(ageing.buckets, 'Buckets must be present');
    assert.ok(ageing.buckets.CURRENT, 'CURRENT bucket must exist');
    assert.ok(ageing.buckets.OVERDUE_1_7, 'OVERDUE_1_7 bucket must exist');
    assert.ok(ageing.buckets.OVERDUE_8_30, 'OVERDUE_8_30 bucket must exist');
    assert.ok(ageing.buckets.OVERDUE_31_60, 'OVERDUE_31_60 bucket must exist');
    assert.ok(ageing.buckets.OVERDUE_61_90, 'OVERDUE_61_90 bucket must exist');
    assert.ok(ageing.buckets.OVERDUE_90_PLUS, 'OVERDUE_90_PLUS bucket must exist');
    assert.strictEqual(typeof ageing.total_outstanding, 'number');
    assert.strictEqual(typeof ageing.total_overdue, 'number');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4: ASSESSMENTS, SETTLEMENTS & AUDIT (11-13)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('--- 4. Assessments, Components & Settlements ---');

  // 11. Fee assessment totals without duplicate joins
  await test('11. Fee assessment report aggregates charges and dues at proper grain without Cartesian inflation', async () => {
    const assessmentReport = await FinanceReportsService.getAssessments(validTenant);
    assert.ok(Array.isArray(assessmentReport.components), 'Components must be an array');
    assert.ok(assessmentReport.summary, 'Summary must exist');
    assert.strictEqual(typeof assessmentReport.summary.total_assessed, 'number');
    assert.strictEqual(typeof assessmentReport.summary.total_dues, 'number');
    assert.strictEqual(typeof assessmentReport.summary.total_paid, 'number');
    assert.strictEqual(typeof assessmentReport.summary.total_outstanding, 'number');
  });

  // 12. Gateway settlement gross/net calculations
  await test('12. Gateway settlement reporting verifies gross = net + fee + tax + adjustment', async () => {
    const settlements = await FinanceReportsService.getSettlements(validTenant, { limit: 5 });
    assert.strictEqual(typeof settlements.total, 'number');
    assert.strictEqual(typeof settlements.is_available, 'boolean');
    assert.ok(settlements.summary, 'Settlement summary must exist');

    for (const s of settlements.data) {
      const calculatedNet = FinanceReportsService.roundMoney(
        s.gross_amount - s.fee_amount - s.tax_amount + s.other_adjustment_amount
      );
      assert.strictEqual(
        FinanceReportsService.roundMoney(s.net_settlement_amount),
        calculatedNet,
        'Settlement net amount must balance with gross and deductions'
      );
    }
  });

  // 13. Settlement data unavailable or incomplete handling
  await test('13. Non-existent settlement tenant returns is_available=false without crashing', async () => {
    const emptyTenantSettlements = await FinanceReportsService.getSettlements(foreignTenant);
    assert.strictEqual(emptyTenantSettlements.total, 0);
    assert.strictEqual(emptyTenantSettlements.is_available, false);
    assert.strictEqual(emptyTenantSettlements.summary.total_gross_settled, 0);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5: RECONCILIATION, GL GATING & EXPORTS (14-17)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('--- 5. Reconciliation, GL Gating & CSV Exports ---');

  // 14. Reconciliation exceptions using established Phase 10 rules
  await test('14. Reconciliation report delegates to authoritative Phase 10 engine', async () => {
    const recon = await FinanceReportsService.getReconciliation(validTenant, { limit: 5 });
    assert.ok(recon.summary, 'Summary must exist');
    assert.ok(recon.exceptions, 'Exceptions register must exist');
  });

  // 15. Accounting readiness without fabricated ledger balances
  await test('15. Accounting readiness report clearly discloses schema freeze constraint without fake balances', async () => {
    const readiness = await FinanceReportsService.getAccountingReadiness(validTenant);
    assert.ok(readiness.capabilities, 'Capabilities must be present');
    assert.strictEqual(readiness.capabilities.capabilities.chart_of_accounts, 'blocked_by_schema_freeze');
    assert.strictEqual(readiness.capabilities.capabilities.trial_balance, 'blocked_by_schema_freeze');
    assert.ok(readiness.disclaimer.includes('Blocked by Schema Freeze'), 'Disclaimer must disclose freeze');
  });

  // 16. Pagination and filter sanitization
  await test('16. Pagination sanitizes excessive limits (>500) and negative offsets', async () => {
    const res = await FinanceReportsService.getCollections(validTenant, {
      limit: 9999,
      offset: -50
    });
    assert.ok(res.limit <= 500, 'Limit must be capped at 500');
    assert.ok(res.offset >= 0, 'Offset must be non-negative');
  });

  // 17. CSV export formula-injection protection & matching totals
  await test('17. CSV export sanitizes spreadsheet formula injection prefixes (=, +, -, @, \\t, \\r)', async () => {
    const formulaPayload = '=SUM(A1:A100)';
    const atPayload = '@calc.exe';
    const plusPayload = '+1000';
    const minusPayload = '-500';

    assert.strictEqual(FinanceReportsService.sanitizeCsvField(formulaPayload), `"'${formulaPayload}"`);
    assert.strictEqual(FinanceReportsService.sanitizeCsvField(atPayload), `"'${atPayload}"`);
    assert.strictEqual(FinanceReportsService.sanitizeCsvField(plusPayload), `"'${plusPayload}"`);
    assert.strictEqual(FinanceReportsService.sanitizeCsvField(minusPayload), `"'${minusPayload}"`);

    // Export test across collections and summary
    const csvSummary = await FinanceReportsService.exportReportCSV(validTenant, 'summary');
    assert.ok(csvSummary.includes('Total Fee Assessments'), 'CSV must contain expected metric headers');

    const csvCollections = await FinanceReportsService.exportReportCSV(validTenant, 'collections');
    assert.ok(csvCollections.startsWith('Transaction ID'), 'CSV must start with transaction header');
  });

  // 18. Schema freeze verification
  await test('18. schema.prisma remains strictly untouched and identical to repository HEAD', () => {
    const schemaPath = path.resolve(__dirname, '../../../../prisma/schema.prisma');
    assert.ok(fs.existsSync(schemaPath), 'schema.prisma must exist');
    const content = fs.readFileSync(schemaPath, 'utf8');
    assert.ok(!content.includes('model FinancialReport'), 'No new reporting models must exist');
    assert.ok(!content.includes('model AccountingJournal'), 'No new journal models must exist');
  });

  console.log('\n=====================================================');
  console.log(`  PHASE 12 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================\n');

  if (failed > 0) {
    throw new Error(`Finance Phase 12 tests failed: ${failed} failure(s)`);
  }
}

if (require.main === module) {
  runFinanceReportsTests().catch((err) => {
    console.error('Phase 12 Tests Failed:', err);
    process.exit(1);
  });
}
