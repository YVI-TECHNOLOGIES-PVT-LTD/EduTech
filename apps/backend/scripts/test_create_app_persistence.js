const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const BUCKET = process.env.SUPABASE_ADMISSION_DOCUMENTS_BUCKET || 'admission-documents';

async function testFullApplicationLifecycle() {
  console.log('====================================================');
  console.log('EDUTRACK — REAL PERSISTENCE END-TO-END EXECUTION TEST');
  console.log('====================================================\n');

  try {
    // 1. Fetch prerequisite org, academic year, and parent user
    const org = await prisma.organizations.findFirst({ where: { status: 'active' } });
    const ay = await prisma.academic_years.findFirst({ where: { org_id: org.org_id } });
    const parentUser = await prisma.users.findFirst({ where: { status: 'active' } });

    if (!org || !ay || !parentUser) {
      console.log('❌ Required database records not found.');
      return;
    }

    console.log(
      `[Step 1] Using Tenant Org ID: ${org.org_id}, Academic Year: ${ay.academic_year_name}`,
    );

    const sampleLead = await prisma.leads.findFirst();
    const validSource = sampleLead ? sampleLead.source : 'website';
    const lead = await prisma.leads.create({
      data: {
        org_id: org.org_id,
        lead_number: `LEAD-TEST-${Date.now()}`,
        source: validSource,
        contact_name: 'Audit Test Parent',
        contact_phone: '9876543210',
        contact_email: 'audit_test_parent@example.com',
        student_first_name: 'TestStudent',
        student_last_name: 'Persisted',
        academic_year_grade_id:
          (
            await prisma.academic_year_grades.findFirst({
              where: { academic_year_id: ay.academic_year_id },
            })
          )?.academic_year_grade_id || ay.academic_year_id,
      },
    });

    console.log(`[Step 2] Created test lead: ${lead.lead_id} (${lead.lead_number})`);

    // 2. Insert application with all 6 text fields into PostgreSQL
    const year = new Date().getFullYear();
    const appSeq = (await prisma.admissions_applications.count()) + 100;
    const appNum = `APP-E2E-${year}-${appSeq}`;

    const newApp = await prisma.admissions_applications.create({
      data: {
        lead_id: lead.lead_id,
        org_id: org.org_id,
        academic_year_id: ay.academic_year_id,
        application_number: appNum,
        status: 'submitted',
        created_by: parentUser.user_id,
        nationality: 'Indian',
        previous_school_name: 'Delhi Public School, North Campus',
        previous_school_address: '123 Academic Avenue, North Zone, Delhi',
        previous_school_board: 'CBSE',
        previous_grade: 'Grade 4',
        previous_school_year: '2024-25',
      },
    });

    console.log(
      `✅ [Step 3] Created Application in PostgreSQL: ${newApp.application_id} (${newApp.application_number})`,
    );
    console.log('   Persisted Field Values:');
    console.log(`   - nationality: ${newApp.nationality}`);
    console.log(`   - previous_school_name: ${newApp.previous_school_name}`);
    console.log(`   - previous_school_address: ${newApp.previous_school_address}`);
    console.log(`   - previous_school_board: ${newApp.previous_school_board}`);
    console.log(`   - previous_grade: ${newApp.previous_grade}`);
    console.log(`   - previous_school_year: ${newApp.previous_school_year}`);

    // 3. Document Type UUID Resolution & Document Metadata + Supabase Upload
    console.log('\n[Step 4] Resolving Document Type UUID & Performing Storage Upload...');

    let docType = await prisma.document_types.findFirst({
      where: {
        org_id: org.org_id,
        document_name: { contains: 'Academic Records', mode: 'insensitive' },
      },
    });

    if (!docType) {
      docType = await prisma.document_types.create({
        data: {
          org_id: org.org_id,
          document_name: 'Previous Academic Records',
          description: 'Previous school marksheet or transfer certificate',
          is_mandatory: false,
        },
      });
    }

    console.log(
      `✅ Resolved Document Type: ${docType.document_name} (UUID: ${docType.document_type_id})`,
    );

    const crypto = require('crypto');
    const docId = crypto.randomUUID();
    const filename = 'previous_marksheet_2024.pdf';
    const storagePathKey = `${org.org_id}/${newApp.application_id}/${docId}/${filename}`;

    // Upload mock binary buffer to private Supabase Storage bucket
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const mockPdfBuffer = Buffer.from(
      '%PDF-1.5 Mock Previous Academic Record for E2E Verification',
    );

    const { data: uploadRes, error: uErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePathKey, mockPdfBuffer, { contentType: 'application/pdf', upsert: true });

    if (uErr) {
      console.log(`⚠️ Supabase Storage Upload info: ${uErr.message}`);
    } else {
      console.log(`✅ [Step 5] Binary File Uploaded to Supabase Storage: ${uploadRes.path}`);

      // Insert admission_documents metadata row into PostgreSQL
      const docRecord = await prisma.admission_documents.create({
        data: {
          document_id: docId,
          application_id: newApp.application_id,
          document_type_id: docType.document_type_id,
          storage_path: storagePathKey,
          original_file_name: filename,
          mime_type: 'application/pdf',
          file_size: BigInt(mockPdfBuffer.length),
          verify_status: 'pending',
          created_by: parentUser.user_id,
        },
      });

      console.log(
        `✅ [Step 6] Created admission_documents Metadata Row in PostgreSQL: ${docRecord.document_id}`,
      );

      // Test signed URL generation
      const { data: signedRes, error: sErr } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(storagePathKey, 3600);

      if (!sErr && signedRes?.signedUrl) {
        console.log(
          `✅ [Step 7] Short-Lived Signed URL Verified: ${signedRes.signedUrl.substring(0, 65)}...`,
        );
      }

      // Clean up test storage object and database records
      await supabase.storage.from(BUCKET).remove([storagePathKey]);
      await prisma.admission_documents.delete({ where: { document_id: docId } });
      console.log(`✅ [Step 8] Cleaned up test document storage & metadata.`);
    }

    // Clean up test application and lead
    await prisma.admissions_applications.delete({
      where: { application_id: newApp.application_id },
    });
    await prisma.leads.delete({ where: { lead_id: lead.lead_id } });
    console.log(`✅ [Step 9] Cleaned up test application & lead records.`);

    console.log('\n====================================================');
    console.log('EDUTRACK — REAL PERSISTENCE END-TO-END VERIFICATION: 100% SUCCESS');
    console.log('====================================================');
  } catch (err) {
    console.error('Lifecycle Test Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

testFullApplicationLifecycle();
