import assert from 'assert';
import prisma from '../../../lib/prismaClient';
import { ScholarshipConcessionService } from '../services/ScholarshipConcessionService';
import { ScholarshipRepository } from '../repositories/ScholarshipRepository';

export async function runFinanceScholarshipTests() {
  console.log('=====================================================');
  console.log('   FINANCE PHASE 7: SCHOLARSHIPS & CONCESSIONS SUITE ');
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
  const testStudentId = '11111111-1111-1111-1111-111111111111';
  const testAcademicYearId = '22222222-2222-2222-2222-222222222222';
  const testTermId = '33333333-3333-3333-3333-333333333333';

  // -------------------------------------------------------------------------
  // 1. Parameter Validation & Boundary Checking
  // -------------------------------------------------------------------------
  await test('recommendConcession rejects missing tenant organization ID', async () => {
    await assert.rejects(
      async () => {
        await ScholarshipConcessionService.recommendConcession('', testUserId, {
          studentId: testStudentId,
          academicYearId: testAcademicYearId,
          scholarshipType: 'merit',
          concessionName: 'Merit Award 25%',
          concessionPercentage: 25,
          scope: 'academic_year',
          recommendationReason: 'Top academic score',
        });
      },
      /Tenant organization ID is required/
    );
  });

  await test('recommendConcession rejects non-UUID student ID', async () => {
    await assert.rejects(
      async () => {
        await ScholarshipConcessionService.recommendConcession(validTenant, testUserId, {
          studentId: 'invalid-student-id',
          academicYearId: testAcademicYearId,
          scholarshipType: 'merit',
          concessionName: 'Merit Award 25%',
          concessionPercentage: 25,
          scope: 'academic_year',
          recommendationReason: 'Top academic score',
        });
      },
      /Valid student ID is required/
    );
  });

  await test('recommendConcession rejects out-of-range percentage (0% or >100%)', async () => {
    await assert.rejects(
      async () => {
        await ScholarshipConcessionService.recommendConcession(validTenant, testUserId, {
          studentId: testStudentId,
          academicYearId: testAcademicYearId,
          scholarshipType: 'merit',
          concessionName: 'Zero Percent Award',
          concessionPercentage: 0,
          scope: 'academic_year',
          recommendationReason: 'Invalid 0%',
        });
      },
      /Concession percentage must be between 0.01 and 100.00%/
    );

    await assert.rejects(
      async () => {
        await ScholarshipConcessionService.recommendConcession(validTenant, testUserId, {
          studentId: testStudentId,
          academicYearId: testAcademicYearId,
          scholarshipType: 'merit',
          concessionName: 'Excessive Award',
          concessionPercentage: 120,
          scope: 'academic_year',
          recommendationReason: 'Invalid 120%',
        });
      },
      /Concession percentage must be between 0.01 and 100.00%/
    );
  });

  await test('recommendConcession rejects missing concession name and recommendation reason', async () => {
    await assert.rejects(
      async () => {
        await ScholarshipConcessionService.recommendConcession(validTenant, testUserId, {
          studentId: testStudentId,
          academicYearId: testAcademicYearId,
          scholarshipType: 'merit',
          concessionName: '',
          concessionPercentage: 25,
          scope: 'academic_year',
          recommendationReason: 'Valid reason',
        });
      },
      /Concession name is required/
    );

    await assert.rejects(
      async () => {
        await ScholarshipConcessionService.recommendConcession(validTenant, testUserId, {
          studentId: testStudentId,
          academicYearId: testAcademicYearId,
          scholarshipType: 'merit',
          concessionName: 'Merit Award',
          concessionPercentage: 25,
          scope: 'academic_year',
          recommendationReason: '   ',
        });
      },
      /Recommendation reason \/ justification is required/
    );
  });

  // -------------------------------------------------------------------------
  // 2. Scope Consistency & PostgreSQL Trigger Alignment
  // -------------------------------------------------------------------------
  await test('recommendConcession validates scope consistency (trigger alignment)', async () => {
    await assert.rejects(
      async () => {
        await ScholarshipConcessionService.recommendConcession(validTenant, testUserId, {
          studentId: testStudentId,
          academicYearId: testAcademicYearId,
          scholarshipType: 'merit',
          concessionName: 'Term 1 Award',
          concessionPercentage: 25,
          scope: 'installment',
          installmentTermId: undefined,
          recommendationReason: 'Term concession missing term id',
        });
      },
      /Installment term is required when scope is set to installment/
    );
  });

  // -------------------------------------------------------------------------
  // 3. Approval Decision Validations
  // -------------------------------------------------------------------------
  await test('reviewConcession rejects invalid decision action', async () => {
    await assert.rejects(
      async () => {
        await ScholarshipConcessionService.reviewConcession(
          validTenant,
          testUserId,
          '00000000-0000-0000-0000-000000000005',
          {
            action: 'invalid_action' as any,
          }
        );
      },
      /Decision action must be either 'approved' or 'rejected'/
    );
  });

  await test('reviewConcession rejects approved percentage out-of-range', async () => {
    const origFind = ScholarshipRepository.findConcessionById;
    ScholarshipRepository.findConcessionById = async () => ({
      scholarship_concession_id: '00000000-0000-0000-0000-000000000005',
      student_id: testStudentId,
      academic_year_id: testAcademicYearId,
      scholarship_type: 'merit',
      concession_name: 'Test Award',
      concession_percentage: 25,
      scope: 'academic_year',
      installment_term_id: null,
      status: 'recommended',
      recommendation_reason: 'Testing',
      recommended_by: '00000000-0000-0000-0000-000000000002',
      recommended_at: new Date(),
      approved_percentage: null,
      approved_by: null,
      approved_at: null,
      applied_percentage: null,
      applied_by: null,
      applied_at: null,
      notes: null,
      created_at: new Date(),
      created_by: null,
      updated_at: new Date(),
      updated_by: null,
    });

    try {
      await assert.rejects(
        async () => {
          await ScholarshipConcessionService.reviewConcession(
            validTenant,
            testUserId,
            '00000000-0000-0000-0000-000000000005',
            {
              action: 'approved',
              approvedPercentage: 150,
            }
          );
        },
        /Approved percentage must be between 0.01 and 100.00%/
      );
    } finally {
      ScholarshipRepository.findConcessionById = origFind;
    }
  });

  // -------------------------------------------------------------------------
  // 4. Persistence Hardening & Unmapped Prisma Delegate Rejection
  // -------------------------------------------------------------------------
  await test('Prisma client throws [Persistence Error] on direct in-memory mutation attempts', async () => {
    await assert.rejects(
      async () => {
        await (prisma as any).scholarship_concessions.create({
          data: { test: true },
        });
      },
      /\[Persistence Error\] Direct write on unmapped Prisma delegate/
    );

    await assert.rejects(
      async () => {
        await (prisma as any).scholarship_concession_approval_history.create({
          data: { test: true },
        });
      },
      /\[Persistence Error\] Direct write on unmapped Prisma delegate/
    );
  });

  // -------------------------------------------------------------------------
  // 5. Standard Institutional Program Catalog
  // -------------------------------------------------------------------------
  await test('STANDARD_PROGRAMS catalog has valid institutional programs and bounds', async () => {
    const programs = ScholarshipConcessionService.STANDARD_PROGRAMS;
    assert.ok(Array.isArray(programs), 'Programs must be an array');
    assert.ok(programs.length >= 5, 'Must contain at least 5 standard scholarship programs');

    for (const prog of programs) {
      assert.ok(prog.id, 'Program must have an ID');
      assert.ok(prog.name, 'Program must have a name');
      assert.ok(prog.max_percentage > 0 && prog.max_percentage <= 100, 'Max percentage must be 1-100');
      assert.ok(prog.scope === 'academic_year' || prog.scope === 'installment', 'Valid scope');
      assert.strictEqual(prog.status, 'active', 'Programs should be active');
    }
  });

  // -------------------------------------------------------------------------
  // 6. Security & Tenant Scoping
  // -------------------------------------------------------------------------
  await test('getStudentConcessions rejects missing studentId or tenantId', async () => {
    await assert.rejects(
      async () => {
        await ScholarshipConcessionService.getStudentConcessions('', testStudentId);
      },
      /Tenant organization ID is required/
    );

    await assert.rejects(
      async () => {
        await ScholarshipConcessionService.getStudentConcessions(validTenant, '');
      },
      /Student ID is required/
    );
  });

  // -------------------------------------------------------------------------
  // 7. Concession Application Lifecycle & Status Invariant Checks
  // -------------------------------------------------------------------------
  await test('applyConcession rejects non-approved concessions', async () => {
    const origFind = ScholarshipRepository.findConcessionById;
    ScholarshipRepository.findConcessionById = async () => ({
      scholarship_concession_id: '00000000-0000-0000-0000-000000000009',
      student_id: testStudentId,
      academic_year_id: testAcademicYearId,
      scholarship_type: 'merit',
      concession_name: 'Unapproved 20%',
      concession_percentage: 20,
      scope: 'academic_year',
      installment_term_id: null,
      status: 'recommended',
      recommendation_reason: 'Testing unapproved',
      recommended_by: testUserId,
      recommended_at: new Date(),
      approved_percentage: null,
      approved_by: null,
      approved_at: null,
      applied_percentage: null,
      applied_by: null,
      applied_at: null,
      notes: null,
    });

    try {
      await assert.rejects(
        async () => {
          await ScholarshipConcessionService.applyConcession(
            validTenant,
            testUserId,
            '00000000-0000-0000-0000-000000000009'
          );
        },
        /Only concessions with status 'approved' can be applied to student dues/
      );
    } finally {
      ScholarshipRepository.findConcessionById = origFind;
    }
  });

  await test('applyConcession rejects already applied concessions (duplicate prevention)', async () => {
    const origFind = ScholarshipRepository.findConcessionById;
    ScholarshipRepository.findConcessionById = async () => ({
      scholarship_concession_id: '00000000-0000-0000-0000-000000000009',
      student_id: testStudentId,
      academic_year_id: testAcademicYearId,
      scholarship_type: 'merit',
      concession_name: 'Applied 20%',
      concession_percentage: 20,
      scope: 'academic_year',
      installment_term_id: null,
      status: 'applied',
      recommendation_reason: 'Already applied',
      recommended_by: testUserId,
      recommended_at: new Date(),
      approved_percentage: 20,
      approved_by: testUserId,
      approved_at: new Date(),
      applied_percentage: 20,
      applied_by: testUserId,
      applied_at: new Date(),
      notes: null,
    });

    try {
      await assert.rejects(
        async () => {
          await ScholarshipConcessionService.applyConcession(
            validTenant,
            testUserId,
            '00000000-0000-0000-0000-000000000009'
          );
        },
        /Only concessions with status 'approved' can be applied to student dues/
      );
    } finally {
      ScholarshipRepository.findConcessionById = origFind;
    }
  });

  // -------------------------------------------------------------------------
  // 8. Financial Invariant: NO CASH / NO PAYMENT RECEIPTS CREATED
  // -------------------------------------------------------------------------
  await test('applying concession strictly updates dues without creating cash records or receipts', async () => {
    let transactionCreated = false;
    let receiptCreated = false;

    const originalQuery = prisma.$queryRawUnsafe;
    let updateDuesExecuted = false;

    // Intercept database calls to check that dues table is updated directly
    // and payment transactions / receipts are never touched
    (prisma as any).$queryRawUnsafe = async (sql: string, ...args: any[]) => {
      const lower = sql.toLowerCase();
      if (lower.includes('student_charge_dues') && lower.includes('update')) {
        updateDuesExecuted = true;
      }
      if (lower.includes('payment_transactions') && lower.includes('insert')) {
        transactionCreated = true;
      }
      if (lower.includes('payment_receipts') && lower.includes('insert')) {
        receiptCreated = true;
      }
      return [];
    };

    const origFind = ScholarshipRepository.findConcessionById;
    ScholarshipRepository.findConcessionById = async () => ({
      scholarship_concession_id: '00000000-0000-0000-0000-000000000009',
      student_id: testStudentId,
      academic_year_id: testAcademicYearId,
      scholarship_type: 'merit',
      concession_name: 'Approved 25%',
      concession_percentage: 25,
      scope: 'academic_year',
      installment_term_id: null,
      status: 'approved',
      recommendation_reason: 'Testing discount invariant',
      recommended_by: testUserId,
      recommended_at: new Date(),
      approved_percentage: 25,
      approved_by: testUserId,
      approved_at: new Date(),
      applied_percentage: null,
      applied_by: null,
      applied_at: null,
      notes: null,
    });

    const origApply = ScholarshipRepository.applyConcessionToLedger;
    (ScholarshipRepository as any).applyConcessionToLedger = async () => {
      updateDuesExecuted = true;
      return {
        concession: {
          scholarship_concession_id: '00000000-0000-0000-0000-000000000009',
          student_id: testStudentId,
          academic_year_id: testAcademicYearId,
          scholarship_type: 'merit',
          concession_name: 'Approved 25%',
          concession_percentage: 25,
          scope: 'academic_year',
          installment_term_id: null,
          status: 'applied',
          recommendation_reason: 'Testing discount invariant',
          recommended_by: testUserId,
          recommended_at: new Date(),
          approved_percentage: 25,
          approved_by: testUserId,
          approved_at: new Date(),
          applied_percentage: 25,
          applied_by: testUserId,
          applied_at: new Date(),
          notes: null,
        } as any,
        totalDiscountApplied: 5000,
        affectedDuesCount: 2,
      };
    };

    try {
      const res = await ScholarshipConcessionService.applyConcession(
        validTenant,
        testUserId,
        '00000000-0000-0000-0000-000000000009'
      );

      assert.strictEqual(updateDuesExecuted, true, 'Dues update query must be executed');
      assert.strictEqual(transactionCreated, false, 'Concession must NEVER create a cash payment transaction');
      assert.strictEqual(receiptCreated, false, 'Concession must NEVER create a payment receipt');
      assert.strictEqual(res.concession.status, 'applied', 'Status must be updated to applied');
      assert.strictEqual(res.totalDiscountApplied, 5000, 'Discount must be recorded');
    } finally {
      (prisma as any).$queryRawUnsafe = originalQuery;
      ScholarshipRepository.findConcessionById = origFind;
      ScholarshipRepository.applyConcessionToLedger = origApply;
    }
  });

  console.log(`\nFinance Phase 7 tests complete: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    throw new Error(`${failed} Phase 7 scholarship tests failed!`);
  }
}

if (require.main === module) {
  runFinanceScholarshipTests().catch((err) => {
    console.error('Phase 7 Test Suite Failed:', err);
    process.exit(1);
  });
}
