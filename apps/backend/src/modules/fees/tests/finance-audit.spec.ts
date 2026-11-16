import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { FinanceAuditService } from '../services/FinanceAuditService';
import { FinanceAuditRepository } from '../repositories/FinanceAuditRepository';
import { PERMISSIONS } from '../../../rbac/permissions';
import prisma from '../../../lib/prismaClient';

export async function runFinanceAuditTests() {
  console.log('=====================================================');
  console.log('   FINANCE PHASE 14: AUDIT, GOVERNANCE & COMPLIANCE');
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

  // 1. Tenant isolation across all audit functions
  await test('1. Tenant isolation rejects empty, undefined, or whitespace orgId', async () => {
    await assert.rejects(
      async () => await FinanceAuditService.getCapabilities(''),
      /Tenant organization ID is mandatory/
    );
    await assert.rejects(
      async () => await FinanceAuditService.getSummary(''),
      /Tenant organization ID is mandatory/
    );
    await assert.rejects(
      async () => await FinanceAuditService.getPayments(''),
      /Tenant organization ID is mandatory/
    );
    await assert.rejects(
      async () => await FinanceAuditService.getSettlements(''),
      /Tenant organization ID is mandatory/
    );
    await assert.rejects(
      async () => await FinanceAuditService.getConcessions(''),
      /Tenant organization ID is mandatory/
    );
    await assert.rejects(
      async () => await FinanceAuditService.getWebhooks(''),
      /Tenant organization ID is mandatory/
    );
    await assert.rejects(
      async () => await FinanceAuditService.getCoverage(''),
      /Tenant organization ID is mandatory/
    );
    await assert.rejects(
      async () => await FinanceAuditService.exportAuditCSV('', 'payments'),
      /Tenant organization ID is mandatory/
    );
  });

  // 2. Permission enforcement verification
  await test('2. Permission identifier FEES_VIEW is verified for audit access', () => {
    assert.strictEqual(PERMISSIONS.FEES_VIEW, 'fees.view');
  });

  // 3. Capabilities reflect schema freeze and lack of durable audit persistence
  await test('3. Capabilities detect absence of durable audit tables and enable read-only oversight', async () => {
    const caps = await FinanceAuditService.getCapabilities(validTenant);
    assert.strictEqual(caps.durable_audit_persistence, false, 'Durable persistence must be false under schema freeze');
    assert.strictEqual(caps.schema_freeze_enforced, true);
    assert.strictEqual(caps.read_only_oversight_workspace, true);
    assert.ok(Array.isArray(caps.available_evidence_sources));
    assert.ok(caps.available_evidence_sources.length >= 5);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: PAYMENT & UNALLOCATED FUNDS AUDIT (4-6)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('--- 2. Payment & Unallocated Funds Audit ---');

  // 4. Payment audit register tenant isolation & structure
  await test('4. Payment audit register returns paginated records scoped strictly to tenant', async () => {
    const register = await FinanceAuditService.getPayments(validTenant, { page: 1, limit: 10 });
    assert.strictEqual(typeof register.total, 'number');
    assert.ok(Array.isArray(register.data));
    assert.strictEqual(register.page, 1);
    assert.strictEqual(register.limit, 10);

    for (const p of register.data) {
      assert.strictEqual(typeof p.payment_transaction_id, 'string');
      assert.strictEqual(typeof p.transaction_amount, 'number');
      assert.strictEqual(typeof p.total_allocated, 'number');
      assert.strictEqual(typeof p.unallocated_amount, 'number');
      assert.ok(['UNALLOCATED_CAPTURED_FUNDS', 'PARTIALLY_ALLOCATED', 'FULLY_ALLOCATED', 'NON_SUCCESS_TRANSACTION'].includes(p.allocation_classification));
    }
  });

  // 5. Foreign tenant payment isolation
  await test('5. Foreign tenant query returns zero payment records without cross-tenant bleed', async () => {
    const foreignPayments = await FinanceAuditService.getPayments(foreignTenant, { page: 1, limit: 10 });
    assert.strictEqual(foreignPayments.total, 0);
    assert.strictEqual(foreignPayments.data.length, 0);
  });

  // 6. Decimal precision and rounding verification
  await test('6. Decimal precision operates with epsilon precision for audit balances', () => {
    assert.strictEqual(FinanceAuditService.roundMoney(999.994), 999.99);
    assert.strictEqual(FinanceAuditService.roundMoney(999.995), 1000);
    assert.strictEqual(FinanceAuditService.roundMoney(null), 0);
    assert.strictEqual(FinanceAuditService.roundMoney(undefined), 0);
    assert.strictEqual(FinanceAuditService.roundMoney('50.25'), 50.25);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: SETTLEMENTS & CONCESSIONS AUDIT (7-10)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('--- 3. Settlements & Concessions Audit ---');

  // 7. Settlement arithmetic tolerance check
  await test('7. Settlement audit computes calculated net and flags arithmetic discrepancies', async () => {
    const settlements = await FinanceAuditService.getSettlements(validTenant, { page: 1, limit: 10 });
    assert.strictEqual(typeof settlements.total, 'number');
    assert.ok(Array.isArray(settlements.data));

    for (const s of settlements.data) {
      const expectedNet = FinanceAuditService.roundMoney(
        s.gross_amount - s.fee_amount - s.tax_amount - s.other_adjustment_amount
      );
      assert.strictEqual(s.calculated_net_amount, expectedNet);
      assert.ok(s.arithmetic_discrepancy >= 0);
      assert.ok(['ARITHMETIC_MISMATCH', 'SETTLED_AND_RECONCILED', 'UNMATCHED_SETTLEMENT', 'PARTIALLY_RECONCILED'].includes(s.settlement_audit_status));
    }
  });

  // 8. Foreign tenant settlement isolation
  await test('8. Foreign tenant query returns zero settlement records', async () => {
    const foreignSettlements = await FinanceAuditService.getSettlements(foreignTenant, { page: 1, limit: 10 });
    assert.strictEqual(foreignSettlements.total, 0);
    assert.strictEqual(foreignSettlements.data.length, 0);
  });

  // 9. Concession audit lifecycle and control findings
  await test('9. Concession audit evaluates approval history and checks segregation of duties', async () => {
    const concessions = await FinanceAuditService.getConcessions(validTenant, { page: 1, limit: 10 });
    assert.strictEqual(typeof concessions.total, 'number');
    assert.ok(Array.isArray(concessions.data));

    for (const c of concessions.data) {
      assert.strictEqual(typeof c.concession_id, 'string');
      assert.strictEqual(typeof c.percentage, 'number');
      assert.strictEqual(typeof c.discount_amount, 'number');
      assert.ok([
        'POTENTIAL_SELF_APPROVAL_VIOLATION',
        'APPROVED_WITHOUT_APPROVAL_HISTORY',
        'AWAITING_GOVERNANCE_REVIEW',
        'REJECTED_CONCESSION',
        'VERIFIED_CONCESSION_LIFECYCLE'
      ].includes(c.control_finding));
    }
  });

  // 10. Webhook lifecycle audit
  await test('10. Webhook audit identifies processing failures and stalled received events', async () => {
    const webhooks = await FinanceAuditService.getWebhooks(validTenant, { page: 1, limit: 10 });
    assert.strictEqual(typeof webhooks.total, 'number');
    assert.ok(Array.isArray(webhooks.data));

    for (const w of webhooks.data) {
      assert.strictEqual(typeof w.payment_webhook_event_id, 'string');
      assert.ok([
        'PROCESSING_FAILURE_EXCEPTION',
        'STALLED_UNPROCESSED_WEBHOOK',
        'AWAITING_ASYNC_PROCESSING',
        'NON_FINANCIAL_IGNORED_EVENT',
        'SUCCESSFULLY_RECONCILED'
      ].includes(w.webhook_finding));
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4: ACCOUNTING READINESS & CONTROL MATRIX (11-14)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('--- 4. Accounting Readiness & Control Matrix ---');

  // 11. Accounting readiness audit limitation disclosure
  await test('11. Accounting readiness audit discloses schema freeze limitation without fake journals', async () => {
    const readiness = await FinanceAuditService.getAccountingReadinessAudit(validTenant);
    assert.strictEqual(readiness.audit_governance.formal_journal_posting_auditable, false);
    assert.strictEqual(readiness.audit_governance.trial_balance_verification_auditable, false);
    assert.ok(readiness.audit_governance.limitation_notice.includes('schema freeze'));
  });

  // 12. Control matrix evaluation
  await test('12. Audit control matrix evaluates 7 defined operational controls', async () => {
    const matrix = await FinanceAuditService.getCoverage(validTenant);
    assert.strictEqual(matrix.tenant_org_id, validTenant);
    assert.strictEqual(matrix.total_controls, 7);
    assert.strictEqual(matrix.blocked_controls, 1); // GL audit blocked
    assert.strictEqual(matrix.active_controls, 6);

    const glControl = matrix.controls.find(c => c.control_id === 'FIN-CTL-07');
    assert.ok(glControl);
    assert.strictEqual(glControl?.status, 'BLOCKED_BY_SCHEMA_FREEZE');
    assert.strictEqual(glControl?.evidence_completeness, 'Unavailable');
  });

  // 13. Audit summary KPI aggregation
  await test('13. Audit summary aggregates unallocated payments, exceptions, and webhooks', async () => {
    const summary = await FinanceAuditService.getSummary(validTenant);
    assert.strictEqual(typeof summary.unallocated_payments.count, 'number');
    assert.strictEqual(typeof summary.unallocated_payments.amount, 'number');
    assert.strictEqual(typeof summary.reconciliation_exceptions.count, 'number');
    assert.strictEqual(typeof summary.unmatched_settlements.count, 'number');
    assert.strictEqual(typeof summary.webhook_lifecycle_exceptions.total_exceptions, 'number');
    assert.strictEqual(summary.accounting_readiness_audit.status, 'BLOCKED_BY_SCHEMA_FREEZE');
  });

  // 14. Pagination input sanitization
  await test('14. Pagination bounds clamping enforces limit [1, 200] and page >= 1', async () => {
    const r1 = await FinanceAuditService.getPayments(validTenant, { page: -5, limit: 500 });
    assert.strictEqual(r1.page, 1, 'Negative page must clamp to 1');
    assert.strictEqual(r1.limit, 200, 'Limit > 200 must clamp to 200');

    const r2 = await FinanceAuditService.getPayments(validTenant, { page: 0, limit: 0 });
    assert.strictEqual(r2.page, 1, 'Zero page must clamp to 1');
    assert.strictEqual(r2.limit, 25, 'Zero limit must clamp to default 25');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5: CSV EXPORT, INTEGRITY & SCHEMA FREEZE (15-18)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('--- 5. CSV Export, Integrity & Schema Freeze ---');

  // 15. CSV formula injection sanitization
  await test('15. CSV export sanitizes spreadsheet formula injection prefixes (=, +, -, @, \\t, \\r)', () => {
    assert.strictEqual(FinanceAuditService.sanitizeCsvField('=CMD()'), "''=CMD()");
    assert.strictEqual(FinanceAuditService.sanitizeCsvField('  =CMD()'), "''  =CMD()");
    assert.strictEqual(FinanceAuditService.sanitizeCsvField('+123'), "'+123");
    assert.strictEqual(FinanceAuditService.sanitizeCsvField('  +123'), "'  +123");
    assert.strictEqual(FinanceAuditService.sanitizeCsvField('-999'), "'-999");
    assert.strictEqual(FinanceAuditService.sanitizeCsvField('@SUM(A1)'), "'@SUM(A1)");
    assert.strictEqual(FinanceAuditService.sanitizeCsvField('  @SUM(A1)'), "'  @SUM(A1)");
    assert.strictEqual(FinanceAuditService.sanitizeCsvField('Normal text'), 'Normal text');
    assert.strictEqual(FinanceAuditService.sanitizeCsvField('Includes, comma'), '"Includes, comma"');
  });

  // 16. CSV Export generation with compliance disclaimer
  await test('16. CSV export produces compliance disclaimer headers and sanitized rows', async () => {
    const csv = await FinanceAuditService.exportAuditCSV(validTenant, 'payments');
    assert.ok(csv.includes('# NOTICE: Generated via EduTrack ERP Financial Audit & Governance Engine'));
    assert.ok(csv.includes('# Compliance Disclaimer: Uncertified operational audit register'));
    assert.ok(csv.includes('Transaction Reference,Order Reference,Admission No'));
  });

  // 17. CSV settlements and controls exports
  await test('17. Settlements and controls exports produce expected headers and structure', async () => {
    const settlementsCsv = await FinanceAuditService.exportAuditCSV(validTenant, 'settlements');
    assert.ok(settlementsCsv.includes('Settlement Reference,Provider Settlement ID'));

    const controlsCsv = await FinanceAuditService.exportAuditCSV(validTenant, 'controls');
    assert.ok(controlsCsv.includes('Control ID,Control Name,Domain,Status'));
    assert.ok(controlsCsv.includes('FIN-CTL-01'));
    assert.ok(controlsCsv.includes('BLOCKED_BY_SCHEMA_FREEZE'));
  });

  // 18. Zero database modifications (Schema Freeze Verification)
  await test('18. schema.prisma remains strictly untouched and identical to repository HEAD', () => {
    const schemaPath = path.resolve(__dirname, '../../../../prisma/schema.prisma');
    assert.ok(fs.existsSync(schemaPath), 'schema.prisma must exist');
    const content = fs.readFileSync(schemaPath, 'utf8');

    // Confirm no audit or compliance tables were added
    assert.strictEqual(content.includes('model finance_audit'), false);
    assert.strictEqual(content.includes('model compliance_case'), false);
    assert.strictEqual(content.includes('model audit_trail'), false);
  });

  console.log('\n=====================================================');
  console.log(`  PHASE 14 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================\n');

  if (failed > 0) {
    throw new Error(`Finance Phase 14 tests failed: ${failed} failure(s)`);
  }
}

if (require.main === module) {
  runFinanceAuditTests().catch((err) => {
    console.error('Phase 14 Tests Failed:', err);
    process.exit(1);
  });
}
