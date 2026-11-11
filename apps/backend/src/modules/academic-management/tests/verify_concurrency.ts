import prisma from '../../../lib/prismaClient';
import { AcademicYearService } from '../services/academic-year.service';
import { academic_year_status } from '../constants/academic.constants';

async function main() {
  console.log('=== CURRENT ACADEMIC YEAR CONCURRENCY TEST ===');

  const org = await prisma.organizations.findFirst({
    where: { status: 'active' },
  });
  if (!org) {
    throw new Error('No active organization found');
  }
  const orgId = org.org_id;

  // Create two distinct academic years in 'open' status
  const timestamp = Date.now().toString().slice(-5);
  const year1Name = `CONC-1-${timestamp}`;
  const year2Name = `CONC-2-${timestamp}`;

  const y1 = await AcademicYearService.createAcademicYear(
    orgId,
    {
      org_id: orgId,
      academic_year_name: year1Name,
      start_date: '2029-01-01',
      end_date: '2029-06-30',
      status: academic_year_status.open as any,
    },
    null,
  );

  const y2 = await AcademicYearService.createAcademicYear(
    orgId,
    {
      org_id: orgId,
      academic_year_name: year2Name,
      start_date: '2029-07-01',
      end_date: '2029-12-31',
      status: academic_year_status.open as any,
    },
    null,
  );

  console.log(`Created test years:`);
  console.log(`  Year 1: ${y1.academic_year_id} (${year1Name})`);
  console.log(`  Year 2: ${y2.academic_year_id} (${year2Name})`);

  console.log('\nFiring concurrent setCurrentAcademicYear for Year 1 and Year 2 simultaneously...');

  // Fire both at the exact same instant
  const results = await Promise.allSettled([
    AcademicYearService.setCurrentAcademicYear(orgId, y1.academic_year_id, null),
    AcademicYearService.setCurrentAcademicYear(orgId, y2.academic_year_id, null),
  ]);

  console.log('Promise results:');
  console.log('  Call 1 status:', results[0].status);
  console.log('  Call 2 status:', results[1].status);

  // Check how many academic years in this org currently have status = 'teaching'
  const teachingYears: any[] = await prisma.$queryRawUnsafe(
    `SELECT academic_year_id, academic_year_name, status, updated_at FROM academic_years WHERE org_id = $1::uuid AND status = 'teaching'`,
    orgId,
  );

  console.log(
    '\nPostgreSQL inspection: Academic years with status = "teaching":',
    teachingYears.length,
  );
  for (const ty of teachingYears) {
    console.log(
      `  - ${ty.academic_year_id} (${ty.academic_year_name}) updated_at: ${ty.updated_at}`,
    );
  }

  // Clean up
  await prisma.$queryRawUnsafe(
    `DELETE FROM academic_years WHERE academic_year_id IN ($1::uuid, $2::uuid)`,
    y1.academic_year_id,
    y2.academic_year_id,
  );
  console.log('\nCleaned up test years.');

  if (teachingYears.length > 1) {
    console.log(
      '\n[CONCURRENCY VULNERABILITY CONFIRMED]: Multiple academic years ended up with status = "teaching" simultaneously!',
    );
  } else {
    console.log(
      `\n[SINGLE ACTIVE YEAR MAINTAINED]: Exactly ${teachingYears.length} year has status = "teaching".`,
    );
  }
}

main().catch((err) => {
  console.error('Concurrency test failed:', err);
  process.exit(1);
});
