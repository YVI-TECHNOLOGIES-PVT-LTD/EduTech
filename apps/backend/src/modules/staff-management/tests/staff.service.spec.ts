import assert from 'assert';
import { StaffValidator } from '../validators/staff.validator';

export async function runStaffModuleTests() {
  console.log('[Staff Management] Running unit tests...');
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}: ${err.message}`);
      failed++;
    }
  }

  // Validator tests
  test('StaffValidator validates mandatory create staff fields', () => {
    assert.throws(
      () => StaffValidator.validateCreate({ org_id: '', user_id: '', employee_code: '', is_active: true }),
      Error
    );
  });

  test('StaffValidator passes valid create staff input', () => {
    StaffValidator.validateCreate({
      org_id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      employee_code: 'EMP-001',
      is_active: true,
    });
  });

  test('StaffValidator validates mandatory designation input', () => {
    assert.throws(
      () => StaffValidator.validateCreateDesignation({ org_id: '', designation_name: '', is_active: true }),
      Error
    );
  });

  console.log(`[Staff Management] Tests finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runStaffModuleTests();
}
