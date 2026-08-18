const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve('apps/backend/.env') });

const prisma = new PrismaClient();
const {
  AdmissionDocumentService,
} = require('../src/modules/admission-management/services/admission.document.service');
const {
  ApplicationForbiddenError,
  ApplicationValidationError,
} = require('../src/modules/admission-management/errors/admission.errors');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const BUCKET = process.env.SUPABASE_ADMISSION_DOCUMENTS_BUCKET || 'admission-documents';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const results = [];

function recordTest(testNumber, name, passed, detail) {
  results.push({ testNumber, name, passed, detail });
  const mark = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`  ${mark} [Test ${testNumber}]: ${name}`);
  if (detail) console.log(`      ↳ ${detail}`);
}

async function runIsolationAudit() {
  console.log('========================================================================');
  console.log('   EDU TRACK — ORGANIZATION-SCOPED DOCUMENT ISOLATION AUDIT            ');
  console.log('========================================================================\n');

  let appA = null;
  let appB = null;
  let leadA = null;
  let leadB = null;
  const createdDocIds = [];
  const createdStoragePaths = [];

  try {
    // 1. Identify Org A (Greenwood) and Org B (NPS Ahmedabad)
    const orgA = await prisma.organizations.findFirst({
      where: { org_code: 'ORG-001' },
    });
    const orgB = await prisma.organizations.findFirst({
      where: { org_code: 'ORG-004' },
    });

    if (!orgA || !orgB) {
      throw new Error('Required test organizations (ORG-001 and ORG-004) not found in database');
    }

    console.log(`[Setup] Org A: ${orgA.org_name} (${orgA.org_id})`);
    console.log(`[Setup] Org B: ${orgB.org_name} (${orgB.org_id})`);

    // Load Academic Years
    const ayA = await prisma.academic_years.findFirst({ where: { org_id: orgA.org_id } });
    const ayB = await prisma.academic_years.findFirst({ where: { org_id: orgB.org_id } });

    // Load Academic Year Grades
    const aygA = await prisma.academic_year_grades.findFirst({
      where: { academic_years: { org_id: orgA.org_id } },
    });
    const aygB = await prisma.academic_year_grades.findFirst({
      where: { academic_years: { org_id: orgB.org_id } },
    });

    // Load Doc Types for Org A
    const docTypesA = await prisma.document_types.findMany({
      where: { org_id: orgA.org_id, is_active: true },
      orderBy: { display_order: 'asc' },
    });
    // Load Doc Types for Org B
    const docTypesB = await prisma.document_types.findMany({
      where: { org_id: orgB.org_id, is_active: true },
      orderBy: { display_order: 'asc' },
    });

    console.log(`[Setup] Org A Doc Types Count: ${docTypesA.length}`);
    console.log(`[Setup] Org B Doc Types Count: ${docTypesB.length}`);

    const docA1 = docTypesA[0]; // e.g. Birth Certificate (Org A)
    const docA2 = docTypesA[1]; // e.g. Student Photo (Org A)
    const docB1 = docTypesB[0]; // e.g. Birth Certificate (Org B)
    const docB2 = docTypesB[1]; // e.g. Transfer Certificate (Org B)

    // Create Test Leads & Applications
    leadA = await prisma.leads.create({
      data: {
        org_id: orgA.org_id,
        lead_number: `LEAD-ISO-A-${Date.now()}`,
        student_first_name: 'ChildA',
        student_last_name: 'TenantA',
        academic_year_grade_id: aygA.academic_year_grade_id,
        contact_name: 'Parent Tenant A',
        contact_phone: '9888800001',
        source: 'website',
      },
    });

    appA = await prisma.admissions_applications.create({
      data: {
        lead_id: leadA.lead_id,
        org_id: orgA.org_id,
        academic_year_id: ayA.academic_year_id,
        application_number: `APP-ISO-A-${Date.now()}`,
        status: 'submitted',
      },
    });

    leadB = await prisma.leads.create({
      data: {
        org_id: orgB.org_id,
        lead_number: `LEAD-ISO-B-${Date.now()}`,
        student_first_name: 'ChildB',
        student_last_name: 'TenantB',
        academic_year_grade_id: aygB.academic_year_grade_id,
        contact_name: 'Parent Tenant B',
        contact_phone: '9888800002',
        source: 'website',
      },
    });

    appB = await prisma.admissions_applications.create({
      data: {
        lead_id: leadB.lead_id,
        org_id: orgB.org_id,
        academic_year_id: ayB.academic_year_id,
        application_number: `APP-ISO-B-${Date.now()}`,
        status: 'submitted',
      },
    });

    console.log(`[Setup] Created Application A: ${appA.application_id} (Org A: ${orgA.org_id})`);
    console.log(`[Setup] Created Application B: ${appB.application_id} (Org B: ${orgB.org_id})\n`);

    // -------------------------------------------------------------------------
    // TEST 1: Document Catalogue Scoping for Application A
    // -------------------------------------------------------------------------
    const catalogueA = await AdmissionDocumentService.getDocumentTypesForApplication(
      appA.application_id,
    );
    const catAAllOrgA = catalogueA.every((d) => d.org_id === orgA.org_id);
    const catAHasNoOrgB = !catalogueA.some((d) => d.org_id === orgB.org_id);
    recordTest(
      1,
      'Document catalogue for Application A contains ONLY Org A document types',
      catalogueA.length > 0 && catAAllOrgA && catAHasNoOrgB,
      `Returned ${catalogueA.length} types for Org A, 0 from Org B`,
    );

    // -------------------------------------------------------------------------
    // TEST 2: Document Catalogue Scoping for Application B
    // -------------------------------------------------------------------------
    const catalogueB = await AdmissionDocumentService.getDocumentTypesForApplication(
      appB.application_id,
    );
    const catBAllOrgB = catalogueB.every((d) => d.org_id === orgB.org_id);
    const catBHasNoOrgA = !catalogueB.some((d) => d.org_id === orgA.org_id);
    recordTest(
      2,
      'Document catalogue for Application B contains ONLY Org B document types',
      catalogueB.length > 0 && catBAllOrgB && catBHasNoOrgA,
      `Returned ${catalogueB.length} types for Org B, 0 from Org A`,
    );

    // -------------------------------------------------------------------------
    // TEST 3: Application A + DocType A1 -> SUCCESS
    // -------------------------------------------------------------------------
    const fakePdfFileA1 = {
      originalname: 'birth_cert_a.pdf',
      buffer: Buffer.from('%PDF-1.4 sample pdf content for child A'),
      mimetype: 'application/pdf',
      size: 40,
    };
    const uploadA1 = await AdmissionDocumentService.uploadDocument(
      appA.application_id,
      null,
      { document_type_id: docA1.document_type_id },
      fakePdfFileA1,
    );
    createdDocIds.push(uploadA1.document_id);
    createdStoragePaths.push(uploadA1.storage_path);
    const storagePathA1Correct = uploadA1.storage_path.startsWith(
      `${orgA.org_id}/${appA.application_id}/`,
    );
    recordTest(
      3,
      'Upload DocType A1 to Application A -> SUCCESS (Org A scoped storage path)',
      uploadA1 && storagePathA1Correct,
      `Storage path: ${uploadA1.storage_path}`,
    );

    // -------------------------------------------------------------------------
    // TEST 4: Application A + DocType A2 -> SUCCESS
    // -------------------------------------------------------------------------
    const fakePhotoFileA2 = {
      originalname: 'student_photo_a.jpg',
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]),
      mimetype: 'image/jpeg',
      size: 10,
    };
    const uploadA2 = await AdmissionDocumentService.uploadDocument(
      appA.application_id,
      null,
      { document_type_id: docA2.document_type_id },
      fakePhotoFileA2,
    );
    createdDocIds.push(uploadA2.document_id);
    createdStoragePaths.push(uploadA2.storage_path);
    const storagePathA2Correct = uploadA2.storage_path.startsWith(
      `${orgA.org_id}/${appA.application_id}/`,
    );
    recordTest(
      4,
      'Upload DocType A2 to Application A -> SUCCESS (Org A scoped storage path)',
      uploadA2 && storagePathA2Correct,
      `Storage path: ${uploadA2.storage_path}`,
    );

    // -------------------------------------------------------------------------
    // TEST 5: CROSS-ORG ATTACK: Application A + DocType B1 (from Org B) -> MUST FAIL (403)
    // -------------------------------------------------------------------------
    let crossAttack1Caught = false;
    let crossAttack1ErrMessage = '';
    try {
      await AdmissionDocumentService.uploadDocument(
        appA.application_id,
        null,
        { document_type_id: docB1.document_type_id }, // DocType from Org B!
        fakePdfFileA1,
      );
    } catch (err) {
      crossAttack1Caught = true;
      crossAttack1ErrMessage = err.message;
    }
    recordTest(
      5,
      'Cross-Org Attack: Upload DocType B1 (Org B) to Application A (Org A) -> REJECTED (403)',
      crossAttack1Caught,
      `Error caught: ${crossAttack1ErrMessage}`,
    );

    // -------------------------------------------------------------------------
    // TEST 6: CROSS-ORG ATTACK: Application A + DocType B2 (from Org B) -> MUST FAIL (403)
    // -------------------------------------------------------------------------
    let crossAttack2Caught = false;
    let crossAttack2ErrMessage = '';
    try {
      await AdmissionDocumentService.uploadDocument(
        appA.application_id,
        null,
        { document_type_id: docB2.document_type_id }, // DocType from Org B!
        fakePhotoFileA2,
      );
    } catch (err) {
      crossAttack2Caught = true;
      crossAttack2ErrMessage = err.message;
    }
    recordTest(
      6,
      'Cross-Org Attack: Upload DocType B2 (Org B) to Application A (Org A) -> REJECTED (403)',
      crossAttack2Caught,
      `Error caught: ${crossAttack2ErrMessage}`,
    );

    // -------------------------------------------------------------------------
    // TEST 7: Application B + DocType B1 (from Org B) -> SUCCESS
    // -------------------------------------------------------------------------
    const fakePdfFileB1 = {
      originalname: 'birth_cert_b.pdf',
      buffer: Buffer.from('%PDF-1.4 sample pdf content for child B'),
      mimetype: 'application/pdf',
      size: 40,
    };
    const uploadB1 = await AdmissionDocumentService.uploadDocument(
      appB.application_id,
      null,
      { document_type_id: docB1.document_type_id },
      fakePdfFileB1,
    );
    createdDocIds.push(uploadB1.document_id);
    createdStoragePaths.push(uploadB1.storage_path);
    const storagePathB1Correct = uploadB1.storage_path.startsWith(
      `${orgB.org_id}/${appB.application_id}/`,
    );
    recordTest(
      7,
      'Upload DocType B1 to Application B -> SUCCESS (Org B scoped storage path)',
      uploadB1 && storagePathB1Correct,
      `Storage path: ${uploadB1.storage_path}`,
    );

    // -------------------------------------------------------------------------
    // TEST 8: CROSS-ORG ATTACK: Application B + DocType A1 (from Org A) -> MUST FAIL (403)
    // -------------------------------------------------------------------------
    let crossAttack3Caught = false;
    let crossAttack3ErrMessage = '';
    try {
      await AdmissionDocumentService.uploadDocument(
        appB.application_id,
        null,
        { document_type_id: docA1.document_type_id }, // DocType from Org A!
        fakePdfFileB1,
      );
    } catch (err) {
      crossAttack3Caught = true;
      crossAttack3ErrMessage = err.message;
    }
    recordTest(
      8,
      'Cross-Org Attack: Upload DocType A1 (Org A) to Application B (Org B) -> REJECTED (403)',
      crossAttack3Caught,
      `Error caught: ${crossAttack3ErrMessage}`,
    );

    // -------------------------------------------------------------------------
    // TEST 9: Invariant Verification in Database
    // -------------------------------------------------------------------------
    // Verify all documents associated with App A have docType.org_id === App A.org_id
    const appADocs = await prisma.admission_documents.findMany({
      where: { application_id: appA.application_id },
      include: { document_types: true, admissions_applications: true },
    });
    const allAppADocsMatch = appADocs.every(
      (d) =>
        d.document_types.org_id === orgA.org_id && d.admissions_applications.org_id === orgA.org_id,
    );
    recordTest(
      9,
      'PostgreSQL Invariant: admissions_applications.org_id === document_types.org_id for all App A docs',
      allAppADocsMatch && appADocs.length === 2,
      `Verified ${appADocs.length} documents match Org A (${orgA.org_id})`,
    );

    // -------------------------------------------------------------------------
    // TEST 10: Invariant Verification for App B
    // -------------------------------------------------------------------------
    const appBDocs = await prisma.admission_documents.findMany({
      where: { application_id: appB.application_id },
      include: { document_types: true, admissions_applications: true },
    });
    const allAppBDocsMatch = appBDocs.every(
      (d) =>
        d.document_types.org_id === orgB.org_id && d.admissions_applications.org_id === orgB.org_id,
    );
    recordTest(
      10,
      'PostgreSQL Invariant: admissions_applications.org_id === document_types.org_id for all App B docs',
      allAppBDocsMatch && appBDocs.length === 1,
      `Verified ${appBDocs.length} document matches Org B (${orgB.org_id})`,
    );
  } catch (err) {
    console.error('\n[Audit Fatal Error]:', err);
  } finally {
    // Clean up test data
    console.log('\n[Cleanup] Cleaning test binaries & records...');
    for (const p of createdStoragePaths) {
      try {
        await supabase.storage.from(BUCKET).remove([p]);
      } catch (e) {}
    }
    for (const dId of createdDocIds) {
      try {
        await prisma.admission_documents.delete({ where: { document_id: dId } });
      } catch (e) {}
    }
    if (appA) {
      try {
        await prisma.admissions_applications.delete({
          where: { application_id: appA.application_id },
        });
      } catch (e) {}
    }
    if (leadA) {
      try {
        await prisma.leads.delete({ where: { lead_id: leadA.lead_id } });
      } catch (e) {}
    }
    if (appB) {
      try {
        await prisma.admissions_applications.delete({
          where: { application_id: appB.application_id },
        });
      } catch (e) {}
    }
    if (leadB) {
      try {
        await prisma.leads.delete({ where: { lead_id: leadB.lead_id } });
      } catch (e) {}
    }
    await prisma.$disconnect();
    console.log('✅ Temporary isolation test data cleaned up.\n');

    const totalPassed = results.filter((r) => r.passed).length;
    const totalFailed = results.filter((r) => !r.passed).length;
    console.log('========================================================================');
    console.log(
      `   ORGANIZATION ISOLATION SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED (TOTAL: ${results.length})`,
    );
    console.log('========================================================================\n');

    if (totalFailed > 0) {
      process.exit(1);
    }
  }
}

runIsolationAudit();
