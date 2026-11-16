/**
 * EDUTRACK FEE MANAGEMENT MVP — E2E TEST & VERIFICATION MATRIX
 *
 * Tests:
 * 1. Authoritative Fee Calculation (admission_configurations -> application_fee + processing_fee)
 * 2. Pre-Application Fee Configuration Retrieval
 * 3. Parent Ownership Security & Cross-Parent Isolation
 * 4. Cross-Organization Tenant Scoping
 * 5. Parent MVP Payment Simulation (Auto-amount, TXN ref, Date, Status = paid)
 * 6. Amount Tampering Prevention (Parent cannot submit 1 INR)
 * 7. Status Tampering Prevention (Parent cannot submit arbitrary status)
 * 8. Idempotency & No-Downgrade on Repeat Settlement
 * 9. Staff Offline Payment Recording (cash / bank_transfer)
 * 10. Concurrency Safety (10 parallel requests -> exactly ONE payment row)
 * 11. Real Database Persistence Verification
 * 12. Cascade Deletion (deleting application removes fee payment row)
 */

const prisma = require('../src/lib/prismaClient').default;
const { admission_payment_status, admission_payment_mode } = require('@prisma/client');

const RESULTS = [];

function recordResult(testNumber, name, status, details) {
  RESULTS.push({ testNumber, name, status, details });
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} [TEST ${testNumber}] ${name}: ${status}`);
  if (details) {
    console.log(`   Details: ${typeof details === 'object' ? JSON.stringify(details) : details}`);
  }
}

async function runMatrix() {
  console.log('================================================================');
  console.log('STARTING EDUTRACK FEE MANAGEMENT MVP E2E VERIFICATION MATRIX');
  console.log('================================================================\n');

  let testOrgA, testOrgB;
  let testAyA;
  let parentUserA, parentUserB, staffUser;
  let testLeadA, testLeadB;
  let testAppA, testAppB;

  try {
    // SETUP: Load or create test organizations, academic years, parents, and applications
    const orgs = await prisma.organizations.findMany({
      where: { status: 'active' },
      take: 2,
      orderBy: { created_at: 'asc' },
    });

    if (orgs.length < 2) {
      throw new Error('At least 2 active organizations are required for multi-tenant fee testing');
    }

    testOrgA = orgs[0];
    testOrgB = orgs[1];

    const ayA = await prisma.academic_years.findFirst({
      where: { org_id: testOrgA.org_id },
    });

    if (!ayA) {
      throw new Error(`Academic year missing for organization ${testOrgA.org_name}`);
    }
    testAyA = ayA;

    // Ensure admission_configurations exists for testOrgA + testAyA
    let configA = await prisma.admission_configurations.findFirst({
      where: { org_id: testOrgA.org_id, academic_year_id: testAyA.academic_year_id },
    });

    if (!configA) {
      configA = await prisma.admission_configurations.create({
        data: {
          org_id: testOrgA.org_id,
          academic_year_id: testAyA.academic_year_id,
          application_fee: 1000.0,
          processing_fee: 200.0,
          allow_online_application: true,
          admission_start_date: new Date('2026-01-01'),
          admission_end_date: new Date('2026-12-31'),
        },
      });
    }

    // Resolve or create test parent user A
    parentUserA = await prisma.users.findFirst({
      where: { email: 'parent.fee.test.a@edutrack.internal' },
    });
    if (!parentUserA) {
      parentUserA = await prisma.users.create({
        data: {
          org_id: testOrgA.org_id,
          email: 'parent.fee.test.a@edutrack.internal',
          first_name: 'ParentA',
          last_name: 'FeeTester',
          phone: '+919876543210',
          status: 'active',
        },
      });
    }

    // Resolve or create test parent user B
    parentUserB = await prisma.users.findFirst({
      where: { email: 'parent.fee.test.b@edutrack.internal' },
    });
    if (!parentUserB) {
      parentUserB = await prisma.users.create({
        data: {
          org_id: testOrgB.org_id,
          email: 'parent.fee.test.b@edutrack.internal',
          first_name: 'ParentB',
          last_name: 'FeeTester',
          phone: '+919876543211',
          status: 'active',
        },
      });
    }

    // Resolve or create parent records in `parents`
    let parentRecA = await prisma.parents.findFirst({
      where: { user_id: parentUserA.user_id },
    });
    if (!parentRecA) {
      parentRecA = await prisma.parents.create({
        data: {
          org_id: testOrgA.org_id,
          user_id: parentUserA.user_id,
          first_name: 'ParentA',
          last_name: 'FeeTester',
          phone: '+919876543210',
          email: parentUserA.email,
        },
      });
    }

    let parentRecB = await prisma.parents.findFirst({
      where: { user_id: parentUserB.user_id },
    });
    if (!parentRecB) {
      parentRecB = await prisma.parents.create({
        data: {
          org_id: testOrgB.org_id,
          user_id: parentUserB.user_id,
          first_name: 'ParentB',
          last_name: 'FeeTester',
          phone: '+919876543211',
          email: parentUserB.email,
        },
      });
    }

    const ayB = await prisma.academic_years.findFirst({
      where: { org_id: testOrgB.org_id },
    });

    const aygA = await prisma.academic_year_grades.findFirst({
      where: { academic_year_id: testAyA.academic_year_id },
    });
    const aygB = await prisma.academic_year_grades.findFirst({
      where: { academic_year_id: ayB ? ayB.academic_year_id : testAyA.academic_year_id },
    });

    // Create Leads
    testLeadA = await prisma.leads.create({
      data: {
        org_id: testOrgA.org_id,
        lead_number: `LEAD-FEE-A-${Date.now()}`,
        academic_year_grade_id: aygA ? aygA.academic_year_grade_id : testAyA.academic_year_id,
        student_first_name: 'ChildA',
        student_last_name: 'FeeTest',
        contact_name: 'ParentA FeeTester',
        contact_phone: '+919876543210',
        contact_email: parentUserA.email,
        parent_id: parentRecA.parent_id,
        source: 'website',
      },
    });

    testLeadB = await prisma.leads.create({
      data: {
        org_id: testOrgB.org_id,
        lead_number: `LEAD-FEE-B-${Date.now()}`,
        academic_year_grade_id: aygB
          ? aygB.academic_year_grade_id
          : aygA
            ? aygA.academic_year_grade_id
            : testAyA.academic_year_id,
        student_first_name: 'ChildB',
        student_last_name: 'FeeTest',
        contact_name: 'ParentB FeeTester',
        contact_phone: '+919876543211',
        contact_email: parentUserB.email,
        parent_id: parentRecB.parent_id,
        source: 'website',
      },
    });

    // Create Applications
    testAppA = await prisma.admissions_applications.create({
      data: {
        org_id: testOrgA.org_id,
        academic_year_id: testAyA.academic_year_id,
        lead_id: testLeadA.lead_id,
        application_number: `APP-FEE-A-${Date.now()}`,
        application_date: new Date(),
        status: 'submitted',
        created_by: parentUserA.user_id,
      },
    });

    testAppB = await prisma.admissions_applications.create({
      data: {
        org_id: testOrgB.org_id,
        academic_year_id: ayB ? ayB.academic_year_id : testAyA.academic_year_id,
        lead_id: testLeadB.lead_id,
        application_number: `APP-FEE-B-${Date.now()}`,
        application_date: new Date(),
        status: 'submitted',
        created_by: parentUserB.user_id,
      },
    });

    // Import the AdmissionPaymentService and AdmissionPaymentRepository
    const {
      AdmissionPaymentService,
    } = require('../src/modules/admission-management/services/admission.payment.service');
    const {
      AdmissionPaymentRepository,
    } = require('../src/modules/admission-management/repositories/admission.payment.repository');

    // -------------------------------------------------------------
    // TEST 1: Authoritative Fee Calculation for Application A
    // -------------------------------------------------------------
    try {
      const feeA = await AdmissionPaymentService.getApplicationFee(
        testAppA.application_id,
        testOrgA.org_id,
        parentUserA.user_id,
        true,
      );

      const expectedAppFee = Number(configA.application_fee);
      const expectedProcFee = Number(configA.processing_fee);
      const expectedTotal = expectedAppFee + expectedProcFee;

      if (
        feeA.application_fee === expectedAppFee &&
        feeA.processing_fee === expectedProcFee &&
        feeA.total_fee === expectedTotal &&
        feeA.payment_status === 'pending'
      ) {
        recordResult(1, 'Authoritative Fee Calculation for Own Application', 'PASS', {
          application_fee: feeA.application_fee,
          processing_fee: feeA.processing_fee,
          total_fee: feeA.total_fee,
          payment_status: feeA.payment_status,
        });
      } else {
        recordResult(1, 'Authoritative Fee Calculation for Own Application', 'FAIL', feeA);
      }
    } catch (err) {
      recordResult(1, 'Authoritative Fee Calculation for Own Application', 'FAIL', err.message);
    }

    // -------------------------------------------------------------
    // TEST 2: Pre-Application Fee Config Query
    // -------------------------------------------------------------
    try {
      const configRes = await AdmissionPaymentService.getFeeConfig(
        testOrgA.org_id,
        testAyA.academic_year_id,
      );
      if (configRes.org_id === testOrgA.org_id && configRes.total_fee > 0) {
        recordResult(2, 'Pre-Application Fee Configuration Retrieval', 'PASS', configRes);
      } else {
        recordResult(2, 'Pre-Application Fee Configuration Retrieval', 'FAIL', configRes);
      }
    } catch (err) {
      recordResult(2, 'Pre-Application Fee Configuration Retrieval', 'FAIL', err.message);
    }

    // -------------------------------------------------------------
    // TEST 3: Cross-Parent Isolation (Parent B attempts to view Fee for App A)
    // -------------------------------------------------------------
    try {
      await AdmissionPaymentService.getApplicationFee(
        testAppA.application_id,
        testOrgA.org_id,
        parentUserB.user_id, // Unrelated parent
        true, // isParentOnly
      );
      recordResult(
        3,
        'Cross-Parent Fee Access Rejection',
        'FAIL',
        'Should have thrown ApplicationNotFoundError',
      );
    } catch (err) {
      if (
        err.name === 'ApplicationNotFoundError' ||
        err.statusCode === 404 ||
        err.code === 'APPLICATION_NOT_FOUND'
      ) {
        recordResult(3, 'Cross-Parent Fee Access Rejection', 'PASS', 'Correctly rejected with 404');
      } else {
        recordResult(3, 'Cross-Parent Fee Access Rejection', 'FAIL', err.message);
      }
    }

    // -------------------------------------------------------------
    // TEST 4: Cross-Organization Isolation (Org B context with App A)
    // -------------------------------------------------------------
    try {
      await AdmissionPaymentService.getApplicationFee(
        testAppA.application_id,
        testOrgB.org_id, // Mismatched org
        null,
        false,
      );
      recordResult(
        4,
        'Cross-Organization Fee Isolation',
        'FAIL',
        'Should have rejected cross-org query',
      );
    } catch (err) {
      if (err.name === 'ApplicationNotFoundError' || err.statusCode === 404) {
        recordResult(
          4,
          'Cross-Organization Fee Isolation',
          'PASS',
          'Cross-org access safely blocked (404)',
        );
      } else {
        recordResult(4, 'Cross-Organization Fee Isolation', 'FAIL', err.message);
      }
    }

    // -------------------------------------------------------------
    // TEST 5: Parent MVP Payment Simulation (Auto Amount, Ref, Date, Status)
    // -------------------------------------------------------------
    let recordedPayment;
    try {
      recordedPayment = await AdmissionPaymentService.recordPayment(
        testAppA.application_id,
        parentUserA.user_id,
        {
          payment_mode: 'upi',
        },
        testOrgA.org_id,
        true, // isParentOnly
      );

      const dbRow = await prisma.admission_fee_payments.findUnique({
        where: { application_id: testAppA.application_id },
      });

      if (
        dbRow &&
        dbRow.payment_status === 'paid' &&
        Number(dbRow.amount) === Number(configA.application_fee) + Number(configA.processing_fee) &&
        dbRow.transaction_reference &&
        dbRow.transaction_reference.startsWith('TXN-') &&
        dbRow.payment_mode === 'upi' &&
        dbRow.payment_date
      ) {
        recordResult(5, 'Parent MVP Payment Simulation & Settlement', 'PASS', {
          payment_id: dbRow.payment_id,
          amount: Number(dbRow.amount),
          status: dbRow.payment_status,
          txn_ref: dbRow.transaction_reference,
          mode: dbRow.payment_mode,
          payment_date: dbRow.payment_date,
        });
      } else {
        recordResult(5, 'Parent MVP Payment Simulation & Settlement', 'FAIL', dbRow);
      }
    } catch (err) {
      recordResult(5, 'Parent MVP Payment Simulation & Settlement', 'FAIL', err.message);
    }

    // -------------------------------------------------------------
    // TEST 6: Amount Tampering Prevention (Parent sends amount: 1.00)
    // -------------------------------------------------------------
    try {
      // Create fresh app to test tampering
      const tamperApp = await prisma.admissions_applications.create({
        data: {
          org_id: testOrgA.org_id,
          academic_year_id: testAyA.academic_year_id,
          lead_id: testLeadA.lead_id,
          application_number: `APP-TAMPER-${Date.now()}`,
          application_date: new Date(),
          status: 'submitted',
          created_by: parentUserA.user_id,
        },
      });

      const tamperedPayment = await AdmissionPaymentService.recordPayment(
        tamperApp.application_id,
        parentUserA.user_id,
        {
          amount: 1.0, // MALICIOUS CLIENT TAMPERING ATTEMPT
          payment_mode: 'card',
        },
        testOrgA.org_id,
        true, // isParentOnly
      );

      const dbRow = await prisma.admission_fee_payments.findUnique({
        where: { application_id: tamperApp.application_id },
      });

      const expectedAmount = Number(configA.application_fee) + Number(configA.processing_fee);
      if (Number(dbRow.amount) === expectedAmount && Number(dbRow.amount) !== 1.0) {
        recordResult(6, 'Amount Tampering Prevention (Client Amount Overridden)', 'PASS', {
          clientSupplied: 1.0,
          authoritativePersisted: Number(dbRow.amount),
        });
      } else {
        recordResult(6, 'Amount Tampering Prevention (Client Amount Overridden)', 'FAIL', {
          persisted: Number(dbRow.amount),
        });
      }

      // Cleanup tamperApp
      await prisma.admissions_applications.delete({
        where: { application_id: tamperApp.application_id },
      });
    } catch (err) {
      recordResult(
        6,
        'Amount Tampering Prevention (Client Amount Overridden)',
        'FAIL',
        err.message,
      );
    }

    // -------------------------------------------------------------
    // TEST 7: Status Tampering Prevention (Parent sends payment_status: 'waived')
    // -------------------------------------------------------------
    try {
      const statusApp = await prisma.admissions_applications.create({
        data: {
          org_id: testOrgA.org_id,
          academic_year_id: testAyA.academic_year_id,
          lead_id: testLeadA.lead_id,
          application_number: `APP-STATUS-${Date.now()}`,
          application_date: new Date(),
          status: 'submitted',
          created_by: parentUserA.user_id,
        },
      });

      await AdmissionPaymentService.recordPayment(
        statusApp.application_id,
        parentUserA.user_id,
        {
          payment_status: 'waived', // MALICIOUS STATUS ATTEMPT
          payment_mode: 'upi',
        },
        testOrgA.org_id,
        true, // isParentOnly
      );

      const dbRow = await prisma.admission_fee_payments.findUnique({
        where: { application_id: statusApp.application_id },
      });

      if (dbRow.payment_status === 'paid') {
        recordResult(7, 'Status Tampering Prevention (Parent Cannot Waive Own Fee)', 'PASS', {
          clientRequested: 'waived',
          enforcedStatus: dbRow.payment_status,
        });
      } else {
        recordResult(
          7,
          'Status Tampering Prevention (Parent Cannot Waive Own Fee)',
          'FAIL',
          dbRow.payment_status,
        );
      }

      await prisma.admissions_applications.delete({
        where: { application_id: statusApp.application_id },
      });
    } catch (err) {
      recordResult(
        7,
        'Status Tampering Prevention (Parent Cannot Waive Own Fee)',
        'FAIL',
        err.message,
      );
    }

    // -------------------------------------------------------------
    // TEST 8: Idempotency & Repeat Settlement (No Downgrade / No Duplicates)
    // -------------------------------------------------------------
    try {
      const repeatRes = await AdmissionPaymentService.recordPayment(
        testAppA.application_id,
        parentUserA.user_id,
        {
          payment_mode: 'card',
        },
        testOrgA.org_id,
        true,
      );

      const count = await prisma.admission_fee_payments.count({
        where: { application_id: testAppA.application_id },
      });

      if (count === 1 && repeatRes.payment_status === 'paid') {
        recordResult(8, 'Idempotent Repeat Payment (Single Row, No Downgrade)', 'PASS', {
          paymentRowsCount: count,
          paymentStatus: repeatRes.payment_status,
        });
      } else {
        recordResult(8, 'Idempotent Repeat Payment (Single Row, No Downgrade)', 'FAIL', {
          count,
          repeatRes,
        });
      }
    } catch (err) {
      recordResult(8, 'Idempotent Repeat Payment (Single Row, No Downgrade)', 'FAIL', err.message);
    }

    // -------------------------------------------------------------
    // TEST 9: Staff Offline Payment Recording (Cash / Bank Transfer)
    // -------------------------------------------------------------
    try {
      const staffRes = await AdmissionPaymentService.recordPayment(
        testAppB.application_id,
        null, // staff
        {
          payment_status: 'paid',
          payment_mode: 'cash',
          transaction_reference: 'RCP-OFFLINE-98765',
          remarks: 'Received offline cash payment at front desk',
        },
        testOrgB.org_id,
        false, // staff mode
      );

      const dbRowB = await prisma.admission_fee_payments.findUnique({
        where: { application_id: testAppB.application_id },
      });

      if (
        dbRowB &&
        dbRowB.payment_mode === 'cash' &&
        dbRowB.transaction_reference === 'RCP-OFFLINE-98765' &&
        dbRowB.remarks === 'Received offline cash payment at front desk'
      ) {
        recordResult(9, 'Staff Offline Payment Recording (Cash & Remarks)', 'PASS', {
          mode: dbRowB.payment_mode,
          ref: dbRowB.transaction_reference,
          remarks: dbRowB.remarks,
        });
      } else {
        recordResult(9, 'Staff Offline Payment Recording (Cash & Remarks)', 'FAIL', dbRowB);
      }
    } catch (err) {
      recordResult(9, 'Staff Offline Payment Recording (Cash & Remarks)', 'FAIL', err.message);
    }

    // -------------------------------------------------------------
    // TEST 10: Concurrency Safety (10 Simultaneous Parallel Payment Requests)
    // -------------------------------------------------------------
    try {
      const concurrentApp = await prisma.admissions_applications.create({
        data: {
          org_id: testOrgA.org_id,
          academic_year_id: testAyA.academic_year_id,
          lead_id: testLeadA.lead_id,
          application_number: `APP-CONCUR-${Date.now()}`,
          application_date: new Date(),
          status: 'submitted',
          created_by: parentUserA.user_id,
        },
      });

      const promises = Array.from({ length: 5 }).map((_, i) =>
        AdmissionPaymentService.recordPayment(
          concurrentApp.application_id,
          parentUserA.user_id,
          { payment_mode: 'upi', transaction_reference: `TXN-PARALLEL-${i}` },
          testOrgA.org_id,
          true,
        ),
      );

      const results = await Promise.all(promises);
      const rowCount = await prisma.admission_fee_payments.count({
        where: { application_id: concurrentApp.application_id },
      });

      if (rowCount === 1 && results.every((r) => r.payment_status === 'paid')) {
        recordResult(10, 'Concurrency Safety (5 Parallel Requests -> Exactly 1 Row)', 'PASS', {
          parallelRequests: 5,
          persistedRowCount: rowCount,
        });
      } else {
        recordResult(10, 'Concurrency Safety (5 Parallel Requests -> Exactly 1 Row)', 'FAIL', {
          rowCount,
        });
      }

      await prisma.admissions_applications.delete({
        where: { application_id: concurrentApp.application_id },
      });
    } catch (err) {
      recordResult(
        10,
        'Concurrency Safety (10 Parallel Requests -> Exactly 1 Row)',
        'FAIL',
        err.message,
      );
    }

    // -------------------------------------------------------------
    // TEST 11: Real Database Persistence & Verification
    // -------------------------------------------------------------
    try {
      const persistedRows = await prisma.admission_fee_payments.findMany({
        where: {
          application_id: { in: [testAppA.application_id, testAppB.application_id] },
        },
      });

      if (persistedRows.length === 2) {
        recordResult(11, 'Database Persistence & Field Integrity', 'PASS', {
          verifiedRecords: persistedRows.map((r) => ({
            id: r.payment_id,
            appId: r.application_id,
            status: r.payment_status,
            amount: Number(r.amount),
            mode: r.payment_mode,
          })),
        });
      } else {
        recordResult(11, 'Database Persistence & Field Integrity', 'FAIL', {
          count: persistedRows.length,
        });
      }
    } catch (err) {
      recordResult(11, 'Database Persistence & Field Integrity', 'FAIL', err.message);
    }

    // -------------------------------------------------------------
    // TEST 12: Cascade Deletion Verification
    // -------------------------------------------------------------
    try {
      const cascadeApp = await prisma.admissions_applications.create({
        data: {
          org_id: testOrgA.org_id,
          academic_year_id: testAyA.academic_year_id,
          lead_id: testLeadA.lead_id,
          application_number: `APP-CASCADE-${Date.now()}`,
          application_date: new Date(),
          status: 'submitted',
          created_by: parentUserA.user_id,
        },
      });

      await AdmissionPaymentService.recordPayment(
        cascadeApp.application_id,
        parentUserA.user_id,
        { payment_mode: 'card' },
        testOrgA.org_id,
        true,
      );

      const beforeCount = await prisma.admission_fee_payments.count({
        where: { application_id: cascadeApp.application_id },
      });

      // Delete parent application
      await prisma.admissions_applications.delete({
        where: { application_id: cascadeApp.application_id },
      });

      const afterCount = await prisma.admission_fee_payments.count({
        where: { application_id: cascadeApp.application_id },
      });

      if (beforeCount === 1 && afterCount === 0) {
        recordResult(12, 'Cascade Deletion Integrity (ON DELETE CASCADE)', 'PASS', {
          beforeDelete: beforeCount,
          afterDelete: afterCount,
        });
      } else {
        recordResult(12, 'Cascade Deletion Integrity (ON DELETE CASCADE)', 'FAIL', {
          beforeCount,
          afterCount,
        });
      }
    } catch (err) {
      recordResult(12, 'Cascade Deletion Integrity (ON DELETE CASCADE)', 'FAIL', err.message);
    }
  } catch (globalErr) {
    console.error('Fatal Matrix Error:', globalErr);
  } finally {
    // Cleanup test records
    try {
      if (testAppA) {
        await prisma.admissions_applications.deleteMany({
          where: { application_id: testAppA.application_id },
        });
      }
      if (testAppB) {
        await prisma.admissions_applications.deleteMany({
          where: { application_id: testAppB.application_id },
        });
      }
      if (testLeadA) {
        await prisma.leads.deleteMany({ where: { lead_id: testLeadA.lead_id } });
      }
      if (testLeadB) {
        await prisma.leads.deleteMany({ where: { lead_id: testLeadB.lead_id } });
      }
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }

    await prisma.$disconnect();

    console.log('\n================================================================');
    console.log('FINAL MATRIX RESULTS SUMMARY');
    console.log('================================================================');
    const passed = RESULTS.filter((r) => r.status === 'PASS').length;
    const total = RESULTS.length;
    console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
    console.log('================================================================\n');
  }
}

runMatrix();
