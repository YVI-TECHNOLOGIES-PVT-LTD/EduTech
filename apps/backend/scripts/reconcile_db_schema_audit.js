const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config();

const prisma = new PrismaClient();

async function runSchemaReconciliationAudit() {
  console.log('====================================================');
  console.log('EDUTRACK — PRISMA / LIVE POSTGRESQL RECONCILIATION AUDIT');
  console.log('====================================================\n');

  try {
    // Query information_schema.columns for admissions_applications
    const appColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'admissions_applications' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;

    console.log('[1. Live PostgreSQL Columns for admissions_applications]:');
    appColumns.forEach((c) => {
      console.log(
        `- ${c.column_name}: data_type=${c.data_type}, max_length=${c.character_maximum_length}, is_nullable=${c.is_nullable}, default=${c.column_default}`,
      );
    });

    // Query information_schema.columns for admission_documents
    const docColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'admission_documents' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;

    console.log('\n[2. Live PostgreSQL Columns for admission_documents]:');
    console.table(docColumns);

    // Query information_schema.columns for document_types
    const docTypeColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'document_types' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;

    console.log('\n[3. Live PostgreSQL Columns for document_types]:');
    console.table(docTypeColumns);

    console.log('\n====================================================');
    console.log('RECONCILIATION QUERY COMPLETE');
    console.log('====================================================');
  } catch (err) {
    console.error('Reconciliation Query Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

runSchemaReconciliationAudit();
