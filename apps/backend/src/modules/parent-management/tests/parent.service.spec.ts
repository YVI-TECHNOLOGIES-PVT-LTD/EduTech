import assert from 'assert';
import { ParentValidator } from '../validators/parent.validator';
import { relationship_type } from '../constants/parent.constants';

export async function runParentModuleTests() {
  console.log('[Parent Management] Running unit tests...');
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
  test('ParentValidator validates mandatory create fields', () => {
    assert.throws(
      () => ParentValidator.validateCreate({ org_id: '', first_name: '', phone: '' }),
      Error
    );
  });

  test('ParentValidator passes valid create input', () => {
    ParentValidator.validateCreate({
      org_id: '123e4567-e89b-12d3-a456-426614174000',
      first_name: 'Jane',
      phone: '+1234567890',
    });
  });

  test('ParentValidator validates link student input', () => {
    assert.throws(
      () => ParentValidator.validateLinkStudent({ student_id: '', relationship: relationship_type.father as any, is_primary_contact: false }),
      Error
    );
  });

  console.log(`[Parent Management] Tests finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runParentModuleTests();
}
