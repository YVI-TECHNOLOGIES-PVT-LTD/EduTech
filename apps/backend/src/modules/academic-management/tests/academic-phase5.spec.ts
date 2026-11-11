/**
 * EduTrack ERP — Phase 5: Curriculum, Syllabus & Academic Calendar Management Test Suite
 * Comprehensive verification for Phase 5:
 * - Validates Curriculum, Subject, Syllabus, Calendar, and Term DTOs
 * - Validates Curriculum status transitions and PostgreSQL trigger rules (s26_validate_curriculum_plan)
 * - Validates Subject catalog, categories, and grade offering mappings
 * - Validates 501 rejection for unsupported subject master writes
 * - Validates full hierarchical Syllabus tree with Bloom taxonomy learning outcomes
 * - Validates read-only derived syllabus coverage and 501 rejection for write-based logging
 * - Validates Academic Calendar overview, working days, and date-range filtered entries
 * - Validates Academic Terms listing and detail retrieval
 * - Validates strict multi-tenant isolation across Tenant A and Tenant B
 * - Validates Prisma Client persistence guards preventing in-memory RAM fallback
 */

import assert from 'assert';
import prisma from '../../../lib/prismaClient';
import { CurriculumService } from '../services/curriculum.service';
import { SubjectService } from '../services/subject.service';
import { SyllabusService } from '../services/syllabus.service';
import { AcademicCalendarService } from '../services/academic-calendar.service';
import { AcademicTermService } from '../services/academic-term.service';
import {
  listCurriculumSchema,
  updateCurriculumStatusSchema,
  updateCurriculumPlanSchema,
} from '../dto/request/curriculum.dto';
import { listSubjectsSchema } from '../dto/request/subject.dto';
import { listCalendarEntriesSchema } from '../dto/request/calendar.dto';
import { listTermsSchema } from '../dto/request/term.dto';
import { AcademicError } from '../errors/academic.errors';

export async function runAcademicPhase5Tests() {
  console.log('===============================================================');
  console.log('  EDUTRACK ERP — PHASE 5: CURRICULUM, SYLLABUS & CALENDAR     ');
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

  // 1. Resolve real active tenants from PostgreSQL
  const TENANT_A = '624efc1b-4144-43a4-90b8-552d945cbef7'; // Greenwood School, Delhi
  const TENANT_B = '5205f1f3-4e31-42d9-9b53-77fc84ad40df'; // National Public School, Ahmedabad

  const orgA = await prisma.organizations.findUnique({ where: { org_id: TENANT_A } });
  const orgB = await prisma.organizations.findUnique({ where: { org_id: TENANT_B } });

  if (!orgA || !orgB) {
    throw new Error('Test requires both test organizations active in database');
  }

  // --------------------------------------------------------------------------
  // SUITE 1: DTO VALIDATION & EDGE CASES
  // --------------------------------------------------------------------------
  console.log('[Suite 1: DTO Validation & Edge Cases]');

  await test('listCurriculumSchema coerces strings to numbers and applies defaults', () => {
    const parsed = listCurriculumSchema.safeParse({ page: '2', limit: '10' });
    assert.ok(parsed.success);
    if (parsed.success) {
      assert.strictEqual(parsed.data.page, 2);
      assert.strictEqual(parsed.data.limit, 10);
      assert.strictEqual(parsed.data.sortBy, 'created_at');
      assert.strictEqual(parsed.data.sortOrder, 'desc');
    }
  });

  await test('listCurriculumSchema validates status enum and rejects invalid status', () => {
    const valid = listCurriculumSchema.safeParse({ status: 'published' });
    assert.ok(valid.success);

    const invalid = listCurriculumSchema.safeParse({ status: 'non_existent_status' });
    assert.strictEqual(invalid.success, false);
  });

  await test('updateCurriculumStatusSchema enforces required status enum', () => {
    const valid = updateCurriculumStatusSchema.safeParse({ status: 'review' });
    assert.ok(valid.success);

    const empty = updateCurriculumStatusSchema.safeParse({});
    assert.strictEqual(empty.success, false);
  });

  await test('updateCurriculumPlanSchema rejects planned_end_date before planned_start_date', () => {
    const invalidDates = updateCurriculumPlanSchema.safeParse({
      planned_start_date: '2026-10-01',
      planned_end_date: '2026-09-01',
    });
    assert.strictEqual(invalidDates.success, false);

    const validDates = updateCurriculumPlanSchema.safeParse({
      planned_start_date: '2026-04-01',
      planned_end_date: '2026-10-31',
    });
    assert.ok(validDates.success);
  });

  await test('updateCurriculumPlanSchema rejects blank title', () => {
    const invalid = updateCurriculumPlanSchema.safeParse({ plan_title: '   ' });
    assert.strictEqual(invalid.success, false);
  });

  await test('listSubjectsSchema transforms string booleans for is_active', () => {
    const trueParsed = listSubjectsSchema.safeParse({ is_active: 'true' });
    assert.ok(trueParsed.success);
    if (trueParsed.success) {
      assert.strictEqual(trueParsed.data.is_active, true);
    }

    const falseParsed = listSubjectsSchema.safeParse({ is_active: 'false' });
    assert.ok(falseParsed.success);
    if (falseParsed.success) {
      assert.strictEqual(falseParsed.data.is_active, false);
    }
  });

  await test('listCalendarEntriesSchema rejects end_date before start_date', () => {
    const invalid = listCalendarEntriesSchema.safeParse({
      start_date: '2026-12-25',
      end_date: '2026-12-20',
    });
    assert.strictEqual(invalid.success, false);

    const valid = listCalendarEntriesSchema.safeParse({
      start_date: '2026-12-20',
      end_date: '2026-12-25',
    });
    assert.ok(valid.success);
  });

  await test('listCalendarEntriesSchema validates entry_type enum', () => {
    const valid = listCalendarEntriesSchema.safeParse({ entry_type: 'holiday' });
    assert.ok(valid.success);

    const invalid = listCalendarEntriesSchema.safeParse({ entry_type: 'carnival' });
    assert.strictEqual(invalid.success, false);
  });

  await test('listTermsSchema accepts optional calendar_id and academic_year_id', () => {
    const valid = listTermsSchema.safeParse({
      calendar_id: '5d986b3e-5e2b-5898-a093-8abef92f5391',
    });
    assert.ok(valid.success);

    const invalid = listTermsSchema.safeParse({
      calendar_id: 'not-a-uuid',
    });
    assert.strictEqual(invalid.success, false);
  });

  // --------------------------------------------------------------------------
  // SUITE 2: CURRICULUM MANAGEMENT & DATABASE TRIGGER ENFORCEMENT
  // --------------------------------------------------------------------------
  console.log('\n[Suite 2: Curriculum Management & Database Trigger Enforcement]');

  let samplePlanA: any = null;

  await test('CurriculumService.listCurriculum returns paginated plans for Tenant A', async () => {
    const result = await CurriculumService.listCurriculum(TENANT_A, { page: 1, limit: 10 });
    assert.ok(result.items.length > 0);
    assert.ok(result.meta.total >= 1);
    samplePlanA = result.items[0];
    assert.strictEqual(samplePlanA.org_id, TENANT_A);
    assert.ok(samplePlanA.unit_count >= 1);
  });

  await test('CurriculumService.listCurriculum filters by status', async () => {
    const result = await CurriculumService.listCurriculum(TENANT_A, { status: 'published' });
    assert.ok(result.items.length > 0);
    for (const item of result.items) {
      assert.strictEqual(item.status, 'published');
    }
  });

  await test('CurriculumService.listCurriculum searches plan title and subject name', async () => {
    const result = await CurriculumService.listCurriculum(TENANT_A, { search: 'Mathematics' });
    assert.ok(result.items.length >= 1);
    assert.ok(result.items.some((p) => p.subject_name.includes('Math')));
  });

  await test('CurriculumService.getCurriculumStructure retrieves full plan with units and outcomes', async () => {
    const structure = await CurriculumService.getCurriculumStructure(
      TENANT_A,
      samplePlanA.curriculum_plan_id,
    );
    assert.strictEqual(structure.curriculum_plan_id, samplePlanA.curriculum_plan_id);
    assert.ok(Array.isArray(structure.units));
    assert.ok(structure.units.length > 0);

    const firstUnit = structure.units[0];
    assert.ok(firstUnit.unit_title);
    assert.strictEqual(typeof firstUnit.sequence_number, 'number');
    assert.ok(Array.isArray(firstUnit.outcomes));
    assert.ok(firstUnit.outcomes.length > 0);

    const firstOutcome = firstUnit.outcomes[0];
    assert.ok(firstOutcome.outcome_statement);
    assert.ok(firstOutcome.bloom_level);
  });

  await test('PostgreSQL trigger s26_validate_curriculum_plan blocks invalid status reversal (published -> draft)', async () => {
    await assert.rejects(
      async () => {
        await CurriculumService.updateStatus(
          TENANT_A,
          samplePlanA.curriculum_plan_id,
          { status: 'draft' },
          null,
        );
      },
      (err: any) =>
        err instanceof AcademicError &&
        err.message.includes('Published curriculum plans may only transition to archived'),
    );
  });

  await test('PostgreSQL trigger s26_validate_curriculum_plan blocks mutating published plan content', async () => {
    await assert.rejects(
      async () => {
        await CurriculumService.updatePlan(
          TENANT_A,
          samplePlanA.curriculum_plan_id,
          { plan_title: 'Mutated Published Title' },
          null,
        );
      },
      (err: any) =>
        err instanceof AcademicError &&
        err.message.includes('Curriculum plan content is immutable outside draft status'),
    );
  });

  await test('Multi-Tenant Isolation: Tenant B cannot access Tenant A curriculum plan (404)', async () => {
    await assert.rejects(
      async () => {
        await CurriculumService.getCurriculumById(TENANT_B, samplePlanA.curriculum_plan_id);
      },
      (err: any) => err instanceof AcademicError && err.statusCode === 404,
    );
  });

  await test('Multi-Tenant Isolation: Tenant B cannot update Tenant A curriculum status (404)', async () => {
    await assert.rejects(
      async () => {
        await CurriculumService.updateStatus(
          TENANT_B,
          samplePlanA.curriculum_plan_id,
          { status: 'archived' },
          null,
        );
      },
      (err: any) => err instanceof AcademicError && err.statusCode === 404,
    );
  });

  // --------------------------------------------------------------------------
  // SUITE 3: SUBJECT MASTER CATALOG & GRADE OFFERINGS
  // --------------------------------------------------------------------------
  console.log('\n[Suite 3: Subject Master Catalog & Grade Offerings]');

  let sampleSubjectA: any = null;

  await test('SubjectService.listSubjects returns paginated subjects for Tenant A', async () => {
    const result = await SubjectService.listSubjects(TENANT_A, { page: 1, limit: 10 });
    assert.ok(result.items.length > 0);
    assert.ok(result.meta.total >= 1);
    sampleSubjectA = result.items[0];
    assert.strictEqual(sampleSubjectA.org_id, TENANT_A);
    assert.ok(sampleSubjectA.subject_name);
  });

  await test('SubjectService.listSubjects filters by search string', async () => {
    const result = await SubjectService.listSubjects(TENANT_A, { search: 'ENG' });
    assert.ok(result.items.length >= 1);
    assert.ok(result.items.some((s) => s.subject_code.includes('ENG')));
  });

  await test('SubjectService.listCategories returns ordered subject categories for Tenant A', async () => {
    const categories = await SubjectService.listCategories(TENANT_A);
    assert.ok(categories.length > 0);
    assert.ok(categories.some((c) => c.category_code === 'LANG'));
    assert.ok(categories.some((c) => c.category_code === 'STEM'));

    // Check display_order is ascending
    for (let i = 0; i < categories.length - 1; i++) {
      assert.ok(categories[i].display_order <= categories[i + 1].display_order);
    }
  });

  await test('SubjectService.getSubjectById retrieves subject details', async () => {
    const subject = await SubjectService.getSubjectById(TENANT_A, sampleSubjectA.subject_id);
    assert.strictEqual(subject.subject_id, sampleSubjectA.subject_id);
    assert.strictEqual(subject.subject_code, sampleSubjectA.subject_code);
  });

  await test('SubjectService.getGradeSubjects returns offerings for valid academic_year_grade_id', async () => {
    // Find an academic_year_grade in Tenant A that has offerings
    const aygList: any[] = await prisma.$queryRawUnsafe(
      `SELECT aygs.academic_year_grade_id
       FROM academic_year_grade_subjects aygs
       JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = aygs.academic_year_grade_id
       JOIN academic_years ay ON ay.academic_year_id = ayg.academic_year_id
       WHERE ay.org_id = $1::uuid
       LIMIT 1`,
      TENANT_A,
    );
    assert.ok(aygList.length > 0);

    const offerings = await SubjectService.getGradeSubjects(
      TENANT_A,
      aygList[0].academic_year_grade_id,
    );
    assert.ok(offerings.length >= 1);
    assert.ok(offerings[0].subject_name);
    assert.ok(['mandatory', 'optional', 'elective'].includes(offerings[0].subject_requirement));
  });

  await test('SubjectService.handleSubjectCreateUnsupported throws 501 for subject write', () => {
    assert.throws(
      () => {
        SubjectService.handleSubjectCreateUnsupported();
      },
      (err: any) =>
        err instanceof AcademicError &&
        err.statusCode === 501 &&
        err.code === 'FEATURE_NOT_IMPLEMENTED',
    );
  });

  await test('Multi-Tenant Isolation: Tenant B cannot access Tenant A subject by ID (404)', async () => {
    await assert.rejects(
      async () => {
        await SubjectService.getSubjectById(TENANT_B, sampleSubjectA.subject_id);
      },
      (err: any) => err instanceof AcademicError && err.statusCode === 404,
    );
  });

  // --------------------------------------------------------------------------
  // SUITE 4: SYLLABUS MANAGEMENT & DERIVED COVERAGE
  // --------------------------------------------------------------------------
  console.log('\n[Suite 4: Syllabus Management & Derived Coverage]');

  await test('SyllabusService.listSyllabus returns syllabus records matching curriculum plans', async () => {
    const result = await SyllabusService.listSyllabus(TENANT_A, { page: 1, limit: 10 });
    assert.ok(result.items.length > 0);
    assert.ok(result.items[0].plan_title);
  });

  await test('SyllabusService.getSyllabusDetails returns syllabus tree with Bloom levels', async () => {
    const syllabus = await SyllabusService.getSyllabusDetails(
      TENANT_A,
      samplePlanA.curriculum_plan_id,
    );
    assert.strictEqual(syllabus.curriculum_plan_id, samplePlanA.curriculum_plan_id);
    assert.ok(syllabus.units.length > 0);

    const outcomes = syllabus.units[0].outcomes || [];
    assert.ok(outcomes.length > 0);
    const validBloomLevels = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
    for (const outcome of outcomes) {
      if (outcome.bloom_level) {
        assert.ok(validBloomLevels.includes(outcome.bloom_level));
      }
    }
  });

  await test('SyllabusService.getSyllabusCoverage computes read-only progression metrics', async () => {
    const coverage = await SyllabusService.getSyllabusCoverage(
      TENANT_A,
      samplePlanA.curriculum_plan_id,
    );
    assert.strictEqual(coverage.syllabus_id, samplePlanA.curriculum_plan_id);
    assert.strictEqual(typeof coverage.total_units, 'number');
    assert.strictEqual(typeof coverage.total_planned_periods, 'number');
    assert.strictEqual(
      typeof coverage.schedule_progression.estimated_schedule_coverage_percent,
      'number',
    );
    assert.strictEqual(coverage.write_tracking_status, 'UNSUPPORTED_BY_STAGE_1_PERSISTENCE');
  });

  await test('SyllabusService.handleCoverageLogUnsupported throws 501 for write-based coverage logging', () => {
    assert.throws(
      () => {
        SyllabusService.handleCoverageLogUnsupported();
      },
      (err: any) =>
        err instanceof AcademicError &&
        err.statusCode === 501 &&
        err.code === 'FEATURE_NOT_IMPLEMENTED',
    );
  });

  await test('Multi-Tenant Isolation: Tenant B cannot access Tenant A syllabus (404)', async () => {
    await assert.rejects(
      async () => {
        await SyllabusService.getSyllabusDetails(TENANT_B, samplePlanA.curriculum_plan_id);
      },
      (err: any) => err instanceof AcademicError && err.statusCode === 404,
    );
  });

  // --------------------------------------------------------------------------
  // SUITE 5: ACADEMIC CALENDAR & WORKING DAYS
  // --------------------------------------------------------------------------
  console.log('\n[Suite 5: Academic Calendar & Working Days]');

  let sampleCalendarA: any = null;

  await test('AcademicCalendarService.getCalendar retrieves calendar overview for Tenant A', async () => {
    sampleCalendarA = await AcademicCalendarService.getCalendar(TENANT_A);
    assert.ok(sampleCalendarA.academic_calendar_id);
    assert.ok(sampleCalendarA.academic_year_name);
    assert.strictEqual(typeof sampleCalendarA.version, 'number');
    assert.ok(Array.isArray(sampleCalendarA.working_days));
    assert.ok(sampleCalendarA.working_days.length > 0); // e.g. Mon-Fri
    assert.ok(sampleCalendarA.terms_count >= 1);
    assert.ok(sampleCalendarA.entries_count >= 1);
  });

  await test('AcademicCalendarService.listEntries returns paginated entries with type and date filters', async () => {
    const result = await AcademicCalendarService.listEntries(TENANT_A, {
      calendar_id: sampleCalendarA.academic_calendar_id,
      page: 1,
      limit: 10,
    });
    assert.ok(result.items.length > 0);
    assert.ok(result.meta.total >= 1);

    const firstEntry = result.items[0];
    assert.ok(firstEntry.entry_name);
    assert.ok(
      ['holiday', 'vacation', 'exam', 'school_event', 'school_closure'].includes(
        firstEntry.entry_type,
      ),
    );
  });

  await test('AcademicCalendarService.listEntries filters by holiday entry_type', async () => {
    const result = await AcademicCalendarService.listEntries(TENANT_A, {
      entry_type: 'holiday',
    });
    assert.ok(result.items.length > 0);
    for (const item of result.items) {
      assert.strictEqual(item.entry_type, 'holiday');
    }
  });

  await test('AcademicCalendarService.getEntryById returns entry details with mapped grades', async () => {
    const listResult = await AcademicCalendarService.listEntries(TENANT_A, { page: 1, limit: 1 });
    const targetEntry = listResult.items[0];

    const detail = await AcademicCalendarService.getEntryById(
      TENANT_A,
      targetEntry.academic_calendar_entry_id,
    );
    assert.strictEqual(detail.academic_calendar_entry_id, targetEntry.academic_calendar_entry_id);
    assert.ok(Array.isArray(detail.target_grades));
  });

  await test('Multi-Tenant Isolation: Tenant B cannot access Tenant A calendar overview (404)', async () => {
    await assert.rejects(
      async () => {
        await AcademicCalendarService.getCalendar(TENANT_B);
      },
      (err: any) => err instanceof AcademicError && err.statusCode === 404,
    );
  });

  await test('Multi-Tenant Isolation: Tenant B cannot access Tenant A calendar entry (404)', async () => {
    const listResult = await AcademicCalendarService.listEntries(TENANT_A, { page: 1, limit: 1 });
    const targetEntry = listResult.items[0];

    await assert.rejects(
      async () => {
        await AcademicCalendarService.getEntryById(
          TENANT_B,
          targetEntry.academic_calendar_entry_id,
        );
      },
      (err: any) => err instanceof AcademicError && err.statusCode === 404,
    );
  });

  // --------------------------------------------------------------------------
  // SUITE 6: TERM & SEMESTER MANAGEMENT
  // --------------------------------------------------------------------------
  console.log('\n[Suite 6: Term & Semester Management]');

  let sampleTermA: any = null;

  await test('AcademicTermService.listTerms returns terms ordered by term_number', async () => {
    const terms = await AcademicTermService.listTerms(TENANT_A, {});
    assert.ok(terms.length > 0);
    sampleTermA = terms[0];
    assert.strictEqual(sampleTermA.term_number, 1);
    assert.ok(sampleTermA.term_name);
    assert.ok(sampleTermA.start_date);
    assert.ok(sampleTermA.end_date);

    if (terms.length > 1) {
      assert.strictEqual(terms[1].term_number, 2);
    }
  });

  await test('AcademicTermService.getTermById retrieves term details scoped to tenant', async () => {
    const term = await AcademicTermService.getTermById(TENANT_A, sampleTermA.academic_term_id);
    assert.strictEqual(term.academic_term_id, sampleTermA.academic_term_id);
    assert.strictEqual(term.term_name, sampleTermA.term_name);
  });

  await test('Multi-Tenant Isolation: Tenant B cannot access Tenant A academic term (404)', async () => {
    await assert.rejects(
      async () => {
        await AcademicTermService.getTermById(TENANT_B, sampleTermA.academic_term_id);
      },
      (err: any) => err instanceof AcademicError && err.statusCode === 404,
    );
  });

  // --------------------------------------------------------------------------
  // SUITE 7: PHASE 4 RESOURCE INTEGRATION & ACADEMIC OVERVIEW
  // --------------------------------------------------------------------------
  console.log('\n[Suite 7: Phase 4 Resource Integration & Academic Overview]');

  await test('SubjectService.getSubjectResources returns resources mapped to a subject', async () => {
    // Subject Primary English has mapped resources in learning_resource_subjects
    const resources = await SubjectService.getSubjectResources(TENANT_A, sampleSubjectA.subject_id);
    assert.ok(Array.isArray(resources));
    assert.ok(resources.length >= 1);
    assert.ok(resources[0].title);
    assert.ok(resources[0].file_url || resources[0].resource_type);
  });

  await test('CurriculumService.getCurriculumOverview aggregates all academic metrics without fake data', async () => {
    const overview = await CurriculumService.getCurriculumOverview(TENANT_A);
    assert.ok(overview);
    assert.ok(overview.active_academic_year);
    assert.ok(overview.grades.total >= 1);
    assert.ok(overview.subjects.total >= 1);
    assert.ok(overview.curriculum.total_plans >= 1);
    assert.ok(overview.curriculum.total_units >= 1);
    assert.ok(overview.calendar.has_calendar);
    assert.ok(overview.terms.total >= 1);
  });

  // --------------------------------------------------------------------------
  // SUITE 8: PRISMA PERSISTENCE GUARD ENFORCEMENT
  // --------------------------------------------------------------------------
  console.log('\n[Suite 8: Prisma Persistence Guard Enforcement]');

  await test('Prisma guard blocks direct write on curriculum_plans (throws Persistence Error)', async () => {
    await assert.rejects(
      async () => {
        await (prisma as any).curriculum_plans.create({ data: { plan_title: 'Fake' } });
      },
      (err: any) =>
        err.message.includes('[Persistence Error]') && err.message.includes('curriculum_plans'),
    );
  });

  await test('Prisma guard blocks direct write on subjects (throws Persistence Error)', async () => {
    await assert.rejects(
      async () => {
        await (prisma as any).subjects.create({ data: { subject_name: 'Fake' } });
      },
      (err: any) => err.message.includes('[Persistence Error]') && err.message.includes('subjects'),
    );
  });

  await test('Prisma guard blocks direct write on academic_calendars (throws Persistence Error)', async () => {
    await assert.rejects(
      async () => {
        await (prisma as any).academic_calendars.create({ data: { status: 'draft' } });
      },
      (err: any) =>
        err.message.includes('[Persistence Error]') && err.message.includes('academic_calendars'),
    );
  });

  await test('Prisma guard blocks direct write on academic_terms (throws Persistence Error)', async () => {
    await assert.rejects(
      async () => {
        await (prisma as any).academic_terms.create({ data: { term_name: 'Fake' } });
      },
      (err: any) =>
        err.message.includes('[Persistence Error]') && err.message.includes('academic_terms'),
    );
  });

  console.log('\n===============================================================');
  console.log(`  PHASE 5 TEST RESULTS: ${passed} PASSED, ${failed} FAILED  `);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runAcademicPhase5Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal test execution error:', err);
      process.exit(1);
    });
}
