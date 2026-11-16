import assert from 'assert';
import { enrollment_status } from '../constants/student.constants';
import { StudentValidator } from '../validators/student.validator';
import { EnrollmentValidator } from '../validators/enrollment.validator';
import { InvalidStudentStatusTransitionError } from '../errors/student.errors';
import { StudentAcademicsService } from '../services/student-academics.service';
import { StudentRepository } from '../repositories/student.repository';

export async function runStudentModuleTests() {
  console.log('[Student Management] Running unit tests...');
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

  // 1. Validator tests
  await test('StudentValidator allows valid status transitions', () => {
    StudentValidator.validateStatusTransition(
      enrollment_status.active,
      enrollment_status.transferred_out,
    );
    StudentValidator.validateStatusTransition(
      enrollment_status.active,
      enrollment_status.graduated,
    );
  });

  await test('StudentValidator rejects invalid status transitions', () => {
    assert.throws(
      () =>
        StudentValidator.validateStatusTransition(
          enrollment_status.graduated,
          enrollment_status.active,
        ),
      InvalidStudentStatusTransitionError,
    );
  });

  await test('EnrollmentValidator validates mandatory enrollment input', () => {
    assert.throws(() => EnrollmentValidator.validateEnroll({ academic_year_grade_id: '' }), Error);
  });

  // 2. Student Academics Service tests
  await test('StudentAcademicsService returns compliant structures for enrolled student', async () => {
    const originalFindById = StudentRepository.findById;
    (StudentRepository as any).findById = async () => ({
      student_id: 'test-student-id',
      admission_no: 'ADM-2026-001',
      first_name: 'Alex',
      last_name: 'Johnson',
      status: 'active',
    });

    try {
      const user = { id: 'admin-id', roles: ['ADMIN'] };
      const exams = await StudentAcademicsService.getExams('test-student-id', user);
      assert(Array.isArray(exams) && exams.length === 0, 'Exams returns empty array');

      const attendance = await StudentAcademicsService.getAttendanceSummary(
        'test-student-id',
        user,
      );
      assert.strictEqual(attendance.percentage, 0);
      assert(Array.isArray(attendance.records), 'Attendance records is array');

      const timetable = await StudentAcademicsService.getWeekTimetable('test-student-id', user);
      assert(Array.isArray(timetable), 'Timetable is array');

      const homework = await StudentAcademicsService.getHomework('test-student-id', user);
      assert(Array.isArray(homework), 'Homework is array');

      const library = await StudentAcademicsService.getLibrary('test-student-id', user);
      assert(library !== null && library.cardNumber === 'ADM-2026-001', 'Library card populated');
    } finally {
      StudentRepository.findById = originalFindById;
    }
  });

  console.log(`[Student Management] Tests finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runStudentModuleTests();
}
