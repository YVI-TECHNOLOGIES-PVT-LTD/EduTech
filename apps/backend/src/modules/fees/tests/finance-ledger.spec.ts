import assert from 'assert';
import { StudentLedgerService } from '../services/StudentLedgerService';
import prisma from '../../../lib/prismaClient';

export async function runFinanceLedgerTests() {
  console.log('=====================================================');
  console.log('   FINANCE PHASE 4: STUDENT FEE LEDGER TEST SUITE    ');
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

  // -------------------------------------------------------------------------
  // 1. Decimal & Money Rounding
  // -------------------------------------------------------------------------
  await test('roundMoney provides decimal-safe financial rounding and precision', () => {
    assert.strictEqual(StudentLedgerService.roundMoney(10.555), 10.56);
    assert.strictEqual(StudentLedgerService.roundMoney(0.1 + 0.2), 0.3);
    assert.strictEqual(StudentLedgerService.roundMoney('1234.567'), 1234.57);
    assert.strictEqual(StudentLedgerService.roundMoney(null), 0);
    assert.strictEqual(StudentLedgerService.roundMoney(undefined), 0);
    assert.strictEqual(StudentLedgerService.roundMoney(5000), 5000);
  });

  // -------------------------------------------------------------------------
  // 2. Tenant Isolation & Missing Context
  // -------------------------------------------------------------------------
  await test('searchStudents rejects missing tenant organization ID', async () => {
    await assert.rejects(
      async () => {
        await StudentLedgerService.searchStudents('');
      },
      /Tenant organization ID is required/
    );
  });

  await test('getStudentLedgerSummary rejects missing tenant organization ID', async () => {
    await assert.rejects(
      async () => {
        await StudentLedgerService.getStudentLedgerSummary('', '00000000-0000-0000-0000-000000000001');
      },
      /Tenant organization ID is required/
    );
  });

  await test('getStudentLedgerSummary rejects invalid UUID format', async () => {
    await assert.rejects(
      async () => {
        await StudentLedgerService.getStudentLedgerSummary(
          '00000000-0000-0000-0000-000000000001',
          'invalid-student-id'
        );
      },
      /Invalid student identifier format/
    );
  });

  const mockTenantA = '00000000-0000-0000-0000-000000000001';
  const mockTenantB = '00000000-0000-0000-0000-000000000002';
  const nonExistentStudentId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

  await test('getStudentLedgerSummary returns 404 for non-existent student in tenant', async () => {
    await assert.rejects(
      async () => {
        await StudentLedgerService.getStudentLedgerSummary(mockTenantA, nonExistentStudentId);
      },
      (err: any) => err.statusCode === 404
    );
  });

  // -------------------------------------------------------------------------
  // 3. Database Fixture Tests (Tenant-scoped)
  // -------------------------------------------------------------------------
  // Find a valid student or organization in the database
  const sampleOrg = await prisma.organizations.findFirst({
    include: {
      students: {
        include: {
          student_enrollments: {
            include: {
              academic_year_grades: {
                include: { academic_years: true, grades: true },
              },
            },
          },
        },
      },
    },
  });

  if (sampleOrg && sampleOrg.students.length > 0) {
    const student = sampleOrg.students[0];

    await test('searchStudents successfully returns tenant-scoped student list', async () => {
      const res = await StudentLedgerService.searchStudents(sampleOrg.org_id, {
        limit: 10,
      });
      assert.ok(Array.isArray(res.students));
      assert.ok(res.pagination.total >= 1);
      const found = res.students.find((s) => s.student_id === student.student_id);
      assert.ok(found, 'Student should be present in search results');
      assert.strictEqual(found?.admission_no, student.admission_no);
    });

    await test('searchStudents filters by student admission number query', async () => {
      const res = await StudentLedgerService.searchStudents(sampleOrg.org_id, {
        query: student.admission_no,
      });
      assert.ok(res.students.length >= 1);
      assert.strictEqual(res.students[0].admission_no, student.admission_no);
    });

    await test('Cross-tenant lookup: Foreign tenant cannot view Student from Tenant A', async () => {
      await assert.rejects(
        async () => {
          await StudentLedgerService.getStudentLedgerSummary(mockTenantB, student.student_id);
        },
        (err: any) => err.statusCode === 404
      );
    });

    await test('getStudentLedgerSummary computes valid summary metrics for existing student', async () => {
      const summary = await StudentLedgerService.getStudentLedgerSummary(
        sampleOrg.org_id,
        student.student_id
      );

      assert.strictEqual(summary.student.student_id, student.student_id);
      assert.strictEqual(summary.student.admission_no, student.admission_no);
      assert.strictEqual(summary.summary.currency, 'INR');
      assert.ok(typeof summary.summary.total_assessed_amount === 'number');
      assert.ok(typeof summary.summary.total_paid_amount === 'number');
      assert.ok(typeof summary.summary.outstanding_balance === 'number');
      assert.ok(typeof summary.summary.overdue_balance === 'number');
      assert.ok(Array.isArray(summary.summary.reliability_notes));

      // Balance mathematical invariant:
      if (summary.summary.has_assessed_charges) {
        assert.strictEqual(
          summary.summary.outstanding_balance,
          Math.max(
            0,
            StudentLedgerService.roundMoney(
              summary.summary.total_assessed_amount - summary.summary.total_paid_amount
            )
          )
        );
      }
    });

    await test('getStudentAssessments loads assessments and fee assignment cleanly', async () => {
      const assessments = await StudentLedgerService.getStudentAssessments(
        sampleOrg.org_id,
        student.student_id
      );
      assert.ok(Array.isArray(assessments.charges));
      if (assessments.assigned_structure) {
        assert.ok(assessments.assigned_structure.fee_structure.name);
        assert.ok(Array.isArray(assessments.assigned_structure.fee_structure.components));
      }
    });

    await test('getStudentPayments loads payment transactions and allocation records', async () => {
      const payments = await StudentLedgerService.getStudentPayments(
        sampleOrg.org_id,
        student.student_id
      );
      assert.ok(typeof payments.total_paid === 'number');
      assert.ok(typeof payments.total_allocated === 'number');
      assert.ok(typeof payments.unallocated === 'number');
      assert.ok(Array.isArray(payments.transactions));
    });

    await test('getStudentDues returns scheduled obligations with overdue indicator', async () => {
      const dues = await StudentLedgerService.getStudentDues(
        sampleOrg.org_id,
        student.student_id
      );
      assert.ok(Array.isArray(dues));
      for (const d of dues) {
        assert.ok(typeof d.amount_due === 'number');
        assert.ok(typeof d.paid_amount === 'number');
        assert.ok(typeof d.outstanding_amount === 'number');
        assert.ok(typeof d.is_overdue === 'boolean');
      }
    });

    await test('getStudentTransactionHistory returns chronological event audit trail', async () => {
      const history = await StudentLedgerService.getStudentTransactionHistory(
        sampleOrg.org_id,
        student.student_id
      );
      assert.ok(Array.isArray(history));
      // Invariant: Sorted in descending order
      for (let i = 1; i < history.length; i++) {
        const prev = new Date(history[i - 1].timestamp).getTime();
        const curr = new Date(history[i].timestamp).getTime();
        assert.ok(prev >= curr, 'Timeline events must be ordered descending by timestamp');
      }
    });

    await test('getEligibleStructures returns matching published structures for enrollment', async () => {
      const elig = await StudentLedgerService.getEligibleStructures(
        sampleOrg.org_id,
        student.student_id
      );
      assert.ok(Array.isArray(elig.structures));
      assert.ok(Array.isArray(elig.installment_plans));
    });
  }

  // -------------------------------------------------------------------------
  // 4. Structure Assignment Validation Rules
  // -------------------------------------------------------------------------
  await test('assignFeeStructure rejects missing tenant ID', async () => {
    await assert.rejects(
      async () => {
        await StudentLedgerService.assignFeeStructure('', null, {
          studentId: '00000000-0000-0000-0000-000000000001',
          feeStructureId: '00000000-0000-0000-0000-000000000002',
        });
      },
      /Tenant organization ID is required/
    );
  });

  await test('assignFeeStructure rejects invalid student ID', async () => {
    await assert.rejects(
      async () => {
        await StudentLedgerService.assignFeeStructure(mockTenantA, null, {
          studentId: 'not-a-uuid',
          feeStructureId: '00000000-0000-0000-0000-000000000002',
        });
      },
      /Valid student ID is required/
    );
  });

  await test('assignFeeStructure rejects invalid fee structure ID', async () => {
    await assert.rejects(
      async () => {
        await StudentLedgerService.assignFeeStructure(mockTenantA, null, {
          studentId: '00000000-0000-0000-0000-000000000001',
          feeStructureId: 'not-a-uuid',
        });
      },
      /Valid fee structure ID is required/
    );
  });

  await test('assignFeeStructure rejects student belonging to another tenant (404)', async () => {
    await assert.rejects(
      async () => {
        await StudentLedgerService.assignFeeStructure(mockTenantA, null, {
          studentId: nonExistentStudentId,
          feeStructureId: '00000000-0000-0000-0000-000000000002',
        });
      },
      (err: any) => err.statusCode === 404
    );
  });

  console.log(`\nFinance Phase 4 tests complete: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    throw new Error(`Finance Phase 4 tests failed: ${failed} failure(s)`);
  }
}

if (require.main === module) {
  runFinanceLedgerTests().catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}
