import assert from 'assert';
import prisma from '../../../lib/prismaClient';
import { DepartmentService } from '../department.service';

export async function runDepartmentModuleTests() {
  console.log('=====================================================');
  console.log('   DEPARTMENTS MODULE: SCHEMA-ALIGNED TEST SUITE     ');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}: ${err.message}`);
      failed++;
    }
  }

  const testOrgId = '00000000-0000-0000-0000-000000000001';
  const testDeptName = `Test Science Dept ${Date.now()}`;
  let createdDeptId: string | null = null;

  // 1. Create department
  await test('DepartmentService.create creates department using schema.prisma departments model', async () => {
    const dept = await DepartmentService.create(
      testOrgId,
      testDeptName,
      'Department for scientific studies',
    );
    assert.ok(dept);
    assert.strictEqual(dept.name, testDeptName);
    assert.strictEqual(dept.department_name, testDeptName);
    assert.strictEqual(dept.org_id, testOrgId);
    assert.strictEqual(dept.school_id, testOrgId);
    assert.ok(dept.id);
    assert.ok(dept.department_id);
    createdDeptId = dept.department_id;
  });

  // 2. Reject duplicate creation
  await test('DepartmentService.create rejects duplicate department in same organization', async () => {
    let threw = false;
    try {
      await DepartmentService.create(testOrgId, testDeptName);
    } catch (err: any) {
      threw = true;
      assert.ok(err.message.includes('already exists'));
    }
    assert.strictEqual(threw, true, 'Expected duplicate creation to throw');
  });

  // 3. getAll returns list with schema mapping
  await test('DepartmentService.getAll lists departments scoped to org_id', async () => {
    const list = await DepartmentService.getAll(testOrgId);
    assert.ok(Array.isArray(list));
    const found = list.find((d) => d.department_id === createdDeptId);
    assert.ok(found, 'Created department should be present in organization list');
    assert.strictEqual(found.department_name, testDeptName);
  });

  // 4. Update department name
  await test('DepartmentService.update updates department name and validates uniqueness', async () => {
    if (!createdDeptId) throw new Error('Missing createdDeptId');
    const updatedName = `${testDeptName} Updated`;
    const updated = await DepartmentService.update(
      createdDeptId,
      testOrgId,
      updatedName,
      'Updated description',
    );
    assert.strictEqual(updated.department_name, updatedName);
    assert.strictEqual(updated.name, updatedName);
  });

  // 5. Delete department safety check: simulate staff dependency
  await test('DepartmentService.delete blocks deletion when staff members are assigned', async () => {
    if (!createdDeptId) throw new Error('Missing createdDeptId');
    // Temporarily mock staff count check or verify count logic
    const origStaffCount = prisma.staff.count;
    prisma.staff.count = (async () => 2) as any;
    try {
      let threw = false;
      try {
        await DepartmentService.delete(createdDeptId, testOrgId);
      } catch (err: any) {
        threw = true;
        assert.ok(err.message.includes('Cannot delete department'));
        assert.ok(err.message.includes('2 staff members'));
      }
      assert.strictEqual(threw, true, 'Expected staff constraint to prevent deletion');
    } finally {
      prisma.staff.count = origStaffCount;
    }
  });

  // 6. Delete department succeeds when no staff assigned
  await test('DepartmentService.delete successfully removes department when no staff assigned', async () => {
    if (!createdDeptId) throw new Error('Missing createdDeptId');
    const result = await DepartmentService.delete(createdDeptId, testOrgId);
    assert.strictEqual(result, true);

    const list = await DepartmentService.getAll(testOrgId);
    const found = list.find((d) => d.department_id === createdDeptId);
    assert.strictEqual(found, undefined, 'Deleted department must no longer exist');
  });

  console.log(`\n[Departments Module] Tests finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runDepartmentModuleTests();
}
