/**
 * EduTrack ERP — Phase 2: Academic Year Configuration Automated Test Suite
 * Comprehensive unit and integration verification for Phase 2 modules.
 */

import assert from 'assert';
import prisma from '../../../lib/prismaClient';
import { AcademicValidator } from '../validators/academic.validator';
import { AcademicYearService } from '../services/academic-year.service';
import { GradeService } from '../services/grade.service';
import { AcademicYearGradeService } from '../services/academic-year-grade.service';
import { SectionService } from '../services/section.service';
import { AcademicAnalyticsService } from '../services/academic.analytics.service';
import { academic_year_status } from '../constants/academic.constants';
import {
  AcademicValidationError,
  DuplicateAcademicYearError,
  DuplicateGradeError,
  DuplicateSectionError,
  AcademicYearNotFoundError,
  GradeNotFoundError,
  SectionNotFoundError,
  StaffNotFoundError,
  ConflictOperationError,
  InvalidStatusTransitionError,
} from '../errors/academic.errors';

export async function runAcademicPhase2Tests() {
  console.log('===============================================================');
  console.log('  EDUTRACK ERP — PHASE 2: ACADEMIC CONFIGURATION TEST SUITE   ');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}: ${err.message}`);
      if (err.stack) {
        console.error(`    ${err.stack.split('\n')[1]}`);
      }
      failed++;
    }
  }

  // 1. Resolve real tenant organizations from PostgreSQL
  const dbOrgs = await prisma.organizations.findMany({
    where: { status: 'active' },
    take: 2,
  });

  if (dbOrgs.length < 2) {
    throw new Error(
      'Test requires at least 2 active organizations in database for tenant isolation verification',
    );
  }

  const TENANT_A = dbOrgs[0].org_id;
  const TENANT_B = dbOrgs[1].org_id;

  const staffInTenantA = await prisma.staff.findFirst({
    where: { org_id: TENANT_A, is_active: true },
  });

  const staffInTenantB = await prisma.staff.findFirst({
    where: { org_id: TENANT_B, is_active: true },
  });

  console.log(`[Test Environment Context]`);
  console.log(`  Tenant A: ${TENANT_A} (${dbOrgs[0].org_name})`);
  console.log(`  Tenant B: ${TENANT_B} (${dbOrgs[1].org_name})`);
  console.log(`  Staff in Tenant A: ${staffInTenantA?.staff_id || 'None'}`);
  console.log(`  Staff in Tenant B: ${staffInTenantB?.staff_id || 'None'}\n`);

  // --------------------------------------------------------------------------
  // SUITE 1: VALIDATOR INTEGRITY
  // --------------------------------------------------------------------------
  console.log('[Suite 1: Validator Integrity]');

  await test('AcademicValidator rejects academic year when end_date <= start_date', () => {
    assert.throws(
      () =>
        AcademicValidator.validateCreateAcademicYear({
          org_id: TENANT_A,
          academic_year_name: '2026-2027',
          start_date: '2026-12-31',
          end_date: '2026-01-01',
          status: academic_year_status.planning as any,
        }),
      (err: any) => err instanceof AcademicValidationError,
    );
  });

  await test('AcademicValidator rejects academic year when end_date equals start_date', () => {
    assert.throws(
      () =>
        AcademicValidator.validateCreateAcademicYear({
          org_id: TENANT_A,
          academic_year_name: '2026-2027',
          start_date: '2026-06-01',
          end_date: '2026-06-01',
          status: academic_year_status.planning as any,
        }),
      (err: any) => err instanceof AcademicValidationError,
    );
  });

  await test('AcademicValidator passes valid academic year payload', () => {
    AcademicValidator.validateCreateAcademicYear({
      org_id: TENANT_A,
      academic_year_name: '2026-2027',
      start_date: '2026-06-01',
      end_date: '2027-05-31',
      status: academic_year_status.open as any,
    });
  });

  await test('AcademicValidator rejects invalid date format strings', () => {
    assert.throws(
      () =>
        AcademicValidator.validateCreateAcademicYear({
          org_id: TENANT_A,
          academic_year_name: '2026-2027',
          start_date: 'invalid-date',
          end_date: '2027-05-31',
          status: academic_year_status.planning as any,
        }),
      (err: any) => err instanceof AcademicValidationError,
    );
  });

  await test('AcademicValidator enforces status transition rules (rejects archived -> planning)', () => {
    assert.throws(
      () =>
        AcademicValidator.validateUpdateAcademicYear(
          {
            start_date: new Date('2026-06-01'),
            end_date: new Date('2027-05-31'),
            status: academic_year_status.archived,
          },
          { status: academic_year_status.planning as any },
        ),
      (err: any) => err instanceof InvalidStatusTransitionError,
    );
  });

  await test('AcademicValidator permits valid status transition (planning -> admissions_open -> open)', () => {
    AcademicValidator.validateUpdateAcademicYear(
      {
        start_date: new Date('2026-06-01'),
        end_date: new Date('2027-05-31'),
        status: academic_year_status.planning,
      },
      { status: academic_year_status.admissions_open as any },
    );
  });

  await test('AcademicValidator rejects negative section capacity', () => {
    assert.throws(
      () =>
        AcademicValidator.validateCreateSection({
          academic_year_grade_id: '33333333-3333-3333-3333-333333333333',
          section_name: 'Section A',
          capacity: -10,
        }),
      (err: any) => err instanceof AcademicValidationError,
    );
  });

  await test('AcademicValidator rejects empty grade code and name', () => {
    assert.throws(
      () =>
        AcademicValidator.validateCreateGrade({
          org_id: TENANT_A,
          grade_code: '',
          grade_name: '',
          display_order: 1,
        }),
      (err: any) => err instanceof AcademicValidationError,
    );
  });

  // --------------------------------------------------------------------------
  // SUITE 2: ACADEMIC YEAR BUSINESS SERVICES & MULTI-TENANCY
  // --------------------------------------------------------------------------
  console.log('\n[Suite 2: Academic Year Business Services & Tenant Scoping]');

  let createdYearTenantA: any = null;

  await test('AcademicYearService creates academic year scoped to Tenant A', async () => {
    const uniqueName = `AY-${Date.now().toString().slice(-6)}`;
    const result = await AcademicYearService.createAcademicYear(
      TENANT_A,
      {
        org_id: TENANT_A,
        academic_year_name: uniqueName,
        start_date: '2026-06-01',
        end_date: '2027-05-31',
        status: academic_year_status.planning as any,
      },
      null,
    );

    assert.ok(result.academic_year_id);
    assert.strictEqual(result.org_id, TENANT_A);
    assert.strictEqual(result.academic_year_name, uniqueName);
    assert.strictEqual(result.status, academic_year_status.planning);
    createdYearTenantA = result;
  });

  await test('AcademicYearService prevents duplicate academic year name within Tenant A', async () => {
    assert.rejects(
      async () => {
        await AcademicYearService.createAcademicYear(
          TENANT_A,
          {
            org_id: TENANT_A,
            academic_year_name: createdYearTenantA.academic_year_name,
            start_date: '2026-06-01',
            end_date: '2027-05-31',
          },
          null,
        );
      },
      (err: any) => err instanceof DuplicateAcademicYearError,
    );
  });

  await test('AcademicYearService permits identical academic year name in Tenant B (Multi-Tenant Isolation)', async () => {
    const result = await AcademicYearService.createAcademicYear(
      TENANT_B,
      {
        org_id: TENANT_B,
        academic_year_name: createdYearTenantA.academic_year_name,
        start_date: '2026-06-01',
        end_date: '2027-05-31',
        status: academic_year_status.planning as any,
      },
      null,
    );

    assert.ok(result.academic_year_id);
    assert.strictEqual(result.org_id, TENANT_B);
    assert.strictEqual(result.academic_year_name, createdYearTenantA.academic_year_name);
  });

  await test('Tenant B cannot access Academic Year created by Tenant A (Returns 404 Not Found)', async () => {
    assert.rejects(
      async () => {
        await AcademicYearService.getAcademicYearById(
          TENANT_B,
          createdYearTenantA.academic_year_id,
        );
      },
      (err: any) => err instanceof AcademicYearNotFoundError,
    );
  });

  await test('AcademicYearService updates academic year permitted fields', async () => {
    const updated = await AcademicYearService.updateAcademicYear(
      TENANT_A,
      createdYearTenantA.academic_year_id,
      { status: academic_year_status.open as any },
      null,
    );

    assert.strictEqual(updated.status, academic_year_status.open);
  });

  await test('AcademicYearService setCurrentAcademicYear sets teaching status', async () => {
    const current = await AcademicYearService.setCurrentAcademicYear(
      TENANT_A,
      createdYearTenantA.academic_year_id,
      null,
    );

    assert.strictEqual(current.status, academic_year_status.teaching);

    const fetchedCurrent = await AcademicYearService.getCurrentAcademicYear(TENANT_A);
    assert.ok(fetchedCurrent);
    assert.strictEqual(fetchedCurrent?.academic_year_id, createdYearTenantA.academic_year_id);
  });

  // --------------------------------------------------------------------------
  // SUITE 3: GRADE MANAGEMENT & TENANT SCOPING
  // --------------------------------------------------------------------------
  console.log('\n[Suite 3: Grade Management & Duplicate Protection]');

  let createdGradeTenantA: any = null;

  await test('GradeService creates grade with board and display order', async () => {
    const uniqueCode = `G${Date.now().toString().slice(-4)}`;
    const result = await GradeService.createGrade(
      TENANT_A,
      {
        org_id: TENANT_A,
        grade_code: uniqueCode,
        grade_name: `Grade ${uniqueCode}`,
        board: 'CBSE',
        display_order: 10,
        is_active: true,
      },
      null,
    );

    assert.ok(result.grade_id);
    assert.strictEqual(result.org_id, TENANT_A);
    assert.strictEqual(result.grade_code, uniqueCode);
    assert.strictEqual(result.board, 'CBSE');
    createdGradeTenantA = result;
  });

  await test('GradeService prevents duplicate grade_code within Tenant A', async () => {
    assert.rejects(
      async () => {
        await GradeService.createGrade(
          TENANT_A,
          {
            org_id: TENANT_A,
            grade_code: createdGradeTenantA.grade_code,
            grade_name: `Another Grade Name`,
            display_order: 11,
          },
          null,
        );
      },
      (err: any) => err instanceof DuplicateGradeError,
    );
  });

  await test('Tenant B cannot fetch or update Grade created by Tenant A (Returns 404)', async () => {
    assert.rejects(
      async () => {
        await GradeService.getGradeById(TENANT_B, createdGradeTenantA.grade_id);
      },
      (err: any) => err instanceof GradeNotFoundError,
    );

    assert.rejects(
      async () => {
        await GradeService.updateGrade(
          TENANT_B,
          createdGradeTenantA.grade_id,
          { grade_name: 'Hacked Grade Name' },
          null,
        );
      },
      (err: any) => err instanceof GradeNotFoundError,
    );
  });

  // --------------------------------------------------------------------------
  // SUITE 4: ACADEMIC YEAR GRADE MAPPING
  // --------------------------------------------------------------------------
  console.log('\n[Suite 4: Academic Year Grade Mapping]');

  let createdMappingTenantA: any = null;

  await test('AcademicYearGradeService maps grade to academic year', async () => {
    const mapping = await AcademicYearGradeService.createAcademicYearGrade(
      TENANT_A,
      {
        academic_year_id: createdYearTenantA.academic_year_id,
        grade_id: createdGradeTenantA.grade_id,
        intake_capacity: 120,
        is_active: true,
      },
      null,
    );

    assert.ok(mapping.academic_year_grade_id);
    assert.strictEqual(mapping.academic_year_id, createdYearTenantA.academic_year_id);
    assert.strictEqual(mapping.grade_id, createdGradeTenantA.grade_id);
    assert.strictEqual(mapping.intake_capacity, 120);
    createdMappingTenantA = mapping;
  });

  await test('AcademicYearGradeService prevents duplicate mapping of same grade to same year', async () => {
    assert.rejects(
      async () => {
        await AcademicYearGradeService.createAcademicYearGrade(
          TENANT_A,
          {
            academic_year_id: createdYearTenantA.academic_year_id,
            grade_id: createdGradeTenantA.grade_id,
          },
          null,
        );
      },
      (err: any) => err instanceof ConflictOperationError,
    );
  });

  await test('AcademicYearGradeService rejects cross-tenant mapping (Tenant B Year + Tenant A Grade)', async () => {
    assert.rejects(
      async () => {
        await AcademicYearGradeService.createAcademicYearGrade(
          TENANT_A,
          {
            academic_year_id: '99999999-9999-9999-9999-999999999999', // Non-existent in Tenant A
            grade_id: createdGradeTenantA.grade_id,
          },
          null,
        );
      },
      (err: any) => err instanceof AcademicYearNotFoundError,
    );
  });

  // --------------------------------------------------------------------------
  // SUITE 5: SECTION CREATION & CLASS TEACHER ASSIGNMENT
  // --------------------------------------------------------------------------
  console.log('\n[Suite 5: Section Creation & Class Teacher Assignment]');

  let createdSectionTenantA: any = null;

  await test('SectionService creates section under valid grade offering', async () => {
    const section = await SectionService.createSection(
      TENANT_A,
      {
        academic_year_grade_id: createdMappingTenantA.academic_year_grade_id,
        section_name: 'Section A',
        capacity: 40,
        room_no: 'Room 101',
        is_active: true,
      },
      null,
    );

    assert.ok(section.section_id);
    assert.strictEqual(section.section_name, 'Section A');
    assert.strictEqual(section.capacity, 40);
    createdSectionTenantA = section;
  });

  await test('SectionService prevents duplicate section name under same grade offering', async () => {
    assert.rejects(
      async () => {
        await SectionService.createSection(
          TENANT_A,
          {
            academic_year_grade_id: createdMappingTenantA.academic_year_grade_id,
            section_name: 'Section A',
            capacity: 40,
          },
          null,
        );
      },
      (err: any) => err instanceof DuplicateSectionError,
    );
  });

  await test('Tenant B cannot access or modify Section created in Tenant A', async () => {
    assert.rejects(
      async () => {
        await SectionService.getSectionById(TENANT_B, createdSectionTenantA.section_id);
      },
      (err: any) => err instanceof SectionNotFoundError,
    );
  });

  await test('AcademicYearGradeService blocks deleting grade offering with existing sections', async () => {
    assert.rejects(
      async () => {
        await AcademicYearGradeService.deleteAcademicYearGrade(
          TENANT_A,
          createdMappingTenantA.academic_year_grade_id,
        );
      },
      (err: any) => err instanceof ConflictOperationError,
    );
  });

  if (staffInTenantB) {
    await test('Class Teacher assignment rejects staff from another organization (Tenant B Staff in Tenant A Section)', async () => {
      assert.rejects(
        async () => {
          await SectionService.assignClassTeacher(
            TENANT_A,
            createdSectionTenantA.section_id,
            staffInTenantB.staff_id,
            null,
          );
        },
        (err: any) => err instanceof StaffNotFoundError,
      );
    });
  }

  if (staffInTenantA) {
    await test('Class Teacher assignment assigns valid staff member from same tenant', async () => {
      const updated = await SectionService.assignClassTeacher(
        TENANT_A,
        createdSectionTenantA.section_id,
        staffInTenantA.staff_id,
        null,
      );

      assert.strictEqual(updated.class_teacher_id, staffInTenantA.staff_id);
      assert.ok(updated.class_teacher_name);
    });
  }

  await test('Class Teacher assignment supports unassigning teacher (staff_id: null)', async () => {
    const updated = await SectionService.assignClassTeacher(
      TENANT_A,
      createdSectionTenantA.section_id,
      null,
      null,
    );

    assert.strictEqual(updated.class_teacher_id, null);
  });

  // --------------------------------------------------------------------------
  // SUITE 6: ACADEMIC CONFIGURATION OVERVIEW & READINESS
  // --------------------------------------------------------------------------
  console.log('\n[Suite 6: Configuration Overview & Readiness Scorecard]');

  await test('AcademicAnalyticsService calculates tenant-scoped overview metrics', async () => {
    const overview = await AcademicAnalyticsService.getOverview(TENANT_A);

    assert.ok(overview.academic_years);
    assert.ok(overview.academic_years.total >= 1);
    assert.strictEqual(
      overview.academic_years.current?.academic_year_id,
      createdYearTenantA.academic_year_id,
    );
    assert.ok(overview.grades.total >= 1);
    assert.ok(overview.grade_offerings.total >= 1);
    assert.ok(overview.sections.total >= 1);
    assert.strictEqual(overview.readiness.academic_year_configured, true);
    assert.strictEqual(overview.readiness.grades_configured, true);
    assert.strictEqual(overview.readiness.grade_offerings_configured, true);
    assert.strictEqual(overview.readiness.sections_configured, true);
  });

  await test('Empty organization returns 0 counts and false readiness flags', async () => {
    const EMPTY_TENANT = '00000000-0000-0000-0000-000000000099';
    const overview = await AcademicAnalyticsService.getOverview(EMPTY_TENANT);

    assert.strictEqual(overview.academic_years.total, 0);
    assert.strictEqual(overview.academic_years.current, null);
    assert.strictEqual(overview.grades.total, 0);
    assert.strictEqual(overview.grade_offerings.total, 0);
    assert.strictEqual(overview.sections.total, 0);
    assert.strictEqual(overview.teacher_assignments.assigned, 0);
    assert.strictEqual(overview.teacher_assignments.unassigned, 0);
    assert.strictEqual(overview.readiness.academic_year_configured, false);
    assert.strictEqual(overview.readiness.grades_configured, false);
    assert.strictEqual(overview.readiness.grade_offerings_configured, false);
    assert.strictEqual(overview.readiness.sections_configured, false);
    assert.strictEqual(overview.readiness.class_teachers_assigned, false);
  });

  // --------------------------------------------------------------------------
  // CLEANUP TEST RECORDS (Keep database clean)
  // --------------------------------------------------------------------------
  console.log('\n[Tear Down: Cleaning up test artifacts]');
  try {
    if (createdSectionTenantA) {
      await prisma.sections.delete({ where: { section_id: createdSectionTenantA.section_id } });
    }
    if (createdMappingTenantA) {
      await prisma.academic_year_grades.delete({
        where: { academic_year_grade_id: createdMappingTenantA.academic_year_grade_id },
      });
    }
    if (createdGradeTenantA) {
      await prisma.grades.delete({ where: { grade_id: createdGradeTenantA.grade_id } });
    }
    if (createdYearTenantA) {
      await prisma.academic_years.delete({
        where: { academic_year_id: createdYearTenantA.academic_year_id },
      });
    }
    console.log('  ✓ Test artifacts cleaned up successfully');
  } catch (cleanErr: any) {
    console.warn(`  Warning during cleanup: ${cleanErr.message}`);
  }

  console.log('\n===============================================================');
  console.log(`  PHASE 2 TEST RESULTS: ${passed} PASSED, ${failed} FAILED  `);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runAcademicPhase2Tests()
    .then(() => {
      console.log('\nAll tests completed successfully. Exiting.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Test Suite Fatal Error:', err);
      process.exit(1);
    });
}
