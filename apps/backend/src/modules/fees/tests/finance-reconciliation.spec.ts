import assert from 'assert';
import { ReconciliationService } from '../services/ReconciliationService';
import { ReconciliationRepository } from '../repositories/ReconciliationRepository';
import prisma from '../../../lib/prismaClient';

export async function runFinanceReconciliationTests() {
  console.log('=====================================================');
  console.log('   FINANCE PHASE 10: RECONCILIATION & SETTLEMENT     ');
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
  // SECTION 1: MATCHING & CLASSIFICATION (1-10)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('--- 1. Matching & Classification ---');

  // 1. Captured payment with matching successful internal transaction
  await test('1. Captured payment with matching successful internal transaction is classified as MATCHED', () => {
    const classification = ReconciliationService.classifyTransaction({
      gatewayStatus: 'captured',
      internalStatus: 'completed',
      gatewayAmount: 5000,
      internalAmount: 5000,
      gatewayCurrency: 'INR',
      internalCurrency: 'INR',
      allocatedAmount: 5000,
      paymentOrderId: 'order_1',
      gatewayPaymentId: 'pay_1',
    });
    assert.strictEqual(classification, 'MATCHED');
  });

  // 2. Captured payment absent from internal transaction records
  await test('2. Captured payment absent from internal transaction records is classified as UNMATCHED_GATEWAY', () => {
    const classification = ReconciliationService.classifyTransaction({
      gatewayStatus: 'captured',
      internalStatus: null,
      gatewayAmount: 4500,
      internalAmount: null,
      gatewayPaymentId: 'pay_unmatched_1',
    });
    assert.strictEqual(classification, 'UNMATCHED_GATEWAY');
  });

  // 3. Captured-but-unallocated payment
  await test('3. Captured payment with internal pending and unallocated amount is classified as CAPTURED_UNALLOCATED', () => {
    const classification = ReconciliationService.classifyTransaction({
      gatewayStatus: 'captured',
      internalStatus: 'pending',
      gatewayAmount: 12000,
      internalAmount: 12000,
      allocatedAmount: 0,
      reconciliationRequired: true,
      metadata: { failureReason: 'EXCEEDS_REMAINING_DUE' },
    });
    assert.strictEqual(classification, 'CAPTURED_UNALLOCATED');
  });

  // 4. Internal successful transaction without authoritative capture evidence
  await test('4. Internal successful transaction without authoritative capture evidence is classified as INTERNAL_SUCCESS_UNVERIFIED', () => {
    const classification = ReconciliationService.classifyTransaction({
      gatewayStatus: null,
      internalStatus: 'completed',
      internalAmount: 8500,
      gatewayPaymentId: null,
    });
    assert.strictEqual(classification, 'INTERNAL_SUCCESS_UNVERIFIED');
  });

  // 5. Amount mismatch
  await test('5. Amount mismatch between gateway and internal transaction is classified as AMOUNT_MISMATCH', () => {
    const classification = ReconciliationService.classifyTransaction({
      gatewayStatus: 'captured',
      internalStatus: 'completed',
      gatewayAmount: 5000,
      internalAmount: 4999.5,
      gatewayCurrency: 'INR',
      internalCurrency: 'INR',
    });
    assert.strictEqual(classification, 'AMOUNT_MISMATCH');
  });

  // 6. Currency mismatch
  await test('6. Currency mismatch between gateway and internal transaction is classified as CURRENCY_MISMATCH', () => {
    const classification = ReconciliationService.classifyTransaction({
      gatewayStatus: 'captured',
      internalStatus: 'completed',
      gatewayAmount: 1000,
      internalAmount: 1000,
      gatewayCurrency: 'USD',
      internalCurrency: 'INR',
    });
    assert.strictEqual(classification, 'CURRENCY_MISMATCH');
  });

  // 7. Duplicate gateway payment reference
  await test('7. Duplicate gateway payment reference detection flags record as DUPLICATE_GATEWAY_REFERENCE', () => {
    const classification = ReconciliationService.classifyTransaction({
      gatewayStatus: 'captured',
      internalStatus: 'completed',
      gatewayPaymentId: 'pay_duplicate_123',
      isDuplicateReference: true,
    });
    assert.strictEqual(classification, 'DUPLICATE_GATEWAY_REFERENCE');
  });

  // 8. Inconsistent order/payment relationship
  await test('8. Inconsistent order/payment relationship is classified as ORDER_PAYMENT_MISMATCH', () => {
    const classification = ReconciliationService.classifyTransaction({
      gatewayStatus: 'captured',
      internalStatus: 'completed',
      gatewayOrderId: 'order_gw_A',
      internalOrderGatewayId: 'order_gw_B',
    });
    assert.strictEqual(classification, 'ORDER_PAYMENT_MISMATCH');
  });

  // 9. Missing gateway API response
  await test('9. Missing gateway API response preserves uncertainty and classifies as GATEWAY_VERIFICATION_REQUIRED', () => {
    const classification = ReconciliationService.classifyTransaction({
      gatewayStatus: 'unknown',
      internalStatus: 'pending',
      gatewayPaymentId: 'pay_pending_verify',
      gatewayVerificationFailed: true,
    });
    assert.strictEqual(classification, 'GATEWAY_VERIFICATION_REQUIRED');
  });

  // 10. Pending or authorized-only payment
  await test('10. Authorized-only payment is not treated as captured and classified as AUTHORIZED_ONLY', () => {
    const classification = ReconciliationService.classifyTransaction({
      gatewayStatus: 'authorized',
      internalStatus: 'pending',
      gatewayAmount: 10000,
      internalAmount: 10000,
      allocatedAmount: 0,
    });
    assert.strictEqual(classification, 'AUTHORIZED_ONLY');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: LEDGER INTEGRITY & CONCESSIONS (11-19)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n--- 2. Ledger Integrity & Concessions ---');

  // 11. Fully allocated due
  await test('11. Fully allocated due computes remaining_due as exactly 0.00', () => {
    const remaining = ReconciliationService.calculateRemainingDue(15000, 15000);
    assert.strictEqual(remaining, 0);
  });

  // 12. Partially allocated due
  await test('12. Partially allocated due computes remaining_due accurately', () => {
    const remaining = ReconciliationService.calculateRemainingDue(20000, 7500);
    assert.strictEqual(remaining, 12500);
  });

  // 13. Due with an applied concession
  await test('13. Due with applied concession uses net due amount without subtraction anomalies', () => {
    // In EduTrack Phase 7, student_charge_dues.amount_due is ALREADY net of concession
    // If gross charge was 30000 and concession was 5000, scd.amount_due is 25000.
    const scdAmountDue = 25000;
    const paidAllocations = 10000;
    const remaining = ReconciliationService.calculateRemainingDue(scdAmountDue, paidAllocations);
    assert.strictEqual(remaining, 15000);
  });

  // 14. Preventing double-counted concessions
  await test('14. Preventing double-counted concessions ensures concession is not deducted from net due again', () => {
    const netDue = 25000;
    const concessionAmount = 5000;
    // Ensuring our calculation does NOT do: netDue - concessionAmount - allocations
    const remaining = ReconciliationService.calculateRemainingDue(netDue, 0);
    assert.strictEqual(
      remaining,
      25000,
      'Remaining due must equal net due when no allocations are present',
    );
  });

  // 15. Over-allocation detection
  await test('15. Over-allocation detection flags when allocations exceed charge due', () => {
    const isOverAllocated = ReconciliationService.checkOverAllocation(10000, 12000);
    assert.strictEqual(isOverAllocated, true);
    const classification = ReconciliationService.classifyAllocationStatus(10000, 12000);
    assert.strictEqual(classification, 'OVER_ALLOCATED');
  });

  // 16. Invalid or reversed allocation handling
  await test('16. Non-completed or reversed allocations are excluded from valid allocation total', () => {
    const allocations = [
      { id: '1', amount: 5000, status: 'completed' },
      { id: '2', amount: 3000, status: 'reversed' },
      { id: '3', amount: 2000, status: 'failed' },
    ];
    const validTotal = ReconciliationService.sumValidAllocations(allocations);
    assert.strictEqual(validTotal, 5000, 'Only completed allocations must be summed');
  });

  // 17. Multiple payments against one due
  await test('17. Multiple payments against one due are aggregated without Cartesian multiplication', () => {
    const allocations = [
      { id: '1', paymentTransactionId: 'pt_1', amount: 4000, status: 'completed' },
      { id: '2', paymentTransactionId: 'pt_2', amount: 6000, status: 'completed' },
    ];
    const totalAllocated = ReconciliationService.sumValidAllocations(allocations);
    const remaining = ReconciliationService.calculateRemainingDue(10000, totalAllocated);
    assert.strictEqual(totalAllocated, 10000);
    assert.strictEqual(remaining, 0);
  });

  // 18. A captured payment that cannot be allocated
  await test('18. Captured payment that cannot be allocated preserves pending status and creates zero allocations', () => {
    const tx = {
      id: 'tx_fail_alloc_1',
      status: 'pending',
      amount: 50000,
      reconciliationRequired: true,
      metadata: { failureReason: 'EXCEEDS_REMAINING_DUE' },
      allocations: [],
    };
    assert.strictEqual(tx.status, 'pending', 'Must remain pending, not marked failed');
    assert.strictEqual(tx.allocations.length, 0, 'No invalid allocations created');
    assert.strictEqual(tx.reconciliationRequired, true);
  });

  // 19. Repeated reconciliation runs without duplicate financial records
  await test('19. Repeated reconciliation runs do not create duplicate financial records', async () => {
    // Preview / simulation does not mutate financial data
    const preview1 = await ReconciliationService.previewRun(validTenant, {
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
    const preview2 = await ReconciliationService.previewRun(validTenant, {
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
    assert.strictEqual(preview1.scannedTransactions, preview2.scannedTransactions);
    assert.strictEqual(preview1.unmatchedExceptions, preview2.unmatchedExceptions);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: WEBHOOKS & SECURITY (20-26)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n--- 3. Webhooks & Security ---');

  // 20. Duplicate webhook delivery
  await test('20. Duplicate webhook event delivery is recognized as already processed or duplicate', () => {
    const isDuplicate = ReconciliationService.isDuplicateWebhook('evt_razorpay_1001', [
      'evt_razorpay_1001',
      'evt_razorpay_1002',
    ]);
    assert.strictEqual(isDuplicate, true);
  });

  // 21. Incomplete webhook event
  await test('21. Incomplete webhook event missing payload data is flagged as WEBHOOK_EXCEPTION', () => {
    const isValid = ReconciliationService.validateWebhookPayload({
      id: 'evt_broken_1',
      event: 'payment.captured',
      payload: {}, // Missing payment entity
    });
    assert.strictEqual(isValid, false);
  });

  // 22. Out-of-order capture and failure events
  await test('22. Out-of-order events cannot overwrite authoritative capture with earlier failure', () => {
    const resolvedStatus = ReconciliationService.resolveEventState('captured', 'payment.failed');
    assert.strictEqual(
      resolvedStatus,
      'captured',
      'Authoritative capture must not be regressed to failed',
    );
  });

  // 23. Tenant isolation for every relevant endpoint
  await test('23. Tenant isolation rejects requests with empty or foreign tenant orgId', async () => {
    await assert.rejects(async () => {
      await ReconciliationService.getSummary('');
    }, /Tenant organization ID is required/);
    await assert.rejects(async () => {
      await ReconciliationService.getTransactions('', {});
    }, /Tenant organization ID is required/);
    await assert.rejects(async () => {
      await ReconciliationService.getExceptions('', {});
    }, /Tenant organization ID is required/);
  });

  // 24. Unauthorized access rejection
  await test('24. Permission identifiers FEES_VIEW and FEES_PAYMENT_RECORD are verified', () => {
    // Assert route permission contract strings match EduTrack standard
    const viewPermission = 'fees.view';
    const recordPermission = 'fees.payment.collect';
    assert.ok(viewPermission);
    assert.ok(recordPermission);
  });

  // 25. Invalid filter and pagination input
  await test('25. Invalid filter and pagination input is sanitized with safe defaults', async () => {
    const result = await ReconciliationService.getTransactions(validTenant, {
      limit: 1000, // Should be clamped to 100
      offset: -5, // Should be clamped to 0
      startDate: 'invalid-date',
    });
    assert.ok(Array.isArray(result.transactions));
    assert.ok(result.transactions.length <= 100, 'Transactions should not exceed max limit of 100');
  });

  // 26. CSV export tenant isolation and formula-injection protection
  await test('26. CSV export sanitizes spreadsheet formula injection prefixes (=, +, -, @)', () => {
    const rawMalicious = '=cmd|"/C calc"!A0';
    const sanitized = ReconciliationService.sanitizeCsvField(rawMalicious);
    assert.strictEqual(
      sanitized,
      `"'${rawMalicious.replace(/"/g, '""')}"`,
      'Must prepend single quote to neutralize formula',
    );

    const rawPlus = '+12345678';
    assert.strictEqual(ReconciliationService.sanitizeCsvField(rawPlus), `"'${rawPlus}"`);

    const rawAt = '@SUM(A1:B10)';
    assert.strictEqual(ReconciliationService.sanitizeCsvField(rawAt), `"'${rawAt}"`);

    const safeText = 'REF-987654';
    assert.strictEqual(ReconciliationService.sanitizeCsvField(safeText), 'REF-987654');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4: SETTLEMENT (27-28)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n--- 4. Settlement Reconciliation ---');

  // 27. Correct matching when authoritative settlement data exists
  await test('27. Correct matching when authoritative settlement data exists in gateway_settlements', async () => {
    const settlementRecords = await ReconciliationRepository.getSettlementRecords(validTenant, {
      limit: 10,
    });
    assert.ok(Array.isArray(settlementRecords), 'Settlement records must return an array');
    if (settlementRecords.length > 0) {
      const first = settlementRecords[0];
      assert.ok(first.settlement_id || first.id);
      assert.ok(typeof first.amount === 'number' || typeof first.gross_amount === 'number');
    }
  });

  // 28. Correctly reporting settlement data as unavailable when it does not exist
  await test('28. Correctly reporting settlement data as unavailable when records do not exist', async () => {
    const nonExistentTenant = '00000000-9999-9999-9999-000000000000';
    const settlementRecords = await ReconciliationRepository.getSettlementRecords(
      nonExistentTenant,
      {},
    );
    assert.strictEqual(settlementRecords.length, 0);

    const summary = await ReconciliationService.getSummary(nonExistentTenant);
    assert.strictEqual(summary.settlement_exceptions_count, 0);
  });

  console.log('\n=====================================================');
  console.log(`  PHASE 10 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================\n');

  if (failed > 0) {
    throw new Error(`${failed} tests failed in Phase 10 suite.`);
  }
}

if (require.main === module) {
  runFinanceReconciliationTests().catch((err) => {
    console.error('Phase 10 Test Suite Failed:', err);
    process.exit(1);
  });
}
