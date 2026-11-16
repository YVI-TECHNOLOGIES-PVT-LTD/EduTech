import assert from 'assert';
import prisma from '../../../lib/prismaClient';
import { AuthService } from '../../../auth/auth.service';
import { AdmissionService } from '../services/admission.service';
import { StudentService } from '../../student-management/services/student.service';

export async function runParentLeadApplicationCardinalityTests() {
  console.log('\n============================================================');
  console.log('PARENT -> LEAD -> APPLICATION CARDINALITY & NAME MAPPING TEST SUITE');
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

  // Setup test organization & academic year
  const org = await prisma.organizations.findFirst({ where: { status: 'active' } });
  if (!org) throw new Error('No active organization found for testing');

  const academicYear = await prisma.academic_years.findFirst({
    where: { org_id: org.org_id },
  });
  if (!academicYear) throw new Error('No academic year found for testing');

  const grade = await prisma.grades.findFirst({ where: { org_id: org.org_id } });
  if (!grade) throw new Error('No grade found for testing');

  const ayg = await prisma.academic_year_grades.findFirst({
    where: { academic_year_id: academicYear.academic_year_id, grade_id: grade.grade_id },
  });
  if (!ayg) throw new Error('No academic_year_grade found for testing');

  const testSuffix = Date.now().toString().slice(-6);

  // Track created entity IDs for clean cleanup
  const userIdsToClean: string[] = [];
  const parentIdsToClean: string[] = [];
  const leadIdsToClean: string[] = [];
  const appIdsToClean: string[] = [];

  try {
    // -------------------------------------------------------------------------------------------------
    // TEST 1: Parent Registration creates unassigned Lead with correct parent/child name semantics
    // -------------------------------------------------------------------------------------------------
    let regHariResult: any = null;
    let regHariLead: any = null;
    let hariParent: any = null;

    await test('TEST 1: Registration creates unassigned Lead (Parent name != Child name)', async () => {
      const regEmail = `hari_kumar_${testSuffix}@example.com`;
      const regPhone = `98765${testSuffix}`;

      regHariResult = await AuthService.registerParent({
        full_name: 'Hari Kumar',
        email: regEmail,
        phone: regPhone,
        password: 'Password123!',
        org_id: org.org_id,
        source: 'website',
      });

      userIdsToClean.push(regHariResult.user_id);
      parentIdsToClean.push(regHariResult.parent_id);
      leadIdsToClean.push(regHariResult.lead_id);

      assert.ok(regHariResult.success, 'Registration must succeed');
      assert.ok(regHariResult.parent_id, 'Parent record must be created');
      assert.ok(regHariResult.lead_id, 'Registration Lead must be created immediately');

      // Verify User record
      const dbUser = await prisma.users.findUnique({
        where: { user_id: regHariResult.user_id },
      });
      assert.strictEqual(dbUser?.first_name, 'Hari', 'User first_name must be Hari');
      assert.strictEqual(dbUser?.last_name, 'Kumar', 'User last_name must be Kumar');

      // Verify Parent record
      hariParent = await prisma.parents.findUnique({
        where: { parent_id: regHariResult.parent_id },
      });
      assert.strictEqual(hariParent?.first_name, 'Hari', 'Parent first_name must be Hari');
      assert.strictEqual(hariParent?.last_name, 'Kumar', 'Parent last_name must be Kumar');

      // Verify Lead record semantics
      regHariLead = await prisma.leads.findUnique({
        where: { lead_id: regHariResult.lead_id },
      });
      assert.ok(regHariLead, 'Registration Lead must exist in DB');
      assert.strictEqual(
        regHariLead.parent_id,
        hariParent.parent_id,
        'Lead.parent_id must link to registered Parent',
      );
      assert.strictEqual(
        regHariLead.contact_name,
        'Hari Kumar',
        'Lead.contact_name must be Hari Kumar',
      );

      // CRITICAL ASSERTION: Parent registration name MUST NOT populate child student_first_name
      assert.notStrictEqual(
        regHariLead.student_first_name,
        'Hari',
        'Lead.student_first_name must NEVER be parent first name Hari',
      );
      assert.notStrictEqual(
        regHariLead.student_last_name,
        'Kumar',
        'Lead.student_last_name must NEVER be parent last name Kumar',
      );
      assert.strictEqual(
        regHariLead.student_first_name,
        'Applicant',
        'Lead.student_first_name must be neutral placeholder Applicant',
      );
      assert.strictEqual(
        regHariLead.student_last_name,
        null,
        'Lead.student_last_name must be null',
      );
    });

    // -------------------------------------------------------------------------------------------------
    // TEST 2: First child (Rahul) application reuses & updates the registration Lead
    // -------------------------------------------------------------------------------------------------
    let appHariRahul: any = null;

    await test('TEST 2: First child (Rahul) application reuses & updates registration Lead', async () => {
      appHariRahul = await AdmissionService.createApplication(
        {
          org_id: org.org_id,
          academic_year_id: academicYear.academic_year_id,
          grade_id: grade.grade_id,
          student_first_name: 'Rahul',
          student_last_name: 'Kumar',
          date_of_birth: '2016-04-10',
          gender: 'male',
          parent_name: 'Hari Kumar',
          parent_phone: `98765${testSuffix}`,
        },
        regHariResult.user_id,
        org.org_id,
      );

      appIdsToClean.push(appHariRahul.application_id);

      assert.ok(appHariRahul.application_id, 'Application must be created');
      assert.strictEqual(
        appHariRahul.lead_id,
        regHariLead.lead_id,
        'Application must reuse the registration Lead L001',
      );

      // Verify Lead was updated with Rahul's details
      const updatedLead = await prisma.leads.findUnique({
        where: { lead_id: regHariLead.lead_id },
      });
      assert.strictEqual(
        updatedLead?.student_first_name,
        'Rahul',
        'Lead student_first_name must be updated to Rahul',
      );
      assert.strictEqual(
        updatedLead?.student_last_name,
        'Kumar',
        'Lead student_last_name must be updated to Kumar',
      );
      assert.strictEqual(
        updatedLead?.contact_name,
        'Hari Kumar',
        'Lead contact_name must remain Hari Kumar',
      );
      assert.strictEqual(
        updatedLead?.parent_id,
        hariParent.parent_id,
        'Lead parent_id must remain P001',
      );

      // Total leads for Hari must remain 1
      const hariLeadCount = await prisma.leads.count({
        where: { parent_id: hariParent.parent_id },
      });
      assert.strictEqual(
        hariLeadCount,
        1,
        'Parent Hari must have exactly 1 Lead for first child Rahul',
      );
    });

    // -------------------------------------------------------------------------------------------------
    // TEST 3: Second child (Priya) application creates a new separate Lead under the same Parent
    // -------------------------------------------------------------------------------------------------
    let appHariPriya: any = null;

    await test('TEST 3: Second child (Priya) application creates a new separate Lead under same Parent', async () => {
      appHariPriya = await AdmissionService.createApplication(
        {
          org_id: org.org_id,
          academic_year_id: academicYear.academic_year_id,
          grade_id: grade.grade_id,
          student_first_name: 'Priya',
          student_last_name: 'Kumar',
          date_of_birth: '2019-08-25',
          gender: 'female',
          parent_name: 'Hari Kumar',
          parent_phone: `98765${testSuffix}`,
        },
        regHariResult.user_id,
        org.org_id,
      );

      appIdsToClean.push(appHariPriya.application_id);
      leadIdsToClean.push(appHariPriya.lead_id);

      assert.ok(appHariPriya.application_id, 'Application for Priya must be created');
      assert.notStrictEqual(
        appHariPriya.lead_id,
        regHariLead.lead_id,
        'Priya must have a distinct Lead ID from Rahul',
      );

      const priyaLead = await prisma.leads.findUnique({
        where: { lead_id: appHariPriya.lead_id },
      });
      assert.ok(priyaLead, 'Priya Lead record must exist');
      assert.strictEqual(
        priyaLead.student_first_name,
        'Priya',
        'Priya Lead student_first_name must be Priya',
      );
      assert.strictEqual(
        priyaLead.parent_id,
        hariParent.parent_id,
        'Priya Lead parent_id must link to same Parent P001',
      );

      // Total leads for Hari must now be 2
      const hariLeadCount = await prisma.leads.count({
        where: { parent_id: hariParent.parent_id },
      });
      assert.strictEqual(
        hariLeadCount,
        2,
        'Parent Hari must now have exactly 2 Leads (Rahul & Priya)',
      );
    });

    // -------------------------------------------------------------------------------------------------
    // TEST 4: Existing Enquiry is claimed upon registration (with phone normalization)
    // -------------------------------------------------------------------------------------------------
    await test('TEST 4: Existing Enquiry Lead is claimed upon parent registration without overwriting child name', async () => {
      const enqPhoneFormatted = `+91 98888 ${testSuffix}`;
      const regPhoneRaw = `98888${testSuffix}`;
      const enqEmail = `sanjay_parent_${testSuffix}@example.com`;

      // 1. Pre-existing unlinked enquiry lead
      const year = new Date().getFullYear();
      const enqLead = await prisma.leads.create({
        data: {
          org_id: org.org_id,
          lead_number: `LEAD-${year}-${testSuffix}-ENQ`,
          academic_year_grade_id: ayg.academic_year_grade_id,
          student_first_name: 'Sanjay',
          student_last_name: 'Gupta',
          contact_name: 'Manoj Gupta',
          contact_phone: enqPhoneFormatted,
          contact_email: enqEmail,
          source: 'website',
          stage: 'enquiry_received',
          parent_id: null,
        },
      });
      leadIdsToClean.push(enqLead.lead_id);

      // 2. Parent registers with formatted/raw phone
      const regManoj = await AuthService.registerParent({
        full_name: 'Manoj Gupta',
        email: enqEmail,
        phone: regPhoneRaw,
        password: 'Password123!',
        org_id: org.org_id,
      });

      userIdsToClean.push(regManoj.user_id);
      parentIdsToClean.push(regManoj.parent_id);

      assert.ok(regManoj.success, 'Registration must succeed');
      assert.strictEqual(regManoj.claimed, true, 'Registration must claim existing enquiry lead');
      assert.strictEqual(
        regManoj.lead_id,
        enqLead.lead_id,
        'Claimed lead_id must match existing enquiry lead',
      );

      // 3. Verify Lead in DB
      const claimedDbLead = await prisma.leads.findUnique({
        where: { lead_id: enqLead.lead_id },
      });
      assert.strictEqual(
        claimedDbLead?.parent_id,
        regManoj.parent_id,
        'Enquiry lead parent_id must now be linked',
      );
      assert.strictEqual(
        claimedDbLead?.student_first_name,
        'Sanjay',
        'Child first_name Sanjay must NOT be overwritten',
      );
      assert.strictEqual(
        claimedDbLead?.student_last_name,
        'Gupta',
        'Child last_name Gupta must NOT be overwritten',
      );

      // 4. Verify no second lead was created
      const manojLeadCount = await prisma.leads.count({
        where: { parent_id: regManoj.parent_id },
      });
      assert.strictEqual(
        manojLeadCount,
        1,
        'Parent Manoj must have exactly 1 Lead (the claimed enquiry lead)',
      );
    });

    // -------------------------------------------------------------------------------------------------
    // TEST 5: Repeating application creation for same child (Rahul) returns existing Application (1:1 rule)
    // -------------------------------------------------------------------------------------------------
    await test('TEST 5: Repeating application creation for same child (Rahul) returns existing Application idempotently', async () => {
      const appHariRahul2 = await AdmissionService.createApplication(
        {
          org_id: org.org_id,
          academic_year_id: academicYear.academic_year_id,
          grade_id: grade.grade_id,
          student_first_name: 'Rahul',
          student_last_name: 'Kumar',
          date_of_birth: '2016-04-10',
          gender: 'male',
        },
        regHariResult.user_id,
        org.org_id,
      );

      // Verify idempotent return
      assert.ok(appHariRahul2.application_id, 'Application for Rahul must be returned');
      assert.strictEqual(
        appHariRahul2.application_id,
        appHariRahul.application_id,
        'Repeating application creation for the same Lead must return the existing Application (1:1 Lead -> Application)',
      );
      assert.strictEqual(
        appHariRahul2.application_number,
        appHariRahul.application_number,
        'Application number must match existing Application',
      );
      assert.strictEqual(
        appHariRahul2.lead_id,
        regHariLead.lead_id,
        'Application must reuse same Lead L001',
      );

      // Verify existing application persisted fields remain unchanged
      const dbApp = await prisma.admissions_applications.findUnique({
        where: { application_id: appHariRahul.application_id },
      });
      assert.strictEqual(
        dbApp?.status,
        appHariRahul.status,
        'Application status must remain unchanged',
      );
      assert.strictEqual(
        dbApp?.lead_id,
        regHariLead.lead_id,
        'Application lead_id must remain unchanged',
      );

      // Verify only 1 application exists in DB for Rahul's lead
      const rahulAppCount = await prisma.admissions_applications.count({
        where: { lead_id: regHariLead.lead_id },
      });
      assert.strictEqual(rahulAppCount, 1, 'Rahul must have exactly 1 Application record in DB');

      const hariLeadCount = await prisma.leads.count({
        where: { parent_id: hariParent.parent_id },
      });
      assert.strictEqual(
        hariLeadCount,
        2,
        'Parent Hari must STILL have exactly 2 Leads total (Rahul and Priya)',
      );
    });

    // -------------------------------------------------------------------------------------------------
    // TEST 6: Parent name never becomes child name
    // -------------------------------------------------------------------------------------------------
    await test('TEST 6: Parent name is strictly contact_name and never becomes student_first_name', async () => {
      const pRahulLead = await prisma.leads.findUnique({
        where: { lead_id: regHariLead.lead_id },
      });
      assert.strictEqual(
        pRahulLead?.contact_name,
        'Hari Kumar',
        'Contact name must be Parent name Hari Kumar',
      );
      assert.strictEqual(
        pRahulLead?.student_first_name,
        'Rahul',
        'Student first name must be Child name Rahul',
      );
      assert.notStrictEqual(
        pRahulLead?.student_first_name,
        'Hari',
        'Student first name must NEVER be Hari',
      );
    });

    // -------------------------------------------------------------------------------------------------
    // TEST 7: Concurrent / duplicate application creation safely resolves without P2002 failure
    // -------------------------------------------------------------------------------------------------
    await test('TEST 7: Concurrent application creation for same Lead resolves idempotently leaving 1 record', async () => {
      const regAnil = await AuthService.registerParent({
        full_name: 'Anil Sharma',
        email: `anil_sharma_${testSuffix}@example.com`,
        phone: `93333${testSuffix}`,
        password: 'Password123!',
        org_id: org.org_id,
      });

      userIdsToClean.push(regAnil.user_id);
      parentIdsToClean.push(regAnil.parent_id);
      leadIdsToClean.push(regAnil.lead_id);

      const appPayload = {
        org_id: org.org_id,
        academic_year_id: academicYear.academic_year_id,
        grade_id: grade.grade_id,
        student_first_name: 'Aarav',
        student_last_name: 'Sharma',
        date_of_birth: '2017-02-14',
        gender: 'male',
        parent_name: 'Anil Sharma',
        parent_phone: `93333${testSuffix}`,
      };

      // Launch 3 simultaneous concurrent application creation requests
      const [res1, res2, res3] = await Promise.all([
        AdmissionService.createApplication(appPayload, regAnil.user_id, org.org_id),
        AdmissionService.createApplication(appPayload, regAnil.user_id, org.org_id),
        AdmissionService.createApplication(appPayload, regAnil.user_id, org.org_id),
      ]);

      appIdsToClean.push(res1.application_id);

      assert.ok(res1.application_id, 'First concurrent response must have application_id');
      assert.ok(res2.application_id, 'Second concurrent response must have application_id');
      assert.ok(res3.application_id, 'Third concurrent response must have application_id');

      assert.strictEqual(
        res1.application_id,
        res2.application_id,
        'Concurrent request 1 and 2 must resolve to same application_id',
      );
      assert.strictEqual(
        res2.application_id,
        res3.application_id,
        'Concurrent request 2 and 3 must resolve to same application_id',
      );

      // Verify exactly 1 application was created in DB for Aarav
      const aaravAppCount = await prisma.admissions_applications.count({
        where: { lead_id: res1.lead_id },
      });
      assert.strictEqual(
        aaravAppCount,
        1,
        'Exactly 1 Application record must exist in DB despite concurrent creation requests',
      );
    });

    // -------------------------------------------------------------------------------------------------
    // TEST 8: Enrollment preserves Lead -> Application cardinality
    // -------------------------------------------------------------------------------------------------
    await test('TEST 8: Enrollment converts application to Student while preserving Lead relationships', async () => {
      await prisma.admissions_applications.update({
        where: { application_id: appHariRahul.application_id },
        data: { status: 'approved' },
      });

      await prisma.admission_decisions.create({
        data: {
          application_id: appHariRahul.application_id,
          decision_status: 'approved',
          decision_date: new Date(),
        },
      });

      await prisma.admission_fee_payments.create({
        data: {
          application_id: appHariRahul.application_id,
          payment_status: 'paid',
          amount: 5000,
          payment_date: new Date(),
        },
      });

      const student = await StudentService.convertApplicationToStudent(
        appHariRahul.application_id,
        regHariResult.user_id,
        org.org_id,
        {},
      );
      assert.ok(student, 'Student record must be created');

      const dbStudent = await prisma.students.findUnique({
        where: { application_id: appHariRahul.application_id },
      });
      assert.ok(dbStudent, 'Student record must exist in DB');
      assert.strictEqual(dbStudent.first_name, 'Rahul', 'Student first_name must be Rahul');

      const appRahulRefreshed = await prisma.admissions_applications.findUnique({
        where: { application_id: appHariRahul.application_id },
      });
      assert.strictEqual(
        appRahulRefreshed?.lead_id,
        regHariLead.lead_id,
        'Enrolled app lead_id must remain L001',
      );
    });
  } finally {
    // -------------------------------------------------------------------------------------------------
    // Clean up test data
    // -------------------------------------------------------------------------------------------------
    console.log('\nCleaning up test artifacts...');
    try {
      if (appIdsToClean.length > 0) {
        const students = await prisma.students.findMany({
          where: { application_id: { in: appIdsToClean } },
          select: { student_id: true },
        });
        const studentIds = students.map((s: { student_id: string }) => s.student_id);
        if (studentIds.length > 0) {
          await prisma.student_enrollments.deleteMany({
            where: { student_id: { in: studentIds } },
          });
          await prisma.student_parents.deleteMany({ where: { student_id: { in: studentIds } } });
          await prisma.students.deleteMany({ where: { student_id: { in: studentIds } } });
        }
        await prisma.admission_documents.deleteMany({
          where: { application_id: { in: appIdsToClean } },
        });
        await prisma.admission_fee_payments.deleteMany({
          where: { application_id: { in: appIdsToClean } },
        });
        await prisma.admissions_applications.deleteMany({
          where: { application_id: { in: appIdsToClean } },
        });
      }

      if (leadIdsToClean.length > 0) {
        await prisma.leads.deleteMany({ where: { lead_id: { in: leadIdsToClean } } });
      }

      if (parentIdsToClean.length > 0) {
        await prisma.parents.deleteMany({ where: { parent_id: { in: parentIdsToClean } } });
      }

      if (userIdsToClean.length > 0) {
        await prisma.user_roles.deleteMany({ where: { user_id: { in: userIdsToClean } } });
        await prisma.users.deleteMany({ where: { user_id: { in: userIdsToClean } } });
      }
      console.log('Cleanup completed.');
    } catch (cleanupErr: any) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }
  }

  console.log(`\n============================================================`);
  console.log(`TEST SUITE FINISHED: ${passed} passed, ${failed} failed.`);
  console.log(`============================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runParentLeadApplicationCardinalityTests().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
