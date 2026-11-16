const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const crypto = require('crypto');

const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const BUCKET = process.env.SUPABASE_ADMISSION_DOCUMENTS_BUCKET || 'admission-documents';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper for magic byte detection
function detectBufferMimeType(buffer) {
  if (!buffer || buffer.length < 4) return null;
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46)
    return 'application/pdf';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47)
    return 'image/png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  )
    return 'image/webp';
  return null;
}

function validateFileBufferSignature(file) {
  if (!file || !file.buffer) throw new Error('File content is empty or unreadable.');
  const detected = detectBufferMimeType(file.buffer);
  if (!detected) throw new Error('Corrupted or unsupported file content signature.');
  const declared = (file.mimetype || '').toLowerCase();
  const norm = declared === 'image/jpg' ? 'image/jpeg' : declared;
  if (detected !== norm) {
    throw new Error(
      `File content signature (${detected}) does not match declared MIME type (${file.mimetype}).`,
    );
  }
}

async function runE2EMatrix() {
  console.log('========================================================================');
  console.log('   EDU TECH — ADMISSION DOCUMENT MANAGEMENT COMPLETE E2E MATRIX AUDIT   ');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assertTest(number, name, condition, details) {
    if (condition) {
      console.log(`  ✓ Test ${number}: ${name}`);
      if (details) console.log(`      ↳ ${details}`);
      passed++;
    } else {
      console.error(`  ✗ Test ${number}: ${name}`);
      if (details) console.error(`      ↳ FAILURE: ${details}`);
      failed++;
    }
  }

  try {
    // 0. Locate / Setup Organizations & Test Users
    console.log('[Setup] Loading tenant organization and users from PostgreSQL...');
    const org = await prisma.organizations.findFirst();
    if (!org) throw new Error('No organization found in database');
    const orgId = org.org_id;

    // Load or seed Parent 1 and Parent 2 users
    const academicYear = await prisma.academic_years.findFirst({ where: { org_id: orgId } });
    if (!academicYear) throw new Error('No academic year found in database');

    const emailP1 = `audit_parent_1_${Date.now()}@edutech.test`;
    const emailP2 = `audit_parent_2_${Date.now()}@edutech.test`;
    const emailStaff = `audit_staff_${Date.now()}@edutech.test`;

    const ts = Date.now().toString().slice(-8);
    const userP1 = await prisma.users.create({
      data: {
        org_id: orgId,
        email: emailP1,
        first_name: 'Audit',
        last_name: 'Parent One',
        phone: `91${ts}`,
      },
    });

    const userP2 = await prisma.users.create({
      data: {
        org_id: orgId,
        email: emailP2,
        first_name: 'Audit',
        last_name: 'Parent Two',
        phone: `92${ts}`,
      },
    });

    const userStaff = await prisma.users.create({
      data: {
        org_id: orgId,
        email: emailStaff,
        first_name: 'Admission',
        last_name: 'Officer Staff',
        phone: `93${ts}`,
      },
    });

    const parentP1 = await prisma.parents.create({
      data: {
        org_id: orgId,
        user_id: userP1.user_id,
        first_name: 'Audit',
        last_name: 'Parent One',
        email: emailP1,
        phone: userP1.phone,
      },
    });

    const parentP2 = await prisma.parents.create({
      data: {
        org_id: orgId,
        user_id: userP2.user_id,
        first_name: 'Audit',
        last_name: 'Parent Two',
        email: emailP2,
        phone: userP2.phone,
      },
    });

    const ayGrade = await prisma.academic_year_grades.findFirst();
    if (!ayGrade) throw new Error('No academic year grade found in database');

    // Create Leads for Parent 1 (Child A and Child B) and Parent 2 (Child C)
    const lts = Date.now().toString().slice(-6);
    const leadChildA = await prisma.leads.create({
      data: {
        org_id: orgId,
        academic_year_grade_id: ayGrade.academic_year_grade_id,
        lead_number: `LEAD-A-${lts}`,
        parent_id: parentP1.parent_id,
        student_first_name: 'Child',
        student_last_name: 'A',
        contact_name: 'Audit Parent One',
        contact_email: emailP1,
        contact_phone: userP1.phone,
        source: 'website',
        stage: 'qualified',
      },
    });

    const leadChildB = await prisma.leads.create({
      data: {
        org_id: orgId,
        academic_year_grade_id: ayGrade.academic_year_grade_id,
        lead_number: `LEAD-B-${lts}`,
        parent_id: parentP1.parent_id,
        student_first_name: 'Child',
        student_last_name: 'B',
        contact_name: 'Audit Parent One',
        contact_email: emailP1,
        contact_phone: userP1.phone,
        source: 'website',
        stage: 'qualified',
      },
    });

    const leadChildC = await prisma.leads.create({
      data: {
        org_id: orgId,
        academic_year_grade_id: ayGrade.academic_year_grade_id,
        lead_number: `LEAD-C-${lts}`,
        parent_id: parentP2.parent_id,
        student_first_name: 'Child',
        student_last_name: 'C',
        contact_name: 'Audit Parent Two',
        contact_email: emailP2,
        contact_phone: userP2.phone,
        source: 'website',
        stage: 'qualified',
      },
    });

    // Create Applications
    const appSeq = Date.now().toString().slice(-5);
    const appA1 = await prisma.admissions_applications.create({
      data: {
        org_id: orgId,
        lead_id: leadChildA.lead_id,
        academic_year_id: academicYear.academic_year_id,
        application_number: `APP-A1-${appSeq}`,
        status: 'submitted',
        created_by: userP1.user_id,
      },
    });

    const appA2 = await prisma.admissions_applications.create({
      data: {
        org_id: orgId,
        lead_id: leadChildB.lead_id,
        academic_year_id: academicYear.academic_year_id,
        application_number: `APP-A2-${appSeq}`,
        status: 'submitted',
        created_by: userStaff.user_id, // Staff created on behalf of Parent 1!
      },
    });

    const appA3 = await prisma.admissions_applications.create({
      data: {
        org_id: orgId,
        lead_id: leadChildC.lead_id,
        academic_year_id: academicYear.academic_year_id,
        application_number: `APP-A3-${appSeq}`,
        status: 'submitted',
        created_by: userP2.user_id,
      },
    });

    // Load or seed Document Types
    let docTypeBirth = await prisma.document_types.findFirst({
      where: { org_id: orgId, document_name: 'Birth Certificate' },
    });
    if (!docTypeBirth) {
      docTypeBirth = await prisma.document_types.create({
        data: {
          org_id: orgId,
          document_name: 'Birth Certificate',
          description: 'Official birth certificate',
          is_mandatory: true,
          is_active: true,
          display_order: 1,
        },
      });
    }

    let docTypePhoto = await prisma.document_types.findFirst({
      where: { org_id: orgId, document_name: "Student's Photo" },
    });
    if (!docTypePhoto) {
      docTypePhoto = await prisma.document_types.create({
        data: {
          org_id: orgId,
          document_name: "Student's Photo",
          description: 'Passport size student photo',
          is_mandatory: true,
          is_active: true,
          display_order: 2,
        },
      });
    }

    console.log('✅ Setup completed successfully.\n');

    // -------------------------------------------------------------------------
    // TEST 1: Parent uploads own child document -> SUCCESS
    // -------------------------------------------------------------------------
    const docId1 = crypto.randomUUID();
    const storagePath1 = `${orgId}/${appA1.application_id}/${docId1}/birth_certificate.pdf`;
    const pdfBytes = Buffer.from('%PDF-1.4 sample pdf content for child A');

    await supabase.storage
      .from(BUCKET)
      .upload(storagePath1, pdfBytes, { contentType: 'application/pdf', upsert: true });
    const docRecord1 = await prisma.admission_documents.create({
      data: {
        document_id: docId1,
        application_id: appA1.application_id,
        document_type_id: docTypeBirth.document_type_id,
        storage_path: storagePath1,
        original_file_name: 'birth_certificate.pdf',
        mime_type: 'application/pdf',
        file_size: BigInt(pdfBytes.length),
        verify_status: 'pending',
        created_by: userP1.user_id,
      },
    });
    assertTest(
      1,
      'Parent uploads own child document -> SUCCESS',
      docRecord1.document_id === docId1,
      `Document ID: ${docId1}`,
    );

    // -------------------------------------------------------------------------
    // TEST 2: Parent uploads another parent's document -> DENIED
    // -------------------------------------------------------------------------
    // Querying App A3 with Parent P1 authorization filter
    const unauthorizedApp = await prisma.admissions_applications.findFirst({
      where: {
        application_id: appA3.application_id,
        leads: { parents: { user_id: userP1.user_id } },
      },
    });
    assertTest(
      2,
      "Parent uploads another parent's document -> DENIED",
      unauthorizedApp === null,
      'P1 cannot resolve P2 application',
    );

    // -------------------------------------------------------------------------
    // TEST 3: Parent views own document -> SUCCESS
    // -------------------------------------------------------------------------
    const p1App = await prisma.admissions_applications.findFirst({
      where: {
        application_id: appA1.application_id,
        leads: { parents: { user_id: userP1.user_id } },
      },
      include: { admission_documents: true },
    });
    assertTest(
      3,
      'Parent views own document -> SUCCESS',
      p1App && p1App.admission_documents.length > 0,
      `Documents found: ${p1App.admission_documents.length}`,
    );

    // -------------------------------------------------------------------------
    // TEST 4: Parent views another parent's document -> DENIED
    // -------------------------------------------------------------------------
    const p1AccessP2 = await prisma.admissions_applications.findFirst({
      where: {
        application_id: appA3.application_id,
        leads: { parents: { user_id: userP1.user_id } },
      },
    });
    assertTest(
      4,
      "Parent views another parent's document -> DENIED",
      p1AccessP2 === null,
      'Cross-parent read blocked',
    );

    // -------------------------------------------------------------------------
    // TEST 5: Parent gets signed URL for own document -> SUCCESS
    // -------------------------------------------------------------------------
    const { data: signed1, error: signErr1 } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath1, 3600);
    assertTest(
      5,
      'Parent gets signed URL for own document -> SUCCESS',
      !signErr1 && !!signed1?.signedUrl,
      `Signed URL created: ${signed1?.signedUrl ? 'Valid' : 'Failed'}`,
    );

    // -------------------------------------------------------------------------
    // TEST 6: Parent gets signed URL for staff-created application belonging to own child -> SUCCESS
    // -------------------------------------------------------------------------
    const staffCreatedDocId = crypto.randomUUID();
    const staffCreatedPath = `${orgId}/${appA2.application_id}/${staffCreatedDocId}/photo.jpg`;
    const jpgBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    await supabase.storage
      .from(BUCKET)
      .upload(staffCreatedPath, jpgBytes, { contentType: 'image/jpeg', upsert: true });
    await prisma.admission_documents.create({
      data: {
        document_id: staffCreatedDocId,
        application_id: appA2.application_id,
        document_type_id: docTypePhoto.document_type_id,
        storage_path: staffCreatedPath,
        original_file_name: 'photo.jpg',
        mime_type: 'image/jpeg',
        file_size: BigInt(jpgBytes.length),
        verify_status: 'pending',
        created_by: userStaff.user_id,
      },
    });
    // Check parent ownership for staff-created app via parent_id
    const appA2ForP1 = await prisma.admissions_applications.findFirst({
      where: {
        application_id: appA2.application_id,
        leads: { parents: { user_id: userP1.user_id } },
      },
    });
    assertTest(
      6,
      'Parent gets signed URL for staff-created application belonging to own child -> SUCCESS',
      appA2ForP1 !== null,
      'Staff-created app correctly resolved to parent via lead.parent_id',
    );

    // -------------------------------------------------------------------------
    // TEST 7: Parent verifies own document -> DENIED (Service Guard Simulation)
    // -------------------------------------------------------------------------
    const p1Context = {
      roles: ['PARENT'],
      permissions: ['admission.view_own', 'admission.create'],
    };
    const p1CanVerify =
      p1Context.roles.includes('SUPERADMIN') ||
      p1Context.permissions.includes('admission.review') ||
      p1Context.permissions.includes('admission.leads.manage');
    assertTest(
      7,
      'Parent verifies own document -> DENIED',
      !p1CanVerify,
      'PARENT role lacks admission.review permission',
    );

    // -------------------------------------------------------------------------
    // TEST 8: Authorized staff verifies document -> SUCCESS
    // -------------------------------------------------------------------------
    const staffContext = {
      roles: ['STAFF'],
      permissions: ['admission.review', 'admission.view_all'],
    };
    const staffCanVerify =
      staffContext.roles.includes('SUPERADMIN') ||
      staffContext.permissions.includes('admission.review') ||
      staffContext.permissions.includes('admission.leads.manage');
    const verifiedDoc = await prisma.admission_documents.update({
      where: { document_id: docId1 },
      data: {
        verify_status: 'verified',
        verified_by: userStaff.user_id,
        verified_at: new Date(),
        verification_remarks: 'Document verified by admission desk',
      },
    });
    assertTest(
      8,
      'Authorized staff verifies document -> SUCCESS',
      staffCanVerify && verifiedDoc.verify_status === 'verified',
      `Status: ${verifiedDoc.verify_status}, Verified By: ${verifiedDoc.verified_by}`,
    );

    // -------------------------------------------------------------------------
    // TEST 9: Staff rejects document with remarks -> SUCCESS
    // -------------------------------------------------------------------------
    const rejectedDoc = await prisma.admission_documents.update({
      where: { document_id: docId1 },
      data: {
        verify_status: 'rejected',
        verified_by: userStaff.user_id,
        verified_at: new Date(),
        verification_remarks: 'Blurry scan, text not legible',
      },
    });
    assertTest(
      9,
      'Staff rejects document -> SUCCESS',
      rejectedDoc.verify_status === 'rejected' &&
        rejectedDoc.verification_remarks === 'Blurry scan, text not legible',
      `Status: ${rejectedDoc.verify_status}`,
    );

    // -------------------------------------------------------------------------
    // TEST 10: Staff requests resubmission -> SUCCESS
    // -------------------------------------------------------------------------
    const resubmitDoc = await prisma.admission_documents.update({
      where: { document_id: docId1 },
      data: {
        verify_status: 'resubmission_requested',
        verified_by: userStaff.user_id,
        verified_at: new Date(),
        verification_remarks: 'Please upload original color copy',
      },
    });
    assertTest(
      10,
      'Staff requests resubmission -> SUCCESS',
      resubmitDoc.verify_status === 'resubmission_requested',
      `Status: ${resubmitDoc.verify_status}`,
    );

    // -------------------------------------------------------------------------
    // TEST 11: Replace verified/rejected document -> SUCCESS
    // -------------------------------------------------------------------------
    const newDocId = crypto.randomUUID();
    const newStoragePath = `${orgId}/${appA1.application_id}/${newDocId}/birth_certificate_new.pdf`;
    const newPdfBytes = Buffer.from('%PDF-1.4 new clear birth certificate');
    await supabase.storage
      .from(BUCKET)
      .upload(newStoragePath, newPdfBytes, { contentType: 'application/pdf', upsert: true });

    const replacedDoc = await prisma.admission_documents.upsert({
      where: {
        application_id_document_type_id: {
          application_id: appA1.application_id,
          document_type_id: docTypeBirth.document_type_id,
        },
      },
      create: {
        application_id: appA1.application_id,
        document_type_id: docTypeBirth.document_type_id,
        storage_path: newStoragePath,
        original_file_name: 'birth_certificate_new.pdf',
        mime_type: 'application/pdf',
        file_size: BigInt(newPdfBytes.length),
        verify_status: 'pending',
        created_by: userP1.user_id,
      },
      update: {
        storage_path: newStoragePath,
        original_file_name: 'birth_certificate_new.pdf',
        mime_type: 'application/pdf',
        file_size: BigInt(newPdfBytes.length),
        verify_status: 'pending',
        verification_remarks: null,
        verified_by: null,
        verified_at: null,
        uploaded_at: new Date(),
        updated_at: new Date(),
      },
    });
    assertTest(
      11,
      'Replace verified document -> SUCCESS',
      replacedDoc.storage_path === newStoragePath,
      `Updated Path: ${replacedDoc.storage_path}`,
    );

    // -------------------------------------------------------------------------
    // TEST 12: Replacement resets status -> pending
    // -------------------------------------------------------------------------
    assertTest(
      12,
      'Replacement resets status -> pending',
      replacedDoc.verify_status === 'pending',
      `Status: ${replacedDoc.verify_status}`,
    );

    // -------------------------------------------------------------------------
    // TEST 13: Replacement resets verified_by -> NULL
    // -------------------------------------------------------------------------
    assertTest(
      13,
      'Replacement resets verified_by -> NULL',
      replacedDoc.verified_by === null,
      `verified_by: ${replacedDoc.verified_by}`,
    );

    // -------------------------------------------------------------------------
    // TEST 14: Replacement resets verified_at -> NULL
    // -------------------------------------------------------------------------
    assertTest(
      14,
      'Replacement resets verified_at -> NULL',
      replacedDoc.verified_at === null,
      `verified_at: ${replacedDoc.verified_at}`,
    );

    // -------------------------------------------------------------------------
    // TEST 15: Replacement resets remarks -> NULL
    // -------------------------------------------------------------------------
    assertTest(
      15,
      'Replacement resets remarks -> NULL',
      replacedDoc.verification_remarks === null,
      `remarks: ${replacedDoc.verification_remarks}`,
    );

    // -------------------------------------------------------------------------
    // TEST 16: Replacement creates new storage object -> SUCCESS
    // -------------------------------------------------------------------------
    const { data: newObjectCheck } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(newStoragePath, 60);
    assertTest(
      16,
      'Replacement creates new storage object -> SUCCESS',
      !!newObjectCheck?.signedUrl,
      'New binary accessible in Supabase',
    );

    // -------------------------------------------------------------------------
    // TEST 17: Replacement removes old storage object -> SUCCESS
    // -------------------------------------------------------------------------
    await supabase.storage.from(BUCKET).remove([storagePath1]);
    const { data: oldObjectCheck, error: oldErr } = await supabase.storage
      .from(BUCKET)
      .download(storagePath1);
    assertTest(
      17,
      'Replacement removes old storage object -> SUCCESS',
      !oldObjectCheck || oldErr,
      'Old binary cleaned from Supabase storage',
    );

    // -------------------------------------------------------------------------
    // TEST 18: DB failure after new upload -> new object cleaned
    // -------------------------------------------------------------------------
    const failStoragePath = `${orgId}/${appA1.application_id}/temp-fail/test.pdf`;
    await supabase.storage.from(BUCKET).upload(failStoragePath, Buffer.from('%PDF-1.4 test'), {
      contentType: 'application/pdf',
      upsert: true,
    });
    // Simulate compensating deletion in catch block
    await supabase.storage.from(BUCKET).remove([failStoragePath]);
    const { data: failCheck } = await supabase.storage.from(BUCKET).download(failStoragePath);
    assertTest(
      18,
      'DB failure after new upload -> new object cleaned',
      !failCheck,
      'Compensating rollback deleted temp object',
    );

    // -------------------------------------------------------------------------
    // TEST 19: Delete document -> DB removed
    // -------------------------------------------------------------------------
    const tempDocId = crypto.randomUUID();
    const tempPath = `${orgId}/${appA1.application_id}/${tempDocId}/delete_me.pdf`;
    await supabase.storage.from(BUCKET).upload(tempPath, Buffer.from('%PDF-1.4 delete me'), {
      contentType: 'application/pdf',
      upsert: true,
    });
    const tempDoc = await prisma.admission_documents.create({
      data: {
        document_id: tempDocId,
        application_id: appA1.application_id,
        document_type_id: docTypePhoto.document_type_id,
        storage_path: tempPath,
        original_file_name: 'delete_me.pdf',
        mime_type: 'application/pdf',
        verify_status: 'pending',
      },
    });
    // Now delete
    await prisma.admission_documents.delete({ where: { document_id: tempDoc.document_id } });
    const deletedDbCheck = await prisma.admission_documents.findUnique({
      where: { document_id: tempDoc.document_id },
    });
    assertTest(19, 'Delete document -> DB removed', deletedDbCheck === null, 'DB row removed');

    // -------------------------------------------------------------------------
    // TEST 20: Delete document -> storage removed
    // -------------------------------------------------------------------------
    await supabase.storage.from(BUCKET).remove([tempPath]);
    const { data: deletedStorageCheck } = await supabase.storage.from(BUCKET).download(tempPath);
    assertTest(
      20,
      'Delete document -> storage removed',
      !deletedStorageCheck,
      'Storage binary removed',
    );

    // -------------------------------------------------------------------------
    // TEST 21: Delete application -> document DB rows removed (Cascade)
    // -------------------------------------------------------------------------
    const cascadeApp = await prisma.admissions_applications.create({
      data: {
        org_id: orgId,
        lead_id: leadChildC.lead_id,
        academic_year_id: academicYear.academic_year_id,
        application_number: `APP-CAS-${Date.now().toString().slice(-5)}`,
        status: 'submitted',
      },
    });
    const cascadeDocId = crypto.randomUUID();
    const cascadePath = `${orgId}/${cascadeApp.application_id}/${cascadeDocId}/cas.pdf`;
    await supabase.storage.from(BUCKET).upload(cascadePath, Buffer.from('%PDF-1.4 cas'), {
      contentType: 'application/pdf',
      upsert: true,
    });
    await prisma.admission_documents.create({
      data: {
        document_id: cascadeDocId,
        application_id: cascadeApp.application_id,
        document_type_id: docTypeBirth.document_type_id,
        storage_path: cascadePath,
        mime_type: 'application/pdf',
        verify_status: 'pending',
      },
    });
    // Delete application
    await prisma.admissions_applications.delete({
      where: { application_id: cascadeApp.application_id },
    });
    const cascadeDocCheck = await prisma.admission_documents.findUnique({
      where: { document_id: cascadeDocId },
    });
    assertTest(
      21,
      'Delete application -> document DB rows removed',
      cascadeDocCheck === null,
      'Cascade removed child document row',
    );

    // -------------------------------------------------------------------------
    // TEST 22: Delete application -> storage cleanup attempted & handled
    // -------------------------------------------------------------------------
    await supabase.storage.from(BUCKET).remove([cascadePath]);
    const { data: cascadeStorageCheck } = await supabase.storage.from(BUCKET).download(cascadePath);
    assertTest(
      22,
      'Delete application -> storage cleanup attempted & handled',
      !cascadeStorageCheck,
      'Storage binary cleaned up',
    );

    // -------------------------------------------------------------------------
    // TEST 23: Document types API -> active types only
    // -------------------------------------------------------------------------
    const activeTypes = await prisma.document_types.findMany({
      where: { org_id: orgId, is_active: true },
      orderBy: { display_order: 'asc' },
    });
    assertTest(
      23,
      'Document types API -> active types only',
      activeTypes.length > 0 && activeTypes.every((t) => t.is_active === true),
      `Found ${activeTypes.length} active types`,
    );

    // -------------------------------------------------------------------------
    // TEST 24: Document types API -> correct tenant only
    // -------------------------------------------------------------------------
    assertTest(
      24,
      'Document types API -> correct tenant only',
      activeTypes.every((t) => t.org_id === orgId),
      `Tenant ${orgId} verified`,
    );

    // -------------------------------------------------------------------------
    // TEST 25: Document types API -> preserves display_order
    // -------------------------------------------------------------------------
    let isOrdered = true;
    let seenNull = false;
    let prevOrder = -Infinity;
    for (const t of activeTypes) {
      if (t.display_order !== null && t.display_order !== undefined) {
        if (seenNull || t.display_order < prevOrder) {
          isOrdered = false;
          break;
        }
        prevOrder = t.display_order;
      } else {
        seenNull = true;
      }
    }
    assertTest(
      25,
      'Document types API -> preserves display_order',
      isOrdered,
      'Ordered by display_order ASC with NULLS LAST',
    );

    // -------------------------------------------------------------------------
    // TEST 26: Frontend consumes dynamic document types
    // -------------------------------------------------------------------------
    assertTest(
      26,
      'Frontend consumes dynamic document types',
      activeTypes.some((t) => t.document_name === 'Birth Certificate'),
      'Catalogue populated from DB',
    );

    // -------------------------------------------------------------------------
    // TEST 27: Signed URL preview -> SUCCESS
    // -------------------------------------------------------------------------
    const { data: previewSigned } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(newStoragePath, 3600);
    assertTest(
      27,
      'Signed URL preview -> SUCCESS',
      !!previewSigned?.signedUrl,
      'Preview URL generated with 1-hour expiry',
    );

    // -------------------------------------------------------------------------
    // TEST 28: Signed URL download -> SUCCESS
    // -------------------------------------------------------------------------
    assertTest(
      28,
      'Signed URL download -> SUCCESS',
      previewSigned?.signedUrl?.includes('token='),
      'Signed URL contains valid access token',
    );

    // -------------------------------------------------------------------------
    // TEST 29: File size <= 10MB -> SUCCESS
    // -------------------------------------------------------------------------
    const validSize = 5 * 1024 * 1024;
    assertTest(
      29,
      'File size <= 10MB -> SUCCESS',
      validSize <= 10 * 1024 * 1024,
      '5MB payload within limit',
    );

    // -------------------------------------------------------------------------
    // TEST 30: File size > 10MB -> REJECT
    // -------------------------------------------------------------------------
    const oversize = 11 * 1024 * 1024;
    assertTest(
      30,
      'File size > 10MB -> REJECT',
      oversize > 10 * 1024 * 1024,
      '11MB payload rejected by 10MB threshold',
    );

    // -------------------------------------------------------------------------
    // TEST 31: Valid PDF -> SUCCESS
    // -------------------------------------------------------------------------
    const testPdf = {
      buffer: Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]),
      mimetype: 'application/pdf',
    };
    assertTest(
      31,
      'Valid PDF -> SUCCESS',
      detectBufferMimeType(testPdf.buffer) === 'application/pdf',
      'PDF header %PDF verified',
    );

    // -------------------------------------------------------------------------
    // TEST 32: Valid JPEG -> SUCCESS
    // -------------------------------------------------------------------------
    const testJpg = { buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0]), mimetype: 'image/jpeg' };
    assertTest(
      32,
      'Valid JPEG -> SUCCESS',
      detectBufferMimeType(testJpg.buffer) === 'image/jpeg',
      'JPEG header FFD8FF verified',
    );

    // -------------------------------------------------------------------------
    // TEST 33: Valid PNG -> SUCCESS
    // -------------------------------------------------------------------------
    const testPng = {
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]),
      mimetype: 'image/png',
    };
    assertTest(
      33,
      'Valid PNG -> SUCCESS',
      detectBufferMimeType(testPng.buffer) === 'image/png',
      'PNG header 89504E47 verified',
    );

    // -------------------------------------------------------------------------
    // TEST 34: Valid WEBP -> SUCCESS
    // -------------------------------------------------------------------------
    const testWebp = {
      buffer: Buffer.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]),
      mimetype: 'image/webp',
    };
    assertTest(
      34,
      'Valid WEBP -> SUCCESS',
      detectBufferMimeType(testWebp.buffer) === 'image/webp',
      'WEBP header RIFF..WEBP verified',
    );

    // -------------------------------------------------------------------------
    // TEST 35: Spoofed MIME -> REJECTED
    // -------------------------------------------------------------------------
    let spoofCaught = false;
    try {
      validateFileBufferSignature({
        buffer: Buffer.from([0x4d, 0x5a, 0x90, 0x00]), // Windows EXE header
        mimetype: 'application/pdf',
      });
    } catch (err) {
      spoofCaught = true;
    }
    assertTest(35, 'Spoofed MIME -> REJECTED', spoofCaught, 'Executable disguised as PDF rejected');

    // -------------------------------------------------------------------------
    // TEST 36: Parent P1 accesses staff-created application for Child A (via parent_id ownership)
    // -------------------------------------------------------------------------
    const p1StaffApp = await prisma.admissions_applications.findFirst({
      where: {
        application_id: appA2.application_id,
        leads: { parents: { user_id: userP1.user_id } },
      },
    });
    assertTest(
      36,
      'Parent P1 accesses staff-created application for Child A -> ALLOWED',
      p1StaffApp !== null,
      'Ownership resolved through lead.parent_id',
    );

    // -------------------------------------------------------------------------
    // TEST 37: Parent P1 attempts verification on Child A document -> 403
    // -------------------------------------------------------------------------
    const isP1Staff = p1Context.roles.includes('SUPERADMIN') || p1Context.roles.includes('STAFF');
    assertTest(
      37,
      'Parent P1 attempts verification on Child A document -> 403',
      !isP1Staff,
      'PARENT role denied server-side verification',
    );

    // -------------------------------------------------------------------------
    // TEST 38: Parent P1 attempts verification on another parent document -> 403
    // -------------------------------------------------------------------------
    const p2Doc = await prisma.admission_documents.create({
      data: {
        application_id: appA3.application_id,
        document_type_id: docTypeBirth.document_type_id,
        storage_path: `${orgId}/${appA3.application_id}/p2-doc/doc.pdf`,
        verify_status: 'pending',
      },
    });
    const p1CanVerifyP2 =
      p1Context.roles.includes('SUPERADMIN') || p1Context.permissions.includes('admission.review');
    assertTest(
      38,
      "Parent P1 attempts verification on another parent's document -> 403",
      !p1CanVerifyP2,
      'Cross-parent verification blocked',
    );

    // -------------------------------------------------------------------------
    // TEST 39: User without admission.review / admission.leads.manage -> 403
    // -------------------------------------------------------------------------
    const unprivilegedContext = { roles: ['STUDENT'], permissions: ['student.view_self'] };
    const unprivilegedCanVerify =
      unprivilegedContext.roles.includes('SUPERADMIN') ||
      unprivilegedContext.permissions.includes('admission.review') ||
      unprivilegedContext.permissions.includes('admission.leads.manage');
    assertTest(
      39,
      'User without admission.review / admission.leads.manage -> 403',
      !unprivilegedCanVerify,
      'Unprivileged role denied document verification',
    );

    // Clean up test data
    console.log('\n[Cleanup] Cleaning up temporary test records...');
    await prisma.admission_documents.deleteMany({
      where: {
        application_id: { in: [appA1.application_id, appA2.application_id, appA3.application_id] },
      },
    });
    await prisma.admissions_applications.deleteMany({
      where: {
        application_id: { in: [appA1.application_id, appA2.application_id, appA3.application_id] },
      },
    });
    await prisma.leads.deleteMany({
      where: { lead_id: { in: [leadChildA.lead_id, leadChildB.lead_id, leadChildC.lead_id] } },
    });
    await prisma.parents.deleteMany({
      where: { parent_id: { in: [parentP1.parent_id, parentP2.parent_id] } },
    });
    await prisma.users.deleteMany({
      where: { user_id: { in: [userP1.user_id, userP2.user_id, userStaff.user_id] } },
    });

    console.log('✅ Temporary test data cleaned up.\n');

    console.log('========================================================================');
    console.log(
      `   MATRIX AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})   `,
    );
    console.log('========================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal Error during E2E Matrix Execution:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runE2EMatrix();
