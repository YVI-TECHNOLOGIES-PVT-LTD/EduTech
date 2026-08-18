const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const enums = await prisma.$queryRaw`
    SELECT t.typname as enum_name, e.enumlabel as enum_value
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname LIKE '%payment%' OR t.typname LIKE '%mode%' OR t.typname LIKE '%card%'
    ORDER BY t.typname, e.enumsortorder;
  `;
  console.log('=== DATABASE ENUMS IN POSTGRESQL ===');
  console.log(JSON.stringify(enums, null, 2));

  const columns = await prisma.$queryRaw`
    SELECT column_name, data_type, udt_name, is_nullable, character_maximum_length
    FROM information_schema.columns
    WHERE table_name = 'admission_fee_payments'
    ORDER BY ordinal_position;
  `;
  console.log('=== ADMISSION_FEE_PAYMENTS COLUMNS ===');
  console.log(JSON.stringify(columns, null, 2));

  const allPaymentTables = await prisma.$queryRaw`
    SELECT table_name, column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE column_name LIKE '%card%' OR column_name LIKE '%payment%' OR table_name LIKE '%payment%' OR table_name LIKE '%fee%'
    ORDER BY table_name, ordinal_position;
  `;
  console.log('=== ALL CARD / PAYMENT RELATED COLUMNS ACROSS DB ===');
  console.log(JSON.stringify(allPaymentTables, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
