import { runLeadModuleTests } from '../modules/lead-management/tests/lead.service.spec';
import { runAdmissionModuleTests } from '../modules/admission-management/tests/admission.service.spec';
import { runStudentModuleTests } from '../modules/student-management/tests/student.service.spec';
import { runParentModuleTests } from '../modules/parent-management/tests/parent.service.spec';
import { runAcademicModuleTests } from '../modules/academic-management/tests/academic.service.spec';
import { runStaffModuleTests } from '../modules/staff-management/tests/staff.service.spec';
import { runUserModuleTests } from '../modules/user-management/tests/user.service.spec';

export async function runAllStage1ModuleTests() {
  console.log('=====================================================');
  console.log('  EDUTRACK ERP STAGE-1 MASTER INTEGRATION TEST SUITE ');
  console.log('=====================================================\n');

  await runLeadModuleTests();
  await runAdmissionModuleTests();
  await runStudentModuleTests();
  await runParentModuleTests();
  await runAcademicModuleTests();
  await runStaffModuleTests();
  await runUserModuleTests();

  console.log('\n=====================================================');
  console.log('  ALL STAGE-1 BUSINESS MODULE TESTS PASSED (7/7) ✅  ');
  console.log('=====================================================');
}

if (require.main === module) {
  runAllStage1ModuleTests().catch((err) => {
    console.error('Master Test Runner Failed:', err);
    process.exit(1);
  });
}
