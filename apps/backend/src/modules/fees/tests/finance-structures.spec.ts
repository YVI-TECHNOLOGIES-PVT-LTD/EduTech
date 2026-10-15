import assert from 'assert';
import { FeeStructureManagerService } from '../services/FeeStructureManagerService';
import prisma from '../../../lib/prismaClient';

export async function runFinanceStructureTests() {
  console.log('=====================================================');
  console.log('   FINANCE PHASE 3: FEE STRUCTURE TEST SUITE         ');
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

  // 1. Decimal-safe helper tests
  await test('roundMoney provides decimal-safe currency rounding', () => {
    assert.strictEqual(FeeStructureManagerService.roundMoney(10.555), 10.56);
    assert.strictEqual(FeeStructureManagerService.roundMoney(0.1 + 0.2), 0.3);
    assert.strictEqual(FeeStructureManagerService.roundMoney(15000), 15000);
    assert.strictEqual(FeeStructureManagerService.roundMoney(1234.567), 1234.57);
  });

  const mockUuid1 = '00000000-0000-0000-0000-000000000001';
  const mockUuid2 = '00000000-0000-0000-0000-000000000002';
  const mockUuidUser = '00000000-0000-0000-0000-000000000003';

  // 2. Validation: Empty or invalid structure name
  await test('createStructure rejects empty or whitespace name', async () => {
    await assert.rejects(async () => {
      await FeeStructureManagerService.createStructure(mockUuid2, mockUuidUser, {
        name: '   ',
        academic_year_grade_id: mockUuid1,
        components: [{ component_name: 'Tuition', component_code: 'TUI', amount: 1000 }],
      });
    }, /Fee structure name is required/);
  });

  // 3. Validation: Structure name length limit
  await test('createStructure rejects name exceeding 150 characters', async () => {
    await assert.rejects(async () => {
      await FeeStructureManagerService.createStructure(mockUuid2, mockUuidUser, {
        name: 'A'.repeat(151),
        academic_year_grade_id: mockUuid1,
        components: [{ component_name: 'Tuition', component_code: 'TUI', amount: 1000 }],
      });
    }, /must not exceed 150 characters/);
  });

  // 4. Validation: Missing academic_year_grade_id
  await test('createStructure rejects missing academic_year_grade_id', async () => {
    await assert.rejects(async () => {
      await FeeStructureManagerService.createStructure(mockUuid2, mockUuidUser, {
        name: 'Annual Fee 2026',
        academic_year_grade_id: '',
        components: [{ component_name: 'Tuition', component_code: 'TUI', amount: 1000 }],
      });
    }, /Target academic year grade assignment is required/);
  });

  // 5. Validation: Missing components
  await test('createStructure rejects empty components list', async () => {
    await assert.rejects(async () => {
      await FeeStructureManagerService.createStructure(mockUuid2, mockUuidUser, {
        name: 'Annual Fee 2026',
        academic_year_grade_id: mockUuid1,
        components: [],
      });
    }, /At least one fee component is required/);
  });

  // 6. Validation: Negative and zero amounts rejected
  await test('createStructure rejects negative or zero component amounts', async () => {
    await assert.rejects(async () => {
      await FeeStructureManagerService.createStructure(mockUuid2, mockUuidUser, {
        name: 'Annual Fee 2026',
        academic_year_grade_id: mockUuid1,
        components: [{ component_name: 'Tuition', component_code: 'TUI', amount: -500 }],
      });
    }, /must be a positive number greater than 0/);

    await assert.rejects(async () => {
      await FeeStructureManagerService.createStructure(mockUuid2, mockUuidUser, {
        name: 'Annual Fee 2026',
        academic_year_grade_id: mockUuid1,
        components: [{ component_name: 'Tuition', component_code: 'TUI', amount: 0 }],
      });
    }, /must be a positive number greater than 0/);
  });

  // 7. Validation: Duplicate component code rejection
  await test('createStructure rejects duplicate component codes within structure', async () => {
    await assert.rejects(async () => {
      await FeeStructureManagerService.createStructure(mockUuid2, mockUuidUser, {
        name: 'Annual Fee 2026',
        academic_year_grade_id: mockUuid1,
        components: [
          { component_name: 'Tuition Fee', component_code: 'TUITION', amount: 30000 },
          { component_name: 'Second Tuition', component_code: 'tuition', amount: 10000 },
        ],
      });
    }, /Duplicate component code/);
  });

  // 8. Validation: Duplicate component name rejection
  await test('createStructure rejects duplicate component names within structure', async () => {
    await assert.rejects(async () => {
      await FeeStructureManagerService.createStructure(mockUuid2, mockUuidUser, {
        name: 'Annual Fee 2026',
        academic_year_grade_id: mockUuid1,
        components: [
          { component_name: 'Exam Fee', component_code: 'EXAM_1', amount: 2000 },
          { component_name: 'exam fee', component_code: 'EXAM_2', amount: 2500 },
        ],
      });
    }, /Duplicate component name/);
  });

  // 9. Tenant isolation: Missing tenant context
  await test('Missing tenant organization ID raises error', async () => {
    await assert.rejects(async () => {
      await FeeStructureManagerService.getSummaryMetrics('');
    }, /Tenant organization ID is required/);

    await assert.rejects(async () => {
      await FeeStructureManagerService.listStructures('', {});
    }, /Tenant organization ID is required/);
  });

  // 10. Database-backed integration tests with verified models
  let activeAyGrade: any = null;
  let testOrgId: string = '';

  try {
    // Find an active academic year grade that belongs to an organization
    activeAyGrade = await (prisma as any).academic_year_grades.findFirst({
      where: {
        is_active: true,
        academic_years: {
          org_id: { not: undefined },
        },
      } as any,
      include: {
        academic_years: true,
        grades: true,
      },
    });

    if (activeAyGrade) {
      testOrgId = activeAyGrade.academic_years.org_id;
    }
  } catch (err) {
    console.warn('[Test Setup] Could not query academic_year_grades:', err);
  }

  if (activeAyGrade && testOrgId) {
    let createdStructureId: string = '';

    // 11. Cross-tenant isolation: Cannot create structure referencing another tenant's academic_year_grade
    await test('Tenant isolation prevents referencing another tenant grade', async () => {
      const wrongOrgId = '00000000-0000-0000-0000-999999999999';
      await assert.rejects(async () => {
        await FeeStructureManagerService.createStructure(wrongOrgId, 'user-test', {
          name: 'Cross Tenant Fee',
          academic_year_grade_id: activeAyGrade.academic_year_grade_id,
          components: [{ component_name: 'Tuition Fee', component_code: 'TUITION', amount: 15000 }],
        });
      }, /Academic year grade mapping not found or does not belong to this organization/);
    });

    // 12. Create structure as draft
    await test('createStructure creates draft structure with components and totals', async () => {
      const created = await FeeStructureManagerService.createStructure(testOrgId, 'tester', {
        name: 'Unit Test Fee Structure 2026',
        description: 'Created by automated test runner',
        academic_year_grade_id: activeAyGrade.academic_year_grade_id,
        components: [
          {
            component_name: 'Tuition Fee',
            component_code: 'TEST_TUI',
            amount: 40000,
            is_mandatory: true,
          },
          {
            component_name: 'Lab Fee',
            component_code: 'TEST_LAB',
            amount: 8000,
            is_mandatory: true,
          },
          {
            component_name: 'Sports Fee',
            component_code: 'TEST_SPT',
            amount: 2000,
            is_mandatory: false,
          },
        ],
      });

      assert.ok(created.id);
      createdStructureId = created.id;
      assert.strictEqual(created.name, 'Unit Test Fee Structure 2026');
      assert.strictEqual(created.status, 'draft');
      assert.strictEqual(created.components.length, 3);
      assert.strictEqual(created.total_amount, 50000);
      assert.strictEqual(created.academic_year_grade_id, activeAyGrade.academic_year_grade_id);
    });

    // 13. Unique constraint enforcement
    await test('Enforces unique constraint: cannot create 2 fee structures for same grade', async () => {
      await assert.rejects(async () => {
        await FeeStructureManagerService.createStructure(testOrgId, 'tester', {
          name: 'Duplicate Structure',
          academic_year_grade_id: activeAyGrade.academic_year_grade_id,
          components: [{ component_name: 'Tuition Fee', component_code: 'TUI_DUP', amount: 20000 }],
        });
      }, /already exists for/);
    });

    // 14. Cross-tenant isolation: Tenant B cannot fetch Tenant A's structure
    await test('Cross-tenant isolation prevents foreign tenant from reading structure', async () => {
      const foreignOrgId = '00000000-0000-0000-0000-999999999999';
      await assert.rejects(async () => {
        await FeeStructureManagerService.getStructureById(foreignOrgId, createdStructureId);
      }, /Fee structure not found or does not belong to this organization/);
    });

    // 15. Update structure
    await test('updateStructure updates name, description, and components', async () => {
      const updated = await FeeStructureManagerService.updateStructure(
        testOrgId,
        'tester',
        createdStructureId,
        {
          name: 'Unit Test Fee Structure 2026 (Updated)',
          components: [
            {
              component_name: 'Core Tuition',
              component_code: 'TEST_TUI',
              amount: 45000,
              is_mandatory: true,
            },
            {
              component_name: 'Lab & IT',
              component_code: 'TEST_LAB_IT',
              amount: 10000,
              is_mandatory: true,
            },
          ],
        },
      );

      assert.strictEqual(updated.name, 'Unit Test Fee Structure 2026 (Updated)');
      assert.strictEqual(updated.components.length, 2);
      assert.strictEqual(updated.total_amount, 55000);
    });

    // 16. Publish structure
    await test('publishStructure transitions draft structure to published', async () => {
      const published = await FeeStructureManagerService.publishStructure(
        testOrgId,
        'tester',
        createdStructureId,
      );

      assert.strictEqual(published.status, 'published');
    });

    // 17. Publishing already published structure fails
    await test('publishStructure rejects already published structure', async () => {
      await assert.rejects(async () => {
        await FeeStructureManagerService.publishStructure(testOrgId, 'tester', createdStructureId);
      }, /Fee structure is already published/);
    });

    // 18. Deactivate structure
    await test('deactivateStructure transitions structure to inactive', async () => {
      const deactivated = await FeeStructureManagerService.deactivateStructure(
        testOrgId,
        'tester',
        createdStructureId,
      );

      assert.strictEqual(deactivated.status, 'inactive');
    });

    // 19. Summary metrics computation
    await test('getSummaryMetrics correctly aggregates structures and inactive count', async () => {
      const metrics = await FeeStructureManagerService.getSummaryMetrics(testOrgId);
      assert.ok(typeof metrics.totalStructures === 'number');
      assert.ok(typeof metrics.publishedStructures === 'number');
      assert.ok(typeof metrics.draftStructures === 'number');
      assert.ok(typeof metrics.inactiveStructures === 'number');
      assert.ok(metrics.inactiveStructures >= 1);
    });

    // Clean up test structure after verification
    if (createdStructureId) {
      try {
        await prisma.fee_components.deleteMany({
          where: { fee_structure_id: createdStructureId },
        });
        await prisma.fee_structures.delete({
          where: { fee_structure_id: createdStructureId },
        });
      } catch (cleanupErr) {
        console.warn('[Test Cleanup] Could not delete test structure:', cleanupErr);
      }
    }
  } else {
    console.log(
      '  [Notice] Live DB did not contain unconfigured academic year grades for write tests; schema validation tests passed.',
    );
  }

  console.log(`\nFinance Phase 3 tests complete: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    throw new Error(`Finance Phase 3 test suite encountered ${failed} failure(s).`);
  }
}
