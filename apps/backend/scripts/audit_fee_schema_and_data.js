const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.resolve('apps/backend/.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('========================================================================');
  console.log('   FEE MANAGEMENT AUDIT — DATABASE TABLES & LIVE DATA                   ');
  console.log('========================================================================\n');

  // 1. Admission Configurations
  const configs = await prisma.admission_configurations.findMany({
    include: {
      organizations: true,
      academic_years: true,
    },
  });
  console.log(`[1] admission_configurations (${configs.length} rows):`);
  configs.forEach((c) => {
    console.log({
      configuration_id: c.configuration_id,
      org_id: c.org_id,
      org_name: c.organizations?.org_name,
      academic_year_id: c.academic_year_id,
      academic_year_name: c.academic_years?.academic_year_name,
      application_fee: c.application_fee ? c.application_fee.toString() : '0.00',
      processing_fee: c.processing_fee ? c.processing_fee.toString() : '0.00',
      total_fee: ((Number(c.application_fee) || 0) + (Number(c.processing_fee) || 0)).toFixed(2),
      start_date: c.admission_start_date,
      end_date: c.admission_end_date,
    });
  });

  // 2. Admission Decisions with scholarship_percentage
  const decisions = await prisma.admission_decisions.findMany({
    where: { scholarship_percentage: { gt: 0 } },
    take: 5,
  });
  console.log(`\n[2] admission_decisions with scholarship (${decisions.length} rows):`);
  decisions.forEach((d) => {
    console.log({
      decision_id: d.decision_id,
      application_id: d.application_id,
      decision_status: d.decision_status,
      scholarship_percentage: d.scholarship_percentage?.toString(),
    });
  });

  // 3. Admission Fee Payments
  const payments = await prisma.admission_fee_payments.findMany({
    include: {
      admissions_applications: {
        include: {
          organizations: true,
          academic_years: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
    take: 10,
  });
  console.log(`\n[3] admission_fee_payments (${payments.length} recent rows):`);
  payments.forEach((p) => {
    console.log({
      payment_id: p.payment_id,
      application_id: p.application_id,
      application_number: p.admissions_applications?.application_number,
      org_name: p.admissions_applications?.organizations?.org_name,
      amount: p.amount?.toString(),
      payment_status: p.payment_status,
      payment_date: p.payment_date,
      transaction_reference: p.transaction_reference,
      payment_mode: p.payment_mode,
      card_name: p.card_name,
      card_last_four: p.card_last_four,
      remarks: p.remarks,
      created_at: p.created_at,
    });
  });

  // 4. Duplicate Check
  const duplicateCounts = await prisma.$queryRaw`
    SELECT application_id, COUNT(*) AS count
    FROM public.admission_fee_payments
    GROUP BY application_id
    HAVING COUNT(*) > 1;
  `;
  console.log(`\n[4] Duplicate application_id check in admission_fee_payments:`, duplicateCounts);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
