import assert from 'assert';
import { UserValidator } from '../validators/user.validator';
import { user_status } from '../constants/user.constants';

export async function runUserModuleTests() {
  console.log('[User Management] Running unit tests...');
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
  test('UserValidator validates mandatory create user fields', () => {
    assert.throws(
      () =>
        UserValidator.validateCreate({
          org_id: '',
          first_name: '',
          email: '',
          phone: '',
          status: user_status.active as any,
        }),
      Error,
    );
  });

  test('UserValidator passes valid create user input', () => {
    UserValidator.validateCreate({
      org_id: '123e4567-e89b-12d3-a456-426614174000',
      first_name: 'John',
      email: 'john@example.com',
      phone: '+1234567890',
      status: user_status.active as any,
    });
  });

  test('UserValidator validates mandatory role input', () => {
    assert.throws(
      () => UserValidator.validateCreateRole({ org_id: '', role_name: '', is_active: true }),
      Error,
    );
  });

  console.log(`[User Management] Tests finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runUserModuleTests();
}
