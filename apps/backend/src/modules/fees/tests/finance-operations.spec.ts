/**
 * EduTrack ERP — Phase 15 Finance Operations Test Suite
 * =======================================================
 * Verification suite for Finance Operations Optimization & Executive Insights.
 * 
 * Tests:
 * 1. Governance, Isolation & Permissions
 * 2. Executive Overview & Financial Realization KPIs
 * 3. Collections Performance & Method Breakdowns
 * 4. Receivables & Ageing Bucket Partitions
 * 5. Exception Action Center Deduplication & Severities
 * 6. Data Quality & Schema Freeze Compliance
 * 7. CSV Export & Formula Injection Security
 * 8. Schema Freeze Verification
 */

import assert from 'assert';
import { FinanceOperationsService } from '../services/FinanceOperationsService';
import { FinanceOperationsRepository } from '../repositories/FinanceOperationsRepository';
import { execSync } from 'child_process';
import path from 'path';

async function runTests() {
  console.log('\n=====================================================');
  console.log('   FINANCE PHASE 15: OPERATIONS & EXECUTIVE INSIGHTS');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  function recordPass(testName: string) {
    console.log(`  ✓ ${testName}`);
    passed++;
  }

  function recordFail(testName: string, err: any) {
    console.error(`  ✗ ${testName}`);
    console.error(`    Error: ${err.message || err}`);
    failed++;
  }

  const validTenant = '00000000-0000-0000-0000-000000000001';
  const foreignTenant = '00000000-0000-0000-0000-000000000099';

  // --- 1. Governance, Isolation & Permissions ---
  console.log('--- 1. Governance, Isolation & Permissions ---');

  try {
    const invalidTenants = ['', '   ', null as any, undefined as any];
    for (const inv of invalidTenants) {
      await assert.rejects(
        async () => await FinanceOperationsService.getOverview(inv),
        { code: 'TENANT_NOT_FOUND' }
      );
      await assert.rejects(
        async () => await FinanceOperationsService.getCollections(inv),
        { code: 'TENANT_NOT_FOUND' }
      );
      await assert.rejects(
        async () => await FinanceOperationsService.getReceivables(inv),
        { code: 'TENANT_NOT_FOUND' }
      );
      await assert.rejects(
        async () => await FinanceOperationsService.getExceptions(inv),
        { code: 'TENANT_NOT_FOUND' }
      );
      await assert.rejects(
        async () => await FinanceOperationsService.getDataQuality(inv),
        { code: 'TENANT_NOT_FOUND' }
      );
      await assert.rejects(
        async () => await FinanceOperationsService.exportCSV(inv, 'overview'),
        { code: 'TENANT_NOT_FOUND' }
      );
    }
    recordPass('1. Tenant isolation rejects empty, null, or whitespace orgId on all methods');
  } catch (err: any) {
    recordFail('1. Tenant isolation rejects empty, null, or whitespace orgId on all methods', err);
  }

  try {
    const caps = await FinanceOperationsService.getCapabilities(validTenant);
    assert.strictEqual(caps.operational_insights, true);
    assert.strictEqual(caps.schema_freeze_enforced, true);
    assert.strictEqual(caps.durable_general_ledger, false);
    assert.strictEqual(caps.automated_remediation, false);
    assert.ok(Array.isArray(caps.supported_ageing_buckets));
    assert.strictEqual(caps.supported_ageing_buckets.length, 6);
    recordPass('2. Capabilities truthfully report operational insights enabled and GL posting blocked');
  } catch (err: any) {
    recordFail('2. Capabilities truthfully report operational insights enabled and GL posting blocked', err);
  }

  // --- 2. Executive Overview & Financial Realization KPIs ---
  console.log('--- 2. Executive Overview & Financial Realization KPIs ---');

  try {
    const overview = await FinanceOperationsService.getOverview(validTenant);
    assert.ok(overview.reporting_period);
    assert.ok(typeof overview.collections.total_collected === 'number');
    assert.ok(typeof overview.receivables.total_outstanding === 'number');
    assert.ok(typeof overview.performance.collection_rate_percentage === 'number');
    assert.ok(overview.performance.collection_rate_percentage >= 0 && overview.performance.collection_rate_percentage <= 100);
    assert.ok(overview.exceptions.total_exceptions_count >= 0);
    assert.strictEqual(overview.concessions.exposure_disclosure.includes('duplicate deduction'), true);
    recordPass('3. Executive overview calculates collections, receivables, and realization rate');
  } catch (err: any) {
    recordFail('3. Executive overview calculates collections, receivables, and realization rate', err);
  }

  try {
    const foreignOverview = await FinanceOperationsService.getOverview(foreignTenant);
    assert.strictEqual(foreignOverview.collections.total_collected, 0);
    assert.strictEqual(foreignOverview.collections.successful_count, 0);
    assert.strictEqual(foreignOverview.receivables.total_outstanding, 0);
    assert.strictEqual(foreignOverview.performance.collection_rate_percentage, 0);
    recordPass('4. Foreign tenant query returns zero financial totals without tenant bleed');
  } catch (err: any) {
    recordFail('4. Foreign tenant query returns zero financial totals without tenant bleed', err);
  }

  try {
    assert.strictEqual(FinanceOperationsRepository.roundMoney(123.454), 123.45);
    assert.strictEqual(FinanceOperationsRepository.roundMoney(123.455), 123.46);
    assert.strictEqual(FinanceOperationsRepository.roundMoney(null), 0);
    assert.strictEqual(FinanceOperationsRepository.roundMoney(undefined), 0);
    assert.strictEqual(FinanceOperationsRepository.roundMoney('99.99'), 99.99);
    recordPass('5. Decimal money rounding operates with epsilon precision');
  } catch (err: any) {
    recordFail('5. Decimal money rounding operates with epsilon precision', err);
  }

  // --- 3. Collections Performance & Method Breakdowns ---
  console.log('--- 3. Collections Performance & Method Breakdowns ---');

  try {
    const coll = await FinanceOperationsService.getCollections(validTenant);
    assert.ok(typeof coll.total_successful_amount === 'number');
    assert.ok(typeof coll.total_successful_count === 'number');
    assert.ok(typeof coll.average_transaction_amount === 'number');
    assert.ok(Array.isArray(coll.by_payment_method));
    assert.ok(Array.isArray(coll.collections_over_time));
    assert.ok(Array.isArray(coll.by_fee_component));
    assert.ok(Array.isArray(coll.by_academic_year));

    if (coll.total_successful_count > 0) {
      const expectedAvg = FinanceOperationsRepository.roundMoney(coll.total_successful_amount / coll.total_successful_count);
      assert.strictEqual(coll.average_transaction_amount, expectedAvg);
    }
    recordPass('6. Collections performance groups by method, timeline, and fee component');
  } catch (err: any) {
    recordFail('6. Collections performance groups by method, timeline, and fee component', err);
  }

  try {
    const foreignColl = await FinanceOperationsService.getCollections(foreignTenant);
    assert.strictEqual(foreignColl.total_successful_amount, 0);
    assert.strictEqual(foreignColl.total_successful_count, 0);
    assert.strictEqual(foreignColl.by_payment_method.length, 0);
    recordPass('7. Foreign tenant collections query returns zero records');
  } catch (err: any) {
    recordFail('7. Foreign tenant collections query returns zero records', err);
  }

  // --- 4. Receivables & Ageing Bucket Partitions ---
  console.log('--- 4. Receivables & Ageing Bucket Partitions ---');

  try {
    const rec = await FinanceOperationsService.getReceivables(validTenant);
    assert.ok(typeof rec.total_outstanding === 'number');
    assert.ok(typeof rec.total_overdue === 'number');
    assert.ok(typeof rec.total_current === 'number');
    assert.ok(typeof rec.total_undated === 'number');
    assert.ok(Array.isArray(rec.ageing_buckets));
    assert.strictEqual(rec.ageing_buckets.length, 6);

    const bucketKeys = rec.ageing_buckets.map(b => b.bucket_key);
    assert.deepStrictEqual(bucketKeys, [
      'CURRENT',
      'OVERDUE_1_30',
      'OVERDUE_31_60',
      'OVERDUE_61_90',
      'OVERDUE_90_PLUS',
      'NO_DUE_DATE'
    ]);

    const sumBuckets = rec.ageing_buckets.reduce((acc, b) => acc + b.amount, 0);
    const roundedSum = FinanceOperationsRepository.roundMoney(sumBuckets);
    assert.strictEqual(roundedSum, rec.total_outstanding);
    recordPass('8. Receivables ageing partitions dues into 6 mutually exclusive buckets');
  } catch (err: any) {
    recordFail('8. Receivables ageing partitions dues into 6 mutually exclusive buckets', err);
  }

  try {
    const foreignRec = await FinanceOperationsService.getReceivables(foreignTenant);
    assert.strictEqual(foreignRec.total_outstanding, 0);
    assert.strictEqual(foreignRec.total_overdue, 0);
    assert.strictEqual(foreignRec.total_current, 0);
    recordPass('9. Foreign tenant receivables query returns zero outstanding dues');
  } catch (err: any) {
    recordFail('9. Foreign tenant receivables query returns zero outstanding dues', err);
  }

  // --- 5. Exception Action Center Deduplication & Severities ---
  console.log('--- 5. Exception Action Center Deduplication & Severities ---');

  try {
    const queue = await FinanceOperationsService.getExceptions(validTenant, { page: 1, limit: 10 });
    assert.ok(typeof queue.total === 'number');
    assert.strictEqual(queue.page, 1);
    assert.strictEqual(queue.limit, 10);
    assert.ok(Array.isArray(queue.items));

    for (const item of queue.items) {
      assert.ok(item.id.includes('_'));
      assert.ok(['payments', 'settlements', 'webhooks', 'concessions'].includes(item.source_module));
      assert.ok(['HIGH', 'MEDIUM', 'LOW'].includes(item.severity));
      assert.ok(item.drilldown_url.startsWith('/app/finance/'));
    }
    recordPass('10. Exception action center aggregates multi-source exceptions with stable IDs');
  } catch (err: any) {
    recordFail('10. Exception action center aggregates multi-source exceptions with stable IDs', err);
  }

  try {
    const clampedQ1 = await FinanceOperationsService.getExceptions(validTenant, { page: -5, limit: 500 });
    assert.strictEqual(clampedQ1.page, 1);
    assert.strictEqual(clampedQ1.limit, 100);

    const clampedQ2 = await FinanceOperationsService.getExceptions(validTenant, { page: 0, limit: 0 });
    assert.strictEqual(clampedQ2.page, 1);
    assert.strictEqual(clampedQ2.limit, 25);
    recordPass('11. Pagination bounds clamping enforces limit [1, 100] and page >= 1');
  } catch (err: any) {
    recordFail('11. Pagination bounds clamping enforces limit [1, 100] and page >= 1', err);
  }

  // --- 6. Data Quality & Schema Freeze Compliance ---
  console.log('--- 6. Data Quality & Schema Freeze Compliance ---');

  try {
    const dq = await FinanceOperationsService.getDataQuality(validTenant);
    assert.ok(dq.overall_status === 'PARTIAL' || dq.overall_status === 'NEEDS_ATTENTION');
    assert.ok(typeof dq.readiness_score === 'number');
    assert.strictEqual(dq.evaluated_controls_count, 7);
    assert.strictEqual(dq.controls.length, 7);

    const glControl = dq.controls.find(c => c.dimension === 'ACCOUNTING_INTEGRATION_READINESS');
    assert.ok(glControl);
    assert.strictEqual(glControl.status, 'BLOCKED');
    assert.strictEqual(glControl.details.includes('Schema freeze limitation'), true);
    recordPass('12. Data quality report verifies 7 control dimensions and discloses GL schema limitation');
  } catch (err: any) {
    recordFail('12. Data quality report verifies 7 control dimensions and discloses GL schema limitation', err);
  }

  // --- 7. CSV Export & Formula Injection Security ---
  console.log('--- 7. CSV Export & Formula Injection Security ---');

  try {
    assert.strictEqual(FinanceOperationsService.sanitizeCsvField('=1+1'), "''=1+1");
    assert.strictEqual(FinanceOperationsService.sanitizeCsvField('  =1+1'), "''  =1+1");
    assert.strictEqual(FinanceOperationsService.sanitizeCsvField('+447123'), "'+447123");
    assert.strictEqual(FinanceOperationsService.sanitizeCsvField('  +447123'), "'  +447123");
    assert.strictEqual(FinanceOperationsService.sanitizeCsvField('-100'), "'-100");
    assert.strictEqual(FinanceOperationsService.sanitizeCsvField('@SUM(A1:A10)'), "'@SUM(A1:A10)");
    assert.strictEqual(FinanceOperationsService.sanitizeCsvField('  @SUM(A1:A10)'), "'  @SUM(A1:A10)");
    assert.strictEqual(FinanceOperationsService.sanitizeCsvField('\tCMD'), "'\tCMD");
    assert.strictEqual(FinanceOperationsService.sanitizeCsvField('\rPAY'), "'\rPAY");
    assert.strictEqual(FinanceOperationsService.sanitizeCsvField('Normal Text'), 'Normal Text');
    assert.strictEqual(FinanceOperationsService.sanitizeCsvField('Contains, Comma'), '"Contains, Comma"');
    recordPass('13. CSV formula injection sanitizer handles whitespace-preceded dangerous prefixes');
  } catch (err: any) {
    recordFail('13. CSV formula injection sanitizer handles whitespace-preceded dangerous prefixes', err);
  }

  try {
    const overviewCsv = await FinanceOperationsService.exportCSV(validTenant, 'overview');
    assert.ok(overviewCsv.includes('# EduTrack ERP — Finance Operations & Executive Insights Export'));
    assert.ok(overviewCsv.includes('# Export Type: OVERVIEW'));
    assert.ok(overviewCsv.includes('Total Successful Collections'));
    assert.ok(overviewCsv.includes('Total Outstanding Balance'));

    const collectionsCsv = await FinanceOperationsService.exportCSV(validTenant, 'collections');
    assert.ok(collectionsCsv.includes('# Export Type: COLLECTIONS'));

    const receivablesCsv = await FinanceOperationsService.exportCSV(validTenant, 'receivables');
    assert.ok(receivablesCsv.includes('# Export Type: RECEIVABLES'));
    assert.ok(receivablesCsv.includes('Ageing Bucket Label'));

    const exceptionsCsv = await FinanceOperationsService.exportCSV(validTenant, 'exceptions');
    assert.ok(exceptionsCsv.includes('# Export Type: EXCEPTIONS'));
    assert.ok(exceptionsCsv.includes('Exception ID'));
    recordPass('14. CSV export produces compliance headers and valid tabular rows for all 4 types');
  } catch (err: any) {
    recordFail('14. CSV export produces compliance headers and valid tabular rows for all 4 types', err);
  }

  // --- 8. Schema Freeze Verification ---
  console.log('--- 8. Schema Freeze Verification ---');

  try {
    const diff = execSync('git diff apps/backend/prisma/schema.prisma', {
      cwd: process.cwd(),
      encoding: 'utf-8'
    });
    assert.strictEqual(diff.trim(), '', 'schema.prisma has been modified!');
    recordPass('15. schema.prisma remains strictly untouched and identical to repository HEAD');
  } catch (err: any) {
    recordFail('15. schema.prisma remains strictly untouched and identical to repository HEAD', err);
  }

  console.log('\n=====================================================');
  console.log(`  PHASE 15 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
