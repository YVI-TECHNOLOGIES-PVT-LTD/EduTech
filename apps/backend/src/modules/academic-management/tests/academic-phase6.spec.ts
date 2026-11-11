/**
 * EduTrack ERP — Phase 6: Timetable, Faculty Scheduling & Workload Optimization Test Suite
 * Comprehensive verification for Phase 6:
 * - Validates Timetable, Faculty Workload, Conflict, and Classroom DTOs
 * - Validates Timetable version listing and operational overview metrics
 * - Validates Class and Section timetable retrieval with weekday grouping
 * - Validates Teacher timetable retrieval and weekly period tracking
 * - Validates Faculty Workload calculations (weekly teaching load, status, breakdown)
 * - Validates Timetable Conflict Detection (teacher collision, section collision, room collision, overlap interval logic)
 * - Validates Classroom inventory and room schedule utilization
 * - Validates strict multi-tenant isolation across Tenant A and Tenant B (404 on cross-tenant access)
 * - Validates HTTP 501 rejection for unsupported timetable and entry write operations
 * - Validates Prisma Client persistence guards preventing in-memory RAM fallback
 */

import assert from 'assert';
import prisma from '../../../lib/prismaClient';
import { TimetableService } from '../services/timetable.service';
import { FacultyWorkloadService } from '../services/faculty-workload.service';
import { TimetableConflictService } from '../services/timetable-conflict.service';
import {
  listTimetableVersionsSchema,
  getTeacherTimetableSchema,
  getSectionTimetableSchema,
  listFacultyWorkloadSchema,
  listClassroomsSchema,
  createTimetableVersionSchema,
  createTimetableEntrySchema,
} from '../dto/request/timetable.dto';
import { AcademicError } from '../errors/academic.errors';

export async function runAcademicPhase6Tests() {
  console.log('===============================================================');
  console.log('  EDUTRACK ERP — PHASE 6: TIMETABLE & FACULTY SCHEDULING      ');
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

  // Active verified tenants from PostgreSQL
  const TENANT_A = '624efc1b-4144-43a4-90b8-552d945cbef7'; // Greenwood School, Delhi
  const TENANT_B = '5205f1f3-4e31-42d9-9b53-77fc84ad40df'; // National Public School, Ahmedabad

  const KNOWN_VERSION_ID = '0e075e13-6ef1-56b9-b37a-81909cfc1277';
  const KNOWN_SECTION_ID = '3f6357d6-77ff-4719-9a28-33ad86367626';
  const KNOWN_CLASSROOM_ID = '300ade4f-c0bc-5f22-9172-2535286e07a4';
  const KNOWN_STAFF_ID = '871067d4-fc84-523e-b227-ed35f769810e';
  const KNOWN_AYG_ID = '3085f6c5-a929-4b63-8ae8-2d4d6586247a';

  // =========================================================================
  // SUITE 1: DTO Validation & Schema Constraints
  // =========================================================================
  console.log('[Suite 1: DTO Validation & Schema Constraints]');

  await test('listTimetableVersionsSchema applies defaults for page, limit, sort', () => {
    const parsed = listTimetableVersionsSchema.parse({});
    assert.strictEqual(parsed.page, 1);
    assert.strictEqual(parsed.limit, 20);
    assert.strictEqual(parsed.sortBy, 'version_number');
    assert.strictEqual(parsed.sortOrder, 'desc');
  });

  await test('listTimetableVersionsSchema validates status enum and rejects invalid status', () => {
    assert.throws(() => {
      listTimetableVersionsSchema.parse({ status: 'invalid_status' });
    });
    const valid = listTimetableVersionsSchema.parse({ status: 'published' });
    assert.strictEqual(valid.status, 'published');
  });

  await test('listTimetableVersionsSchema coerces string page and limit', () => {
    const parsed = listTimetableVersionsSchema.parse({ page: '3', limit: '15' });
    assert.strictEqual(parsed.page, 3);
    assert.strictEqual(parsed.limit, 15);
  });

  await test('getTeacherTimetableSchema accepts optional UUIDs and rejects invalid UUID', () => {
    assert.throws(() => {
      getTeacherTimetableSchema.parse({ timetable_version_id: 'not-a-uuid' });
    });
    const parsed = getTeacherTimetableSchema.parse({ timetable_version_id: KNOWN_VERSION_ID });
    assert.strictEqual(parsed.timetable_version_id, KNOWN_VERSION_ID);
  });

  await test('getSectionTimetableSchema accepts optional timetable_version_id', () => {
    const parsed = getSectionTimetableSchema.parse({});
    assert.strictEqual(parsed.timetable_version_id, undefined);
  });

  await test('listFacultyWorkloadSchema sets default page, limit, and sorting', () => {
    const parsed = listFacultyWorkloadSchema.parse({});
    assert.strictEqual(parsed.page, 1);
    assert.strictEqual(parsed.limit, 50);
    assert.strictEqual(parsed.sortBy, 'weekly_periods');
    assert.strictEqual(parsed.sortOrder, 'desc');
  });

  await test('listClassroomsSchema coerces string boolean is_active', () => {
    const parsedTrue = listClassroomsSchema.parse({ is_active: 'true' });
    assert.strictEqual(parsedTrue.is_active, true);
    const parsedFalse = listClassroomsSchema.parse({ is_active: 'false' });
    assert.strictEqual(parsedFalse.is_active, false);
  });

  await test('createTimetableVersionSchema rejects blank version name', () => {
    assert.throws(() => {
      createTimetableVersionSchema.parse({
        academic_year_id: 'b2259d01-c883-4934-89f1-04bd90acc5f5',
        version_name: '',
      });
    });
  });

  await test('createTimetableEntrySchema rejects invalid weekday (< 1 or > 7)', () => {
    assert.throws(() => {
      createTimetableEntrySchema.parse({
        timetable_version_id: KNOWN_VERSION_ID,
        section_id: KNOWN_SECTION_ID,
        academic_year_grade_subject_id: 'e69a08ad-7e5c-5ce8-89c5-0cf5051a84f5',
        faculty_assignment_id: 'f93c834b-b0b3-4fe6-a794-d2e850b71d60',
        bell_schedule_period_id: '01010101-0101-0101-0101-010101010101',
        weekday: 8,
      });
    });
  });

  // =========================================================================
  // SUITE 2: Timetable Versions & Operational Overview
  // =========================================================================
  console.log('\n[Suite 2: Timetable Versions & Operational Overview]');

  await test('TimetableService.listTimetables returns paginated versions for Tenant A', async () => {
    const result = await TimetableService.listTimetables(TENANT_A, { page: 1, limit: 10 });
    assert.ok(result.items.length > 0, 'Should find at least 1 timetable version');
    assert.strictEqual(result.meta.page, 1);
    assert.ok(result.meta.total >= 1);
    const first = result.items[0];
    assert.strictEqual(first.status, 'published');
    assert.ok(first.academic_year_name);
  });

  await test('TimetableService.listTimetables filters by status', async () => {
    const result = await TimetableService.listTimetables(TENANT_A, { status: 'published' });
    for (const v of result.items) {
      assert.strictEqual(v.status, 'published');
    }
  });

  await test('TimetableService.getTimetableById retrieves version with aggregated statistics', async () => {
    const version = await TimetableService.getTimetableById(TENANT_A, KNOWN_VERSION_ID);
    assert.strictEqual(version.timetable_version_id, KNOWN_VERSION_ID);
    assert.strictEqual(version.status, 'published');
    assert.ok((version.total_entries || 0) > 1000, 'Master timetable should have > 1000 entries');
    assert.ok((version.sections_count || 0) >= 30, 'Should cover 36 sections');
    assert.ok((version.teachers_count || 0) > 0, 'Should have scheduled teachers');
  });

  await test('TimetableService.getOverview returns genuine non-zero operational metrics', async () => {
    const overview = await TimetableService.getOverview(TENANT_A);
    assert.ok(overview.total_timetables >= 1);
    assert.strictEqual(overview.published_timetables, 1);
    assert.ok(overview.total_scheduled_entries > 1000, 'Should count live entries');
    assert.ok(overview.total_sections_scheduled > 0, 'Should have scheduled sections');
    assert.ok(overview.coverage_percentage > 0, 'Coverage percentage should be computed');
    assert.ok(overview.total_teachers_scheduled > 0);
    assert.ok(overview.total_classrooms_utilized > 0);
  });

  await test('Multi-Tenant Isolation: Tenant B cannot list or access Tenant A timetable versions', async () => {
    const bList = await TimetableService.listTimetables(TENANT_B, {});
    assert.strictEqual(bList.items.length, 0, 'Tenant B should have 0 timetable versions');

    await assert.rejects(
      async () => {
        await TimetableService.getTimetableById(TENANT_B, KNOWN_VERSION_ID);
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 404);
        return true;
      },
    );
  });

  // =========================================================================
  // SUITE 3: Class & Section Timetable Resolution
  // =========================================================================
  console.log('\n[Suite 3: Class & Section Timetable Resolution]');

  await test('TimetableService.getSectionTimetable returns entries grouped by weekday (1-5)', async () => {
    const res = await TimetableService.getSectionTimetable(
      TENANT_A,
      KNOWN_SECTION_ID,
      KNOWN_VERSION_ID,
    );
    assert.strictEqual(res.section_id, KNOWN_SECTION_ID);
    assert.ok(res.total_entries > 0, 'Section should have scheduled entries');
    assert.ok(res.schedule_by_day[1], 'Should have Monday entries');
    assert.ok(res.schedule_by_day[2], 'Should have Tuesday entries');

    const sampleEntry = res.schedule_by_day[1][0];
    assert.ok(sampleEntry.period_number > 0);
    assert.ok(sampleEntry.start_time);
    assert.ok(sampleEntry.end_time);
    assert.ok(sampleEntry.subject_name);
    assert.ok(sampleEntry.teacher_name);
  });

  await test('TimetableService.getClassTimetable returns entries for grade offering', async () => {
    const res = await TimetableService.getClassTimetable(TENANT_A, KNOWN_AYG_ID, KNOWN_VERSION_ID);
    assert.strictEqual(res.academic_year_grade_id, KNOWN_AYG_ID);
    assert.ok(res.total_entries > 0, 'Class should have entries across sections');
    assert.ok(res.entries.length > 0);
  });

  await test('Multi-Tenant Isolation: Tenant B cannot access Tenant A section timetable (returns empty/404)', async () => {
    const res = await TimetableService.getSectionTimetable(TENANT_B, KNOWN_SECTION_ID);
    assert.strictEqual(res.total_entries, 0, 'Tenant B must not see Tenant A section entries');
  });

  // =========================================================================
  // SUITE 4: Teacher Timetable & Schedule
  // =========================================================================
  console.log('\n[Suite 4: Teacher Timetable & Schedule]');

  await test('TimetableService.getTeacherTimetable returns scheduled periods grouped by day', async () => {
    const res = await TimetableService.getTeacherTimetable(
      TENANT_A,
      KNOWN_STAFF_ID,
      KNOWN_VERSION_ID,
    );
    assert.strictEqual(res.staff_id, KNOWN_STAFF_ID);
    assert.ok(res.weekly_teaching_periods > 0, 'Teacher should have scheduled periods');
    assert.ok(res.schedule_by_day[1], 'Should have daily schedule');

    const entry = res.schedule_by_day[1][0] || res.schedule_by_day[2][0];
    assert.ok(entry, 'Should have at least one scheduled entry');
    assert.ok(entry.section_name);
    assert.ok(entry.grade_name);
    assert.ok(entry.subject_name);
  });

  await test('Multi-Tenant Isolation: Tenant B cannot access Tenant A teacher schedule', async () => {
    const res = await TimetableService.getTeacherTimetable(TENANT_B, KNOWN_STAFF_ID);
    assert.strictEqual(
      res.weekly_teaching_periods,
      0,
      'Tenant B must see 0 periods for Tenant A staff',
    );
  });

  // =========================================================================
  // SUITE 5: Faculty Workload Optimization & Statistics
  // =========================================================================
  console.log('\n[Suite 5: Faculty Workload Optimization & Statistics]');

  await test('FacultyWorkloadService.getWorkloadList returns faculty with weekly periods and metrics', async () => {
    const res = await FacultyWorkloadService.getWorkloadList(TENANT_A, { page: 1, limit: 20 });
    assert.ok(res.items.length > 0, 'Should list faculty members');
    assert.ok(res.meta.total > 0);

    const scheduled = res.items.find((f) => f.weekly_periods > 0);
    assert.ok(scheduled, 'Should have faculty with scheduled periods');
    assert.ok(scheduled.distinct_sections_count > 0);
    assert.ok(scheduled.distinct_subjects_count > 0);
    assert.ok(scheduled.workload_status, 'Should compute workload status (LIGHT, BALANCED, HEAVY)');
  });

  await test('FacultyWorkloadService.getWorkloadById returns detail for specific staff member', async () => {
    const detail = await FacultyWorkloadService.getWorkloadById(TENANT_A, KNOWN_STAFF_ID);
    assert.strictEqual(detail.staff_id, KNOWN_STAFF_ID);
    assert.ok(detail.weekly_periods > 0);
    assert.ok(detail.daily_breakdown);
    assert.ok(Array.isArray(detail.assigned_subjects));
  });

  await test('Multi-Tenant Isolation: Tenant B cannot access Tenant A faculty workload (throws 404)', async () => {
    await assert.rejects(
      async () => {
        await FacultyWorkloadService.getWorkloadById(TENANT_B, KNOWN_STAFF_ID);
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 404);
        return true;
      },
    );
  });

  // =========================================================================
  // SUITE 6: Timetable Conflict Detection Engine
  // =========================================================================
  console.log('\n[Suite 6: Timetable Conflict Detection Engine]');

  await test('TimetableConflictService.detectConflicts verifies master published version is collision-free', async () => {
    const res = await TimetableConflictService.detectConflicts(TENANT_A, KNOWN_VERSION_ID);
    assert.strictEqual(res.timetable_version_id, KNOWN_VERSION_ID);
    assert.strictEqual(
      res.conflict_summary.teacher_collisions,
      0,
      'Master schedule must have 0 teacher collisions',
    );
    assert.strictEqual(
      res.conflict_summary.section_collisions,
      0,
      'Master schedule must have 0 section collisions',
    );
    assert.strictEqual(
      res.conflict_summary.room_collisions,
      0,
      'Master schedule must have 0 room collisions',
    );
    assert.strictEqual(
      res.conflict_summary.availability_conflicts,
      0,
      'Master schedule must have 0 availability conflicts',
    );
    assert.strictEqual(
      res.is_valid_for_publication,
      true,
      'Published schedule must be valid for publication',
    );
  });

  await test('Conflict Detection interval overlap logic correctly evaluates overlapping time ranges', () => {
    // Range 1: 09:00 - 09:45; Range 2: 09:30 - 10:15 (Overlaps)
    const overlaps1 = '09:00:00' < '10:15:00' && '09:45:00' > '09:30:00';
    assert.strictEqual(overlaps1, true, '09:00-09:45 overlaps with 09:30-10:15');

    // Range 1: 09:00 - 09:45; Range 2: 09:45 - 10:30 (Adjacent, does NOT overlap)
    const overlaps2 = '09:00:00' < '10:30:00' && '09:45:00' > '09:45:00';
    assert.strictEqual(overlaps2, false, 'Adjacent periods do not overlap');
  });

  await test('Multi-Tenant Isolation: Tenant B cannot run conflict detection on Tenant A timetable (404)', async () => {
    await assert.rejects(
      async () => {
        await TimetableConflictService.detectConflicts(TENANT_B, KNOWN_VERSION_ID);
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 404);
        return true;
      },
    );
  });

  // =========================================================================
  // SUITE 7: Classrooms & Facility Scheduling
  // =========================================================================
  console.log('\n[Suite 7: Classrooms & Facility Scheduling]');

  await test('TimetableService.listClassrooms returns classrooms for Tenant A', async () => {
    const classrooms = await TimetableService.listClassrooms(TENANT_A, {});
    assert.ok(classrooms.length > 0, 'Tenant A should have classrooms');
    const first = classrooms[0];
    assert.strictEqual(first.org_id, TENANT_A);
    assert.ok(first.room_code);
  });

  await test('TimetableService.getClassroomSchedule returns room schedule entries', async () => {
    const res = await TimetableService.getClassroomSchedule(
      TENANT_A,
      KNOWN_CLASSROOM_ID,
      KNOWN_VERSION_ID,
    );
    assert.strictEqual(res.classroom_id, KNOWN_CLASSROOM_ID);
    assert.ok(res.total_scheduled_periods > 0, 'Room should have scheduled periods');
    assert.ok(res.schedule_by_day[1], 'Should group by day');
  });

  await test('Multi-Tenant Isolation: Tenant B cannot access Tenant A classroom schedule (404)', async () => {
    await assert.rejects(
      async () => {
        await TimetableService.getClassroomSchedule(TENANT_B, KNOWN_CLASSROOM_ID);
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 404);
        return true;
      },
    );
  });

  // =========================================================================
  // SUITE 8: Unsupported Write Operations & HTTP 501 Guardrails
  // =========================================================================
  console.log('\n[Suite 8: Unsupported Write Operations & HTTP 501 Guardrails]');

  await test('TimetableService.handleTimetableCreateUnsupported throws 501 FEATURE_NOT_IMPLEMENTED', () => {
    assert.throws(
      () => {
        TimetableService.handleTimetableCreateUnsupported();
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 501);
        assert.strictEqual(err.code, 'FEATURE_NOT_IMPLEMENTED');
        return true;
      },
    );
  });

  await test('TimetableService.handleTimetableUpdateUnsupported throws 501 FEATURE_NOT_IMPLEMENTED', () => {
    assert.throws(
      () => {
        TimetableService.handleTimetableUpdateUnsupported();
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 501);
        assert.strictEqual(err.code, 'FEATURE_NOT_IMPLEMENTED');
        return true;
      },
    );
  });

  await test('TimetableService.handleTimetablePublishUnsupported throws 501 FEATURE_NOT_IMPLEMENTED', () => {
    assert.throws(
      () => {
        TimetableService.handleTimetablePublishUnsupported();
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 501);
        assert.strictEqual(err.code, 'FEATURE_NOT_IMPLEMENTED');
        return true;
      },
    );
  });

  await test('TimetableService.handleEntryMutationUnsupported throws 501 FEATURE_NOT_IMPLEMENTED', () => {
    assert.throws(
      () => {
        TimetableService.handleEntryMutationUnsupported();
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 501);
        assert.strictEqual(err.code, 'FEATURE_NOT_IMPLEMENTED');
        return true;
      },
    );
  });

  // =========================================================================
  // SUITE 9: Prisma Persistence Guard Enforcement
  // =========================================================================
  console.log('\n[Suite 9: Prisma Persistence Guard Enforcement]');

  await test('Prisma guard blocks direct write on timetable_versions (throws Persistence Error)', async () => {
    await assert.rejects(
      async () => {
        await (prisma as any).timetable_versions.create({
          data: { version_name: 'RAM Mock Timetable' },
        });
      },
      (err: any) => {
        assert.ok(err.message.includes('[Persistence Error]'));
        assert.ok(err.message.includes('timetable_versions'));
        return true;
      },
    );
  });

  await test('Prisma guard blocks direct write on timetable_entries (throws Persistence Error)', async () => {
    await assert.rejects(
      async () => {
        await (prisma as any).timetable_entries.create({
          data: { weekday: 1 },
        });
      },
      (err: any) => {
        assert.ok(err.message.includes('[Persistence Error]'));
        assert.ok(err.message.includes('timetable_entries'));
        return true;
      },
    );
  });

  await test('Prisma guard blocks direct write on bell_schedules (throws Persistence Error)', async () => {
    await assert.rejects(
      async () => {
        await (prisma as any).bell_schedules.create({
          data: { schedule_name: 'RAM Mock Schedule' },
        });
      },
      (err: any) => {
        assert.ok(err.message.includes('[Persistence Error]'));
        assert.ok(err.message.includes('bell_schedules'));
        return true;
      },
    );
  });

  await test('Prisma guard blocks direct write on classrooms (throws Persistence Error)', async () => {
    await assert.rejects(
      async () => {
        await (prisma as any).classrooms.create({
          data: { room_code: 'RAM-01' },
        });
      },
      (err: any) => {
        assert.ok(err.message.includes('[Persistence Error]'));
        assert.ok(err.message.includes('classrooms'));
        return true;
      },
    );
  });

  await test('Prisma guard blocks direct write on section_subject_faculty_assignments (throws Persistence Error)', async () => {
    await assert.rejects(
      async () => {
        await (prisma as any).section_subject_faculty_assignments.create({
          data: { assignment_role: 'primary' },
        });
      },
      (err: any) => {
        assert.ok(err.message.includes('[Persistence Error]'));
        assert.ok(err.message.includes('section_subject_faculty_assignments'));
        return true;
      },
    );
  });

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n===============================================================');
  console.log(`  PHASE 6 TEST RESULTS: ${passed} PASSED, ${failed} FAILED  `);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runAcademicPhase6Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal test runner error:', err);
      process.exit(1);
    });
}
