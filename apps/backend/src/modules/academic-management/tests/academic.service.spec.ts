import assert from 'assert';
import { AcademicValidator } from '../validators/academic.validator';
import { academic_year_status } from '../constants/academic.constants';

export async function runAcademicModuleTests() {
  console.log('[Academic Management] Running unit tests...');
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
  test('AcademicValidator rejects academic year when end_date <= start_date', () => {
    assert.throws(
      () => AcademicValidator.validateCreateAcademicYear({
        org_id: '123e4567-e89b-12d3-a456-426614174000',
        academic_year_name: '2026-2027',
        start_date: '2026-12-31',
        end_date: '2026-01-01',
        status: academic_year_status.planning as any,
      }),
      Error
    );
  });

  test('AcademicValidator passes valid academic year input', () => {
    AcademicValidator.validateCreateAcademicYear({
      org_id: '123e4567-e89b-12d3-a456-426614174000',
      academic_year_name: '2026-2027',
      start_date: '2026-06-01',
      end_date: '2027-05-31',
      status: academic_year_status.open as any,
    });
  });

  test('AcademicValidator validates mandatory grade input', () => {
    assert.throws(
      () => AcademicValidator.validateCreateGrade({
        org_id: '',
        grade_code: '',
        grade_name: '',
        display_order: 1,
        is_active: true,
      }),
      Error
    );
  });

  console.log(`[Academic Management] Tests finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runAcademicModuleTests();
}
