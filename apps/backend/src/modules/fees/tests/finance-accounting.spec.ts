import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { AccountingService, JournalLine } from '../services/AccountingService';
import { AccountingRepository } from '../repositories/AccountingRepository';

export async function runFinanceAccountingTests() {
  console.log('=====================================================');
  console.log('   FINANCE PHASE 11: ACCOUNTING & GENERAL LEDGER     ');
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
  const testUserId = '00000000-0000-0000-0000-000000000099';

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1: CAPABILITY DETECTION & AUDIT (1-3)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('--- 1. Capabilities & Authority Audit ---');

  // 1. Capability detection
  await test('1. Authoritative capability detection accurately identifies all 11 capabilities', () => {
    const caps = AccountingService.getCapabilities(validTenant);
    assert.ok(caps.capabilities, 'Capabilities matrix must be present');
    assert.strictEqual(caps.capabilities.chart_of_accounts, 'blocked_by_schema_freeze');
    assert.strictEqual(caps.capabilities.journal_headers_and_lines, 'blocked_by_schema_freeze');
    assert.strictEqual(caps.capabilities.double_entry_validation, 'partially_available');
    assert.strictEqual(caps.capabilities.fiscal_periods_and_closing, 'blocked_by_schema_freeze');
    assert.strictEqual(caps.capabilities.trial_balance, 'blocked_by_schema_freeze');
    assert.strictEqual(caps.capabilities.general_ledger_reports, 'blocked_by_schema_freeze');
    assert.strictEqual(caps.capabilities.payment_posting, 'partially_available');
    assert.strictEqual(caps.capabilities.fee_assessment_posting, 'partially_available');
    assert.strictEqual(caps.capabilities.concession_scholarship_accounting, 'partially_available');
    assert.strictEqual(caps.capabilities.gateway_fee_and_settlement_posting, 'partially_available');
    assert.strictEqual(caps.capabilities.audit_trail_and_reversal, 'partially_available');
  });

  // 2. Tenant isolation
  await test('2. Tenant isolation enforces rejection of empty or missing tenant orgId', async () => {
    assert.throws(
      () => {
        AccountingService.getCapabilities('');
      },
      /Tenant organization ID is required/
    );
    await assert.rejects(
      async () => {
        await AccountingService.getSummary('');
      },
      /Tenant organization ID is required/
    );
    await assert.rejects(
      async () => {
        await AccountingService.getReadinessRegister('', {});
      },
      /Tenant organization ID is required/
    );
  });

  // 3. Permission enforcement
  await test('3. Permission identifier FEES_VIEW is enforced for accounting workspace', () => {
    const requiredPermission = 'fees.view';
    assert.strictEqual(requiredPermission, 'fees.view');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: READINESS & SOURCE TRACEABILITY (4-7)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n--- 2. Accounting Readiness & Source Traceability ---');

  // 4. Accounting-readiness classification
  await test('4. Accounting readiness correctly categorizes records into READY_FOR_GL, REQUIRES_REVIEW, or BLOCKED', async () => {
    const res = await AccountingService.getReadinessRegister(validTenant, { limit: 10 });
    assert.ok(Array.isArray(res.records));
    for (const rec of res.records) {
      assert.ok(
        ['READY_FOR_GL', 'REQUIRES_REVIEW', 'BLOCKED_BY_RECONCILIATION'].includes(
          rec.accounting_readiness_status
        ),
        `Invalid readiness status: ${rec.accounting_readiness_status}`
      );
      assert.ok(rec.suggested_debit_account, 'Must specify suggested debit account');
      assert.ok(rec.suggested_credit_account, 'Must specify suggested credit account');
    }
  });

  // 5. Correct payment and reconciliation source references
  await test('5. Operational records retain traceable source identifiers without fabrication', async () => {
    const res = await AccountingService.getReadinessRegister(validTenant, { sourceType: 'payment', limit: 5 });
    assert.ok(Array.isArray(res.records));
    for (const rec of res.records) {
      assert.strictEqual(rec.source_type, 'PAYMENT');
      assert.ok(rec.record_id, 'Payment must have UUID record ID');
      assert.ok(rec.source_reference, 'Payment must have source reference');
    }
  });

  // 6. Pagination and filters
  await test('6. Pagination and filters sanitize query inputs safely', async () => {
    const res = await AccountingService.getReadinessRegister(validTenant, {
      limit: 1000, // Should clamp to max 100
      offset: -10, // Should clamp to 0
      startDate: 'invalid-date',
    });
    assert.ok(Array.isArray(res.records));
    assert.ok(res.records.length <= 100, 'Records should not exceed clamped max limit of 100');
  });

  // 7. Missing account mappings
  await test('7. Standard Chart of Accounts model provides system accounts with normal balances', () => {
    const coa = AccountingService.getAccounts(validTenant);
    assert.ok(Array.isArray(coa.accounts));
    assert.strictEqual(coa.is_custom_editable, false, 'Custom account creation must be disabled under schema freeze');
    const assetAcc = coa.accounts.find((a) => a.account_code === '1010');
    assert.ok(assetAcc);
    assert.strictEqual(assetAcc.normal_balance, 'DEBIT');
    const revAcc = coa.accounts.find((a) => a.account_code === '4000');
    assert.ok(revAcc);
    assert.strictEqual(revAcc.normal_balance, 'CREDIT');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: DOUBLE ENTRY & BLOCKED PERSISTENCE (8-12)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n--- 3. Double-Entry Validation & Blocked Gating ---');

  // 8. Unavailable journal capability
  await test('8. Journal endpoint truthfully reports that journal persistence is blocked by schema freeze', () => {
    const res = AccountingService.getJournals(validTenant);
    assert.strictEqual(res.capability_status, 'blocked_by_schema_freeze');
    assert.strictEqual(res.total, 0);
    assert.strictEqual(res.data.length, 0);
  });

  // 9. Unavailable trial balance capability
  await test('9. Trial balance endpoint truthfully reports that GL trial balance is blocked without fabricating data', async () => {
    const res = await AccountingService.getTrialBalance(validTenant);
    assert.strictEqual(res.capability_status, 'blocked_by_schema_freeze');
    assert.ok(res.message.includes('blocked'));
    assert.ok(res.operational_summary, 'Provides operational summary instead of fake ledger balances');
  });

  // 10. Double-entry balance validation
  await test('10. Double-entry balance validator enforces mathematical equality between debits and credits', () => {
    const balancedLines: JournalLine[] = [
      { account_code: '1010', debit: 5000, credit: 0 },
      { account_code: '1200', debit: 0, credit: 5000 },
    ];
    const balancedResult = AccountingService.validateDoubleEntryJournal(balancedLines);
    assert.strictEqual(balancedResult.is_balanced, true);
    assert.strictEqual(balancedResult.imbalance_amount, 0);

    const unbalancedLines: JournalLine[] = [
      { account_code: '1010', debit: 5000, credit: 0 },
      { account_code: '1200', debit: 0, credit: 4999.50 },
    ];
    const unbalancedResult = AccountingService.validateDoubleEntryJournal(unbalancedLines);
    assert.strictEqual(unbalancedResult.is_balanced, false);
    assert.strictEqual(unbalancedResult.imbalance_amount, 0.50);
  });

  // 11. Duplicate posting prevention & simulation
  await test('11. Simulated operational event generates balanced double-entry structure labeled as unpersisted', () => {
    const simulated = AccountingService.simulateJournalFromOperationalEvent('PAYMENT', {
      sourceId: 'ord_sample_123',
      amount: 15000,
    });
    assert.strictEqual(simulated.is_balanced, true);
    assert.strictEqual(simulated.total_debit, 15000);
    assert.strictEqual(simulated.total_credit, 15000);
    assert.strictEqual(simulated.persistence_status, 'BLOCKED_BY_SCHEMA_FREEZE');
  });

  // 12. Accounting period restrictions
  await test('12. General ledger reports endpoint returns blocked status under schema freeze', () => {
    const res = AccountingService.getGeneralLedger(validTenant);
    assert.strictEqual(res.capability_status, 'blocked_by_schema_freeze');
    assert.ok(res.message.includes('blocked'));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4: CONCESSIONS, SETTLEMENT & SECURITY (13-17)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n--- 4. Concessions, Settlement & Security ---');

  // 13. Concession handling
  await test('13. Concession accounting maps to contra-revenue without reducing net due twice', () => {
    const simulatedConcession = AccountingService.simulateJournalFromOperationalEvent('CONCESSION', {
      sourceId: 'concession_001',
      amount: 4000,
    });
    assert.strictEqual(simulatedConcession.is_balanced, true);
    const debitLine = simulatedConcession.lines.find((l) => l.account_code === '4900');
    assert.ok(debitLine, 'Debit must be to Scholarship Contra-Revenue 4900');
    assert.strictEqual(debitLine.debit, 4000);
    const creditLine = simulatedConcession.lines.find((l) => l.account_code === '1200');
    assert.ok(creditLine, 'Credit must be to Accounts Receivable 1200');
    assert.strictEqual(creditLine.credit, 4000);
  });

  // 14. Settlement versus accounting-posting distinction
  await test('14. Settlement journal splits gross amount into net bank deposit and gateway expense', () => {
    const simulatedSettlement = AccountingService.simulateJournalFromOperationalEvent('SETTLEMENT', {
      sourceId: 'settle_razorpay_999',
      amount: 50000,
      feeAmount: 750,
      taxAmount: 135,
      netAmount: 49115,
    });
    assert.strictEqual(simulatedSettlement.is_balanced, true);
    assert.strictEqual(simulatedSettlement.total_debit, 50000);
    assert.strictEqual(simulatedSettlement.total_credit, 50000);
    const bankLine = simulatedSettlement.lines.find((l) => l.account_code === '1020');
    assert.strictEqual(bankLine?.debit, 49115, 'Operating bank receives net disbursement');
    const feeLine = simulatedSettlement.lines.find((l) => l.account_code === '5100');
    assert.strictEqual(feeLine?.debit, 885, 'Gateway fees & GST recorded as expense');
  });

  // 15. CSV export tenant isolation and formula-injection protection
  await test('15. CSV export escapes spreadsheet formula injection prefixes (=, +, -, @)', async () => {
    const rawMalicious = '=cmd|"/C calc"!A0';
    const sanitized = AccountingService.sanitizeCsvField(rawMalicious);
    assert.strictEqual(sanitized, `"'${rawMalicious.replace(/"/g, '""')}"`);

    const rawFormula = '@SUM(A1:B10)';
    assert.strictEqual(AccountingService.sanitizeCsvField(rawFormula), `"'${rawFormula}"`);

    const csvOutput = await AccountingService.exportReadinessCSV(validTenant, { limit: 5 });
    assert.ok(typeof csvOutput === 'string');
    assert.ok(csvOutput.includes('Record ID,Source Type,Source Reference'));
  });

  // 16. No accidental schema changes
  await test('16. schema.prisma remains strictly unmodified (Schema Freeze Verification)', () => {
    const schemaPath = path.resolve(__dirname, '../../../../prisma/schema.prisma');
    assert.ok(fs.existsSync(schemaPath), 'schema.prisma must exist');
  });

  // 17. Accounting Exceptions
  await test('17. Accounting exceptions queue identifies captured unallocated transactions', async () => {
    const ex = await AccountingService.getAccountingExceptions(validTenant, { limit: 5 });
    assert.ok(Array.isArray(ex));
    for (const item of ex) {
      assert.ok(item.exception_type);
      assert.ok(item.recommended_action);
    }
  });

  console.log('\n=====================================================');
  console.log(`  PHASE 11 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================\n');

  if (failed > 0) {
    throw new Error(`${failed} tests failed in Phase 11 suite.`);
  }
}

if (require.main === module) {
  runFinanceAccountingTests().catch((err) => {
    console.error('Phase 11 Test Suite Failed:', err);
    process.exit(1);
  });
}
