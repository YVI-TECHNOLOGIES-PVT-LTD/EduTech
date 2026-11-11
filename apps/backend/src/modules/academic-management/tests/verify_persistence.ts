import prisma from '../../../lib/prismaClient';
import { AcademicYearService } from '../services/academic-year.service';
import { academic_year_status } from '../constants/academic.constants';
import { PrismaClient } from '@prisma/client';

async function main() {
  console.log('=== DURABLE PERSISTENCE VERIFICATION TEST ===');

  // 1. Get an active organization
  const org = await prisma.organizations.findFirst({
    where: { status: 'active' },
  });
  if (!org) {
    throw new Error('No active organization found');
  }
  const orgId = org.org_id;
  console.log(`Using Org ID: ${orgId}`);

  // 2. Create record via AcademicYearService
  const testYearName = `PERSIST-TEST-${Date.now().toString().slice(-6)}`;
  console.log(`Creating record with name: ${testYearName}`);
  const created = await AcademicYearService.createAcademicYear(
    orgId,
    {
      org_id: orgId,
      academic_year_name: testYearName,
      start_date: '2028-01-01',
      end_date: '2028-12-31',
      status: academic_year_status.planning as any,
    },
    null,
  );
  console.log(`Created Academic Year ID: ${created.academic_year_id}`);

  // 3. Verify record exists directly in physical PostgreSQL table via raw SQL query
  const rawSqlCheck: any[] = await prisma.$queryRawUnsafe(
    `SELECT academic_year_id, org_id, academic_year_name, status, created_at FROM academic_years WHERE academic_year_id = $1::uuid`,
    created.academic_year_id,
  );
  console.log('Direct PostgreSQL SELECT result:', rawSqlCheck);
  if (rawSqlCheck.length === 0) {
    throw new Error('FAILED: Record not found in physical PostgreSQL table!');
  }
  if (rawSqlCheck[0].academic_year_name !== testYearName) {
    throw new Error('FAILED: PostgreSQL record data mismatch!');
  }
  console.log('✓ Verified: Record physically exists in PostgreSQL table "academic_years"');

  // 4. Simulate process restart by disconnecting Prisma client and spawning completely new PrismaClient
  console.log('Disconnecting current Prisma instance to simulate process termination...');
  await prisma.$disconnect();

  console.log(
    'Spawning completely new, isolated PrismaClient instance (process restart simulation)...',
  );
  const freshPrisma = new PrismaClient();
  await freshPrisma.$connect();

  // 5. Read record again via fresh PrismaClient
  const retrievedAfterRestart: any[] = await freshPrisma.$queryRawUnsafe(
    `SELECT academic_year_id, org_id, academic_year_name, status FROM academic_years WHERE academic_year_id = $1::uuid`,
    created.academic_year_id,
  );
  console.log('Retrieved after simulated process restart:', retrievedAfterRestart);
  if (
    retrievedAfterRestart.length === 0 ||
    retrievedAfterRestart[0].academic_year_name !== testYearName
  ) {
    throw new Error('FAILED: Record was lost after client restart!');
  }
  console.log('✓ Verified: Record remains durably available across process restarts!');

  // 6. Clean up test record from database
  await freshPrisma.$queryRawUnsafe(
    `DELETE FROM academic_years WHERE academic_year_id = $1::uuid`,
    created.academic_year_id,
  );
  console.log('✓ Cleaned up test record');
  await freshPrisma.$disconnect();

  console.log('=== DURABLE PERSISTENCE TEST: PASSED ===');
}

main().catch((err) => {
  console.error('Persistence verification failed:', err);
  process.exit(1);
});
