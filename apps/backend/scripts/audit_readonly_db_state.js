const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const BUCKET = process.env.SUPABASE_ADMISSION_DOCUMENTS_BUCKET || 'admission-documents';

async function runReadOnlyForensicAudit() {
  console.log('====================================================');
  console.log('EDUTRACK — STAGE-1 REAL SUBMISSION READ-ONLY AUDIT');
  console.log('====================================================\n');

  try {
    // 1. Audit latest real admissions_applications record in live DB
    console.log('[AUDIT 1: Latest Real admissions_applications in PostgreSQL]');
    const latestApps = await prisma.admissions_applications.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        admission_documents: {
          include: { document_types: true },
        },
        leads: true,
      },
    });

    console.log(`Found ${latestApps.length} recent applications in PostgreSQL:`);
    for (const app of latestApps) {
      console.log(`\n----------------------------------------------------`);
      console.log(`Application ID:     ${app.application_id}`);
      console.log(`Application Number: ${app.application_number}`);
      console.log(`Status:             ${app.status}`);
      console.log(`Created At:         ${app.created_at}`);
      console.log(`Created By:         ${app.created_by || 'N/A'}`);
      console.log(`Org ID (Tenant):    ${app.org_id}`);
      console.log(`Lead Number:        ${app.leads?.lead_number || 'N/A'}`);
      console.log(`Documents Count:    ${app.admission_documents.length}`);

      // Check raw column properties if present
      console.log(`Raw Field Inspection:`);
      console.log(
        `- nationality:             ${app.nationality !== undefined ? app.nationality : '[NOT IN PRISMA MODEL]'}`,
      );
      console.log(
        `- previous_school_name:    ${app.previous_school_name !== undefined ? app.previous_school_name : '[NOT IN PRISMA MODEL]'}`,
      );
      console.log(
        `- previous_school_address: ${app.previous_school_address !== undefined ? app.previous_school_address : '[NOT IN PRISMA MODEL]'}`,
      );
      console.log(
        `- previous_school_board:   ${app.previous_school_board !== undefined ? app.previous_school_board : '[NOT IN PRISMA MODEL]'}`,
      );
      console.log(
        `- previous_grade:          ${app.previous_grade !== undefined ? app.previous_grade : '[NOT IN PRISMA MODEL]'}`,
      );
      console.log(
        `- previous_school_year:    ${app.previous_school_year !== undefined ? app.previous_school_year : '[NOT IN PRISMA MODEL]'}`,
      );

      if (app.admission_documents.length > 0) {
        console.log(`  Linked Documents:`);
        for (const doc of app.admission_documents) {
          console.log(`  * Doc ID: ${doc.document_id}`);
          console.log(`    Type:   ${doc.document_types?.document_name || doc.document_type_id}`);
          console.log(`    Path:   ${doc.storage_path}`);
          console.log(
            `    File:   ${doc.original_file_name || 'N/A'} (${doc.file_size || 'N/A'} bytes)`,
          );
          console.log(`    Status: ${doc.verify_status}`);
        }
      }
    }

    // 2. Audit Document Types in PostgreSQL
    console.log('\n====================================================');
    console.log('[AUDIT 2: PostgreSQL document_types Table]');
    const docTypes = await prisma.document_types.findMany({ take: 20 });
    console.log(`Found ${docTypes.length} document type definitions in PostgreSQL:`);
    for (const dt of docTypes) {
      console.log(`- ID: ${dt.document_type_id} | Org: ${dt.org_id} | Name: "${dt.document_name}"`);
    }

    // 3. Audit Supabase Storage Bucket & Real Storage Objects
    console.log('\n====================================================');
    console.log(`[AUDIT 3: Supabase Storage Bucket '${BUCKET}' Objects]`);
    if (SUPABASE_URL && SUPABASE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

      const { data: buckets } = await supabase.storage.listBuckets();
      const admissionBucket = buckets?.find((b) => b.name === BUCKET);
      if (admissionBucket) {
        console.log(
          `✅ Bucket '${BUCKET}' found. Public: ${admissionBucket.public ? 'YES (WARNING)' : 'false (PRIVATE)'}`,
        );
      }

      // List objects in root of bucket
      const { data: rootFiles, error: rErr } = await supabase.storage
        .from(BUCKET)
        .list('', { limit: 20 });
      if (rErr) {
        console.log(`ℹ️ Storage List Info: ${rErr.message}`);
      } else {
        console.log(`Root Objects/Folders in '${BUCKET}': ${rootFiles.length} items`);
        for (const item of rootFiles) {
          console.log(`- Folder/File: ${item.name}`);
        }
      }
    }

    console.log('\n====================================================');
    console.log('READ-ONLY FORENSIC AUDIT COMPLETE');
    console.log('====================================================');
  } catch (err) {
    console.error('Audit Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

runReadOnlyForensicAudit();
