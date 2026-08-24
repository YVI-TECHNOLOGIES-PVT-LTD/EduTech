import assert from 'assert';
import prisma from '../../../lib/prismaClient';
import { AuthService } from '../../../auth/auth.service';
import { AdmissionService } from '../services/admission.service';
import { AdmissionAssessmentService } from '../services/admission.assessment.service';
import { AdmissionDecisionService } from '../services/admission.decision.service';
import { AdmissionAssessmentController } from '../controllers/admission-assessment.controller';
import { AdmissionDecisionController } from '../controllers/admission-decision.controller';
import { ApplicationNotFoundError } from '../errors/admission.errors';

export async function runParentIdorAuthorizationTests() {
  console.log('\n============================================================');
  console.log('  PARENT IDOR & CROSS-TENANT AUTHORIZATION REGRESSION TEST');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}`);
      console.error('    Error:', err.message || err);
      if (err.stack) {
        console.error('    Stack:', err.stack);
      }
      failed++;
    }
  }

  // Find active primary test organization
  const orgA = await prisma.organizations.findFirst({ where: { status: 'active' } });
  if (!orgA) throw new Error('No active organization found for testing');

  // Find or create secondary test organization for cross-tenant validation
  let orgB = await prisma.organizations.findFirst({
    where: {
      status: 'active',
      org_id: { not: orgA.org_id },
    },
  });

  const createdOrgB = !orgB;
  if (!orgB) {
    orgB = await prisma.organizations.create({
      data: {
        org_code: `TEST_ORG_B_${Date.now().toString().slice(-4)}`,
        org_name: 'Secondary Test Academy Org B',
        email: `org_b_${Date.now()}@example.com`,
        phone: '9998887776',
        status: 'active',
      },
    });
  }

  const academicYearA = await prisma.academic_years.findFirst({
    where: { org_id: orgA.org_id },
  });
  if (!academicYearA) throw new Error('No academic year found in Org A for testing');

  const gradeA = await prisma.grades.findFirst({ where: { org_id: orgA.org_id } });
  if (!gradeA) throw new Error('No grade found in Org A for testing');

  const aygA = await prisma.academic_year_grades.findFirst({
    where: { academic_year_id: academicYearA.academic_year_id, grade_id: gradeA.grade_id },
  });
  if (!aygA) throw new Error('No academic_year_grade found in Org A for testing');

  // Ensure assessment configuration exists
  let configA = await prisma.assessment_configurations.findFirst({
    where: { academic_year_grade_id: aygA.academic_year_grade_id },
  });
  if (!configA) {
    configA = await prisma.assessment_configurations.create({
      data: {
        academic_year_grade_id: aygA.academic_year_grade_id,
        assessment_required: true,
        assessment_mode: 'written',
        result_type: 'marks',
        maximum_marks: 100,
        pass_marks: 40,
        is_active: true,
      },
    });
  }

  const testSuffix = Date.now().toString().slice(-6);

  // Tracking arrays for clean teardown
  const userIdsToClean: string[] = [];
  const parentIdsToClean: string[] = [];
  const leadIdsToClean: string[] = [];
  const appIdsToClean: string[] = [];

  try {
    // -----------------------------------------------------------------------------------------
    // SETUP: Register Parent A and Parent B in Org A
    // -----------------------------------------------------------------------------------------
    const regParentA = await AuthService.registerParent({
      full_name: 'Parent Alpha',
      email: `parent_alpha_${testSuffix}@example.com`,
      phone: `91111${testSuffix}`,
      password: 'Password123!',
      org_id: orgA.org_id,
      source: 'website',
    });
    userIdsToClean.push(regParentA.user_id);
    parentIdsToClean.push(regParentA.parent_id);
    leadIdsToClean.push(regParentA.lead_id);

    const regParentB = await AuthService.registerParent({
      full_name: 'Parent Beta',
      email: `parent_beta_${testSuffix}@example.com`,
      phone: `92222${testSuffix}`,
      password: 'Password123!',
      org_id: orgA.org_id,
      source: 'website',
    });
    userIdsToClean.push(regParentB.user_id);
    parentIdsToClean.push(regParentB.parent_id);
    leadIdsToClean.push(regParentB.lead_id);

    // Create Application A for Parent A
    const appA = await AdmissionService.createApplication(
      {
        org_id: orgA.org_id,
        academic_year_id: academicYearA.academic_year_id,
        academic_year_grade_id: aygA.academic_year_grade_id,
        student_first_name: 'KidA',
        student_last_name: 'Alpha',
        date_of_birth: '2018-05-15',
        gender: 'male',
        parent_name: 'Parent Alpha',
        parent_email: `parent_alpha_${testSuffix}@example.com`,
        parent_phone: `91111${testSuffix}`,
        contact_relationship: 'father',
        status: 'submitted',
      },
      regParentA.user_id,
      orgA.org_id,
    );
    appIdsToClean.push(appA.application_id);
    if (appA.lead_id) leadIdsToClean.push(appA.lead_id);

    // Create Application B for Parent B
    const appB = await AdmissionService.createApplication(
      {
        org_id: orgA.org_id,
        academic_year_id: academicYearA.academic_year_id,
        academic_year_grade_id: aygA.academic_year_grade_id,
        student_first_name: 'KidB',
        student_last_name: 'Beta',
        date_of_birth: '2018-08-20',
        gender: 'female',
        parent_name: 'Parent Beta',
        parent_email: `parent_beta_${testSuffix}@example.com`,
        parent_phone: `92222${testSuffix}`,
        contact_relationship: 'mother',
        status: 'submitted',
      },
      regParentB.user_id,
      orgA.org_id,
    );
    appIdsToClean.push(appB.application_id);
    if (appB.lead_id) leadIdsToClean.push(appB.lead_id);

    // Record Assessment for Application A & Application B directly in repository
    await prisma.application_assessments.create({
      data: {
        application_id: appA.application_id,
        config_id: configA.config_id,
        assessment_date: new Date(),
        maximum_marks: 100,
        marks_obtained: 88,
        percentage: 88,
        result: 'pass',
        remarks: 'KidA demonstrated outstanding reasoning capability.',
      },
    });

    await prisma.application_assessments.create({
      data: {
        application_id: appB.application_id,
        config_id: configA.config_id,
        assessment_date: new Date(),
        maximum_marks: 100,
        marks_obtained: 92,
        percentage: 92,
        result: 'pass',
        remarks: 'KidB demonstrated exceptional mathematical aptitude.',
      },
    });

    // Record Decision for Application A (Approved) & Application B (Waitlisted)
    await prisma.admission_decisions.create({
      data: {
        application_id: appA.application_id,
        decision_status: 'approved',
        decision_date: new Date(),
        remarks: 'Offer confirmed by Admissions Committee.',
        scholarship_percentage: 15,
      },
    });

    await prisma.admission_decisions.create({
      data: {
        application_id: appB.application_id,
        decision_status: 'waitlisted',
        decision_date: new Date(),
        remarks: 'Position on waiting list #3.',
        waitlist_position: 3,
      },
    });

    // -----------------------------------------------------------------------------------------
    // TEST 1: Parent A successfully retrieves Parent A's Assessment
    // -----------------------------------------------------------------------------------------
    await test('TEST 1: Parent A can access their own Application A assessment', async () => {
      const assessment = await AdmissionAssessmentService.getAssessmentByApplication(
        appA.application_id,
        orgA.org_id,
        regParentA.user_id,
      );
      assert.ok(assessment, 'Assessment record must be returned');
      assert.strictEqual(Number(assessment?.marks_obtained), 88, 'Marks obtained must match 88');
      assert.strictEqual(assessment?.result, 'pass', 'Result must be pass');
    });

    // -----------------------------------------------------------------------------------------
    // TEST 2: Parent A successfully retrieves Parent A's Decision
    // -----------------------------------------------------------------------------------------
    await test('TEST 2: Parent A can access their own Application A decision', async () => {
      const decision = await AdmissionDecisionService.getDecisionByApplication(
        appA.application_id,
        orgA.org_id,
        regParentA.user_id,
      );
      assert.ok(decision, 'Decision record must be returned');
      assert.strictEqual(decision?.decision_status, 'approved', 'Decision must be approved');
      assert.strictEqual(Number(decision?.scholarship_percentage), 15, 'Scholarship must be 15%');
    });

    // -----------------------------------------------------------------------------------------
    // TEST 3: Parent A CANNOT access Parent B's Assessment (IDOR BLOCKED)
    // -----------------------------------------------------------------------------------------
    await test('TEST 3: Parent A CANNOT access Parent B application assessment (IDOR blocked)', async () => {
      let errorThrown = false;
      try {
        await AdmissionAssessmentService.getAssessmentByApplication(
          appB.application_id,
          orgA.org_id,
          regParentA.user_id, // Parent A trying to access App B
        );
      } catch (err: any) {
        errorThrown = true;
        assert.ok(
          err instanceof ApplicationNotFoundError || err.message.includes('not found'),
          `Expected ApplicationNotFoundError, got: ${err.message}`,
        );
      }
      assert.strictEqual(errorThrown, true, 'Service must reject access with 404 Not Found');
    });

    // -----------------------------------------------------------------------------------------
    // TEST 4: Parent A CANNOT access Parent B's Decision (IDOR BLOCKED)
    // -----------------------------------------------------------------------------------------
    await test('TEST 4: Parent A CANNOT access Parent B application decision (IDOR blocked)', async () => {
      let errorThrown = false;
      try {
        await AdmissionDecisionService.getDecisionByApplication(
          appB.application_id,
          orgA.org_id,
          regParentA.user_id, // Parent A trying to access App B
        );
      } catch (err: any) {
        errorThrown = true;
        assert.ok(
          err instanceof ApplicationNotFoundError || err.message.includes('not found'),
          `Expected ApplicationNotFoundError, got: ${err.message}`,
        );
      }
      assert.strictEqual(errorThrown, true, 'Service must reject access with 404 Not Found');
    });

    // -----------------------------------------------------------------------------------------
    // TEST 5: Front Office / Staff in Org A can view Application A & B assessments
    // -----------------------------------------------------------------------------------------
    await test('TEST 5: Front Office / Staff within Org A can view assessments in its organization', async () => {
      const assessmentA = await AdmissionAssessmentService.getAssessmentByApplication(
        appA.application_id,
        orgA.org_id,
        undefined, // Staff role does not pass parentUserId
      );
      assert.ok(assessmentA, 'Staff must be able to view App A assessment');

      const assessmentB = await AdmissionAssessmentService.getAssessmentByApplication(
        appB.application_id,
        orgA.org_id,
        undefined,
      );
      assert.ok(assessmentB, 'Staff must be able to view App B assessment');
    });

    // -----------------------------------------------------------------------------------------
    // TEST 6: Front Office / Staff in Org A can view Application A & B decisions
    // -----------------------------------------------------------------------------------------
    await test('TEST 6: Front Office / Staff within Org A can view decisions in its organization', async () => {
      const decisionA = await AdmissionDecisionService.getDecisionByApplication(
        appA.application_id,
        orgA.org_id,
        undefined, // Staff role
      );
      assert.ok(decisionA, 'Staff must be able to view App A decision');

      const decisionB = await AdmissionDecisionService.getDecisionByApplication(
        appB.application_id,
        orgA.org_id,
        undefined,
      );
      assert.ok(decisionB, 'Staff must be able to view App B decision');
    });

    // -----------------------------------------------------------------------------------------
    // TEST 7: Cross-Tenant Access is DENIED (Org B Staff querying Org A Application)
    // -----------------------------------------------------------------------------------------
    await test('TEST 7: Cross-tenant access is denied when Org B requests Org A application', async () => {
      let assessmentErr = false;
      try {
        await AdmissionAssessmentService.getAssessmentByApplication(
          appA.application_id,
          orgB!.org_id, // Org B requesting Org A's application
          undefined,
        );
      } catch (err: any) {
        assessmentErr = true;
      }
      assert.strictEqual(assessmentErr, true, 'Cross-tenant assessment query must be denied');

      let decisionErr = false;
      try {
        await AdmissionDecisionService.getDecisionByApplication(
          appA.application_id,
          orgB!.org_id, // Org B requesting Org A's application
          undefined,
        );
      } catch (err: any) {
        decisionErr = true;
      }
      assert.strictEqual(decisionErr, true, 'Cross-tenant decision query must be denied');
    });

    // -----------------------------------------------------------------------------------------
    // TEST 8: Controller-level request simulation for IDOR isolation
    // -----------------------------------------------------------------------------------------
    await test('TEST 8: Controller layer getByApplicationId enforces parent ownership', async () => {
      // Mock Parent A request targeting App A (Authorized)
      let jsonResultA: any = null;
      const reqParentA_AppA: any = {
        params: { id: appA.application_id },
        context: {
          user: {
            id: regParentA.user_id,
            org_id: orgA.org_id,
            roles: ['PARENT'],
          },
        },
      };
      const resParentA_AppA: any = {
        json: (data: any) => {
          jsonResultA = data;
          return resParentA_AppA;
        },
        status: (code: number) => resParentA_AppA,
      };

      await AdmissionAssessmentController.getByApplicationId(reqParentA_AppA, resParentA_AppA);
      assert.ok(jsonResultA, 'Controller must return assessment for Parent A on App A');
      assert.strictEqual(Number(jsonResultA.marks_obtained), 88);

      // Mock Parent A request targeting App B (IDOR Attempt -> Must return 404)
      let statusCodeB = 200;
      let errorJsonB: any = null;
      const reqParentA_AppB: any = {
        params: { id: appB.application_id },
        context: {
          user: {
            id: regParentA.user_id,
            org_id: orgA.org_id,
            roles: ['PARENT'],
          },
        },
      };
      const resParentA_AppB: any = {
        status: (code: number) => {
          statusCodeB = code;
          return {
            json: (data: any) => {
              errorJsonB = data;
            },
          };
        },
        json: (data: any) => {
          errorJsonB = data;
        },
      };

      await AdmissionAssessmentController.getByApplicationId(reqParentA_AppB, resParentA_AppB);
      assert.strictEqual(
        statusCodeB,
        404,
        'Controller must return HTTP 404 for unauthorized parent',
      );
      assert.ok(errorJsonB?.error?.includes('not found') || errorJsonB?.code === 'NOT_FOUND');
    });
  } finally {
    // -----------------------------------------------------------------------------------------
    // TEARDOWN: Clean up test artifacts
    // -----------------------------------------------------------------------------------------
    console.log('\n  Cleaning up test database artifacts...');
    for (const appId of appIdsToClean) {
      await prisma.application_assessments.deleteMany({ where: { application_id: appId } });
      await prisma.admission_decisions.deleteMany({ where: { application_id: appId } });
      await prisma.admission_fee_payments.deleteMany({ where: { application_id: appId } });
      await prisma.admission_documents.deleteMany({ where: { application_id: appId } });
      await prisma.admissions_applications.deleteMany({ where: { application_id: appId } });
    }
    for (const leadId of leadIdsToClean) {
      await prisma.leads.deleteMany({ where: { lead_id: leadId } });
    }
    for (const parentId of parentIdsToClean) {
      await prisma.parents.deleteMany({ where: { parent_id: parentId } });
    }
    for (const userId of userIdsToClean) {
      await prisma.user_roles.deleteMany({ where: { user_id: userId } });
      await prisma.users.deleteMany({ where: { user_id: userId } });
    }
    if (createdOrgB && orgB) {
      await prisma.organizations.deleteMany({ where: { org_id: orgB.org_id } });
    }
  }

  console.log(
    `\nParent IDOR & Authorization Tests Complete: ${passed} passed, ${failed} failed.\n`,
  );
  if (failed > 0) {
    throw new Error(`${failed} IDOR Authorization tests failed!`);
  }
}

if (require.main === module) {
  runParentIdorAuthorizationTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Test Suite Failed:', err);
      process.exit(1);
    });
}
