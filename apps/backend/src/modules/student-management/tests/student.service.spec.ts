import assert from 'assert';
import { enrollment_status } from '../constants/student.constants';
import { StudentValidator } from '../validators/student.validator';
import { EnrollmentValidator } from '../validators/enrollment.validator';
import { InvalidStudentStatusTransitionError } from '../errors/student.errors';

export async function runStudentModuleTests() {
  console.log('[Student Management] Running unit tests...');
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

  // 1. Validator tests
  test('StudentValidator allows valid status transitions', () => {
    StudentValidator.validateStatusTransition(
      enrollment_status.active,
      enrollment_status.transferred_out,
    );
    StudentValidator.validateStatusTransition(
      enrollment_status.active,
      enrollment_status.graduated,
    );
  });

  test('StudentValidator rejects invalid status transitions', () => {
    assert.throws(
      () =>
        StudentValidator.validateStatusTransition(
          enrollment_status.graduated,
          enrollment_status.active,
        ),
      InvalidStudentStatusTransitionError,
    );
  });

  test('EnrollmentValidator validates mandatory enrollment input', () => {
    assert.throws(() => EnrollmentValidator.validateEnroll({ academic_year_grade_id: '' }), Error);
  });

  console.log(`[Student Management] Tests finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runStudentModuleTests();
}
