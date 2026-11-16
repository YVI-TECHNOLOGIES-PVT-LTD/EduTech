import assert from 'assert';
import prisma from '../../../lib/prismaClient';
import {
  getReadinessFindingsSchema,
  academicYearIdParamSchema,
  ValidationSeverityEnum,
  ValidationCategoryEnum,
} from '../dto/request/readiness.dto';
import { ReadinessRepository } from '../repositories/readiness.repository';
import { AcademicReadinessService } from '../services/readiness.service';
import { AcademicReadinessController } from '../controllers/readiness.controller';
import { AcademicError } from '../errors/academic.errors';

const TENANT_A_ID = '624efc1b-4144-43a4-90b8-552d945cbef7'; // Greenwood School, Delhi (Fully Configured)
const TENANT_B_ID = '5205f1f3-4e31-42d9-9b53-77fc84ad40df'; // National Public School, Ahmedabad (Partially Configured)
const TENANT_A_ACTIVE_YEAR = 'b2259d01-c883-4934-89f1-04bd90acc5f5'; // Academic Year 2026-2027

async function runPhase8Tests() {
  console.log('\n===============================================================');
  console.log('  EDUTRACK ERP — PHASE 8: ACADEMIC SETUP VALIDATION & PUBLISHING');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  // ── SUITE 1: Request DTOs & Validation Schemas ────────────────────────────
  console.log('[Suite 1: Request DTOs & Validation Schemas]');

  await test('academicYearIdParamSchema validates standard UUID', () => {
    const valid = academicYearIdParamSchema.safeParse({ academicYearId: TENANT_A_ACTIVE_YEAR });
    assert.strictEqual(valid.success, true);

    const invalid = academicYearIdParamSchema.safeParse({ academicYearId: 'not-a-uuid' });
    assert.strictEqual(invalid.success, false);
  });

  await test('getReadinessFindingsSchema applies default pagination and coercions', () => {
    const res = getReadinessFindingsSchema.safeParse({});
    assert.strictEqual(res.success, true);
    if (res.success) {
      assert.strictEqual(res.data.page, 1);
      assert.strictEqual(res.data.limit, 20);
    }
  });

  await test('getReadinessFindingsSchema parses boolean blocking_only filter', () => {
    const res = getReadinessFindingsSchema.safeParse({ blocking_only: 'true', limit: '50' });
    assert.strictEqual(res.success, true);
    if (res.success) {
      assert.strictEqual(res.data.blocking_only, true);
      assert.strictEqual(res.data.limit, 50);
    }
  });

  await test('ValidationCategoryEnum contains all 12 operational domains', () => {
    const categories = ValidationCategoryEnum.options;
    assert.strictEqual(categories.length, 12);
    assert.ok(categories.includes('ACADEMIC_YEAR'));
    assert.ok(categories.includes('GRADES_AND_SECTIONS'));
    assert.ok(categories.includes('BOARD_AND_FRAMEWORK'));
    assert.ok(categories.includes('SUBJECT_MAPPING'));
    assert.ok(categories.includes('CURRICULUM'));
    assert.ok(categories.includes('SYLLABUS'));
    assert.ok(categories.includes('ACADEMIC_CALENDAR'));
    assert.ok(categories.includes('FACULTY'));
    assert.ok(categories.includes('TIMETABLE'));
    assert.ok(categories.includes('CLASSROOMS'));
    assert.ok(categories.includes('DIGITAL_RESOURCES'));
    assert.ok(categories.includes('LESSON_PLANNING'));
  });

  await test('ValidationSeverityEnum enforces standard severity classifications', () => {
    const severities = ValidationSeverityEnum.options;
    assert.deepStrictEqual(severities, ['ERROR', 'WARNING', 'INFO', 'UNSUPPORTED']);
  });

  // ── SUITE 2: Live Database Grounding & Configuration Retrieval ────────────
  console.log('\n[Suite 2: Database Grounding & Cross-Module Configuration Retrieval]');

  await test('ReadinessRepository.getAcademicConfiguration retrieves complete multi-module tree for Tenant A', async () => {
    const data = await ReadinessRepository.getAcademicConfiguration(
      TENANT_A_ID,
      TENANT_A_ACTIVE_YEAR,
    );
    assert.ok(data);
    assert.strictEqual(data?.yearConfig.academic_year_id, TENANT_A_ACTIVE_YEAR);
    assert.strictEqual(data?.yearConfig.org_name, 'Greenwood School, Delhi');
    assert.strictEqual(data?.gradeOfferings.length, 12);
    assert.strictEqual(data?.sections.length >= 36, true);
    assert.strictEqual(data?.subjectMappings.length >= 91, true);
    assert.strictEqual(data?.calendarConfig.terms_count >= 2, true);
    assert.strictEqual(data?.timetableConfig.published_entries_count, 1440);
    assert.strictEqual(data?.facultyConfig.total_assignments >= 270, true);
    assert.strictEqual(data?.classroomConfig.total_classrooms >= 50, true);
    assert.strictEqual(data?.resourceConfig.total_published_resources >= 40, true);
    assert.strictEqual(data?.lessonPlanConfig.total_lesson_plans >= 90, true);
  });

  await test('ReadinessRepository.getTenantReadinessOverview retrieves multi-year summary', async () => {
    const overview = await ReadinessRepository.getTenantReadinessOverview(TENANT_A_ID);
    assert.ok(Array.isArray(overview));
    assert.strictEqual(overview.length >= 1, true);
    assert.ok(overview[0].academic_year_name);
    assert.strictEqual(overview[0].has_published_timetable >= 1, true);
  });

  // ── SUITE 3: Comprehensive Academic Readiness Validation ──────────────────
  console.log('\n[Suite 3: Comprehensive Academic Readiness Validation (All 12 Domains)]');

  await test('AcademicReadinessService.validateAcademicYear evaluates Tenant A and returns detailed report', async () => {
    const report = await AcademicReadinessService.validateAcademicYear(
      TENANT_A_ID,
      TENANT_A_ACTIVE_YEAR,
    );

    assert.strictEqual(report.organization_id, TENANT_A_ID);
    assert.strictEqual(report.academic_year_id, TENANT_A_ACTIVE_YEAR);
    assert.strictEqual(report.categories.length, 12);
    assert.ok(report.overall_score >= 80, `Expected score >= 80, got ${report.overall_score}`);
    assert.strictEqual(report.summary.total_checks >= 20, true);
    assert.strictEqual(report.summary.passed >= 15, true);
    assert.strictEqual(report.blocking_errors.length, 0);
  });

  await test('Domain 1: ACADEMIC_YEAR validation passes with valid date range and offerings', async () => {
    const report = await AcademicReadinessService.validateAcademicYear(
      TENANT_A_ID,
      TENANT_A_ACTIVE_YEAR,
    );
    const ayCat = report.categories.find((c) => c.category === 'ACADEMIC_YEAR');
    assert.ok(ayCat);
    assert.strictEqual(ayCat?.status, 'PASSED');
    assert.ok(ayCat?.findings.some((f) => f.rule_code === 'AY_DATE_ORDER_VALID'));
    assert.ok(ayCat?.findings.some((f) => f.rule_code === 'AY_GRADE_OFFERINGS_CONFIGURED'));
  });

  await test('Domain 2: GRADES_AND_SECTIONS validation verifies sections and teacher assignments', async () => {
    const report = await AcademicReadinessService.validateAcademicYear(
      TENANT_A_ID,
      TENANT_A_ACTIVE_YEAR,
    );
    const gsCat = report.categories.find((c) => c.category === 'GRADES_AND_SECTIONS');
    assert.ok(gsCat);
    assert.ok(gsCat?.findings.some((f) => f.rule_code === 'GRADE_SECTIONS_COMPLETE'));
  });

  await test('Domain 3: BOARD_AND_FRAMEWORK explicitly reports unsupported framework mapping', async () => {
    const report = await AcademicReadinessService.validateAcademicYear(
      TENANT_A_ID,
      TENANT_A_ACTIVE_YEAR,
    );
    const bfCat = report.categories.find((c) => c.category === 'BOARD_AND_FRAMEWORK');
    assert.ok(bfCat);
    const frameworkFinding = bfCat?.findings.find(
      (f) => f.rule_code === 'FRAMEWORK_MAPPINGS_UNSUPPORTED',
    );
    assert.ok(frameworkFinding);
    assert.strictEqual(frameworkFinding?.severity, 'UNSUPPORTED');
    assert.strictEqual(frameworkFinding?.validation_status, 'UNSUPPORTED');
  });

  await test('Domain 4: SUBJECT_MAPPING validates subject catalog and grade subject offerings', async () => {
    const report = await AcademicReadinessService.validateAcademicYear(
      TENANT_A_ID,
      TENANT_A_ACTIVE_YEAR,
    );
    const smCat = report.categories.find((c) => c.category === 'SUBJECT_MAPPING');
    assert.ok(smCat);
    assert.strictEqual(smCat?.status, 'PASSED');
    assert.ok(smCat?.findings.some((f) => f.rule_code === 'GRADE_SUBJECT_MAPPINGS_COMPLETE'));
  });

  await test('Domain 5 & 6: CURRICULUM and SYLLABUS validate units and outcomes coverage', async () => {
    const report = await AcademicReadinessService.validateAcademicYear(
      TENANT_A_ID,
      TENANT_A_ACTIVE_YEAR,
    );
    const curCat = report.categories.find((c) => c.category === 'CURRICULUM');
    const sylCat = report.categories.find((c) => c.category === 'SYLLABUS');
    assert.ok(curCat);
    assert.ok(sylCat);
    assert.ok(curCat?.findings.some((f) => f.rule_code === 'CURRICULUM_PLANS_SUFFICIENT'));
    assert.ok(sylCat?.findings.some((f) => f.rule_code === 'SYLLABUS_OUTCOMES_CONFIGURED'));
  });

  await test('Domain 7: ACADEMIC_CALENDAR validates terms and teaching working days', async () => {
    const report = await AcademicReadinessService.validateAcademicYear(
      TENANT_A_ID,
      TENANT_A_ACTIVE_YEAR,
    );
    const calCat = report.categories.find((c) => c.category === 'ACADEMIC_CALENDAR');
    assert.ok(calCat);
    assert.ok(calCat?.findings.some((f) => f.rule_code === 'CALENDAR_TERMS_CONFIGURED'));
    assert.ok(calCat?.findings.some((f) => f.rule_code === 'CALENDAR_WORKING_DAYS_CONFIGURED'));
  });

  await test('Domain 8: FACULTY validates assignments and staff availability', async () => {
    const report = await AcademicReadinessService.validateAcademicYear(
      TENANT_A_ID,
      TENANT_A_ACTIVE_YEAR,
    );
    const facCat = report.categories.find((c) => c.category === 'FACULTY');
    assert.ok(facCat);
    assert.ok(facCat?.findings.some((f) => f.rule_code === 'ACTIVE_FACULTY_AVAILABLE'));
  });

  await test('Domain 9: TIMETABLE integrates Phase 6 conflict detection and verifies published version', async () => {
    const report = await AcademicReadinessService.validateAcademicYear(
      TENANT_A_ID,
      TENANT_A_ACTIVE_YEAR,
    );
    const ttCat = report.categories.find((c) => c.category === 'TIMETABLE');
    assert.ok(ttCat);
    assert.ok(ttCat?.findings.some((f) => f.rule_code === 'TIMETABLE_PUBLISHED'));
    assert.ok(ttCat?.findings.some((f) => f.rule_code === 'TIMETABLE_COLLISION_FREE'));
  });

  await test('Domain 10, 11 & 12: CLASSROOMS, DIGITAL_RESOURCES, and LESSON_PLANNING validate assets', async () => {
    const report = await AcademicReadinessService.validateAcademicYear(
      TENANT_A_ID,
      TENANT_A_ACTIVE_YEAR,
    );
    const crCat = report.categories.find((c) => c.category === 'CLASSROOMS');
    const resCat = report.categories.find((c) => c.category === 'DIGITAL_RESOURCES');
    const lpCat = report.categories.find((c) => c.category === 'LESSON_PLANNING');
    assert.ok(crCat);
    assert.ok(resCat);
    assert.ok(lpCat);
    assert.ok(crCat?.findings.some((f) => f.rule_code === 'CLASSROOMS_CONFIGURED'));
    assert.ok(resCat?.findings.some((f) => f.rule_code === 'DIGITAL_RESOURCES_AVAILABLE'));
    assert.ok(lpCat?.findings.some((f) => f.rule_code === 'LESSON_PLANS_AVAILABLE'));
  });

  // ── SUITE 4: Actionable Findings & Pagination ──────────────────────────────
  console.log('\n[Suite 4: Actionable Findings & Pagination Filters]');

  await test('AcademicReadinessService.getFindings returns paginated findings list', async () => {
    const result = await AcademicReadinessService.getFindings(TENANT_A_ID, TENANT_A_ACTIVE_YEAR, {
      page: 1,
      limit: 10,
    });
    assert.strictEqual(result.items.length <= 10, true);
    assert.strictEqual(result.total >= 10, true);
    assert.strictEqual(result.page, 1);
    assert.strictEqual(result.limit, 10);
  });

  await test('AcademicReadinessService.getFindings filters by category', async () => {
    const result = await AcademicReadinessService.getFindings(TENANT_A_ID, TENANT_A_ACTIVE_YEAR, {
      category: 'TIMETABLE',
      page: 1,
      limit: 50,
    });
    assert.ok(result.items.every((f) => f.category === 'TIMETABLE'));
  });

  await test('AcademicReadinessService.getFindings filters by severity', async () => {
    const result = await AcademicReadinessService.getFindings(TENANT_A_ID, TENANT_A_ACTIVE_YEAR, {
      severity: 'INFO',
      page: 1,
      limit: 50,
    });
    assert.ok(result.items.every((f) => f.severity === 'INFO'));
  });

  // ── SUITE 5: Dependency Graph Generation ──────────────────────────────────
  console.log('\n[Suite 5: Academic Dependency Graph]');

  await test('AcademicReadinessService.getDependencyGraph builds verified nodes and edges', async () => {
    const graph = await AcademicReadinessService.getDependencyGraph(
      TENANT_A_ID,
      TENANT_A_ACTIVE_YEAR,
    );
    assert.strictEqual(graph.academic_year_id, TENANT_A_ACTIVE_YEAR);
    assert.strictEqual(graph.summary.total_nodes >= 50, true);
    assert.strictEqual(graph.summary.total_edges >= 50, true);

    // Verify root nodes
    assert.ok(graph.nodes.some((n) => n.type === 'ORGANIZATION'));
    assert.ok(graph.nodes.some((n) => n.type === 'ACADEMIC_YEAR'));
    assert.ok(graph.nodes.some((n) => n.type === 'CALENDAR'));
    assert.ok(graph.nodes.some((n) => n.type === 'TIMETABLE'));

    // Verify relationships
    assert.ok(graph.edges.some((e) => e.relationship === 'MANAGES'));
    assert.ok(graph.edges.some((e) => e.relationship === 'OFFERS'));
    assert.ok(graph.edges.some((e) => e.relationship === 'DIVIDES_INTO'));
  });

  // ── SUITE 6: Multi-Tenant Isolation & Security ────────────────────────────
  console.log('\n[Suite 6: Multi-Tenant Isolation & Security]');

  await test('Tenant B evaluation on partial setup correctly identifies missing blocks', async () => {
    // Find Tenant B academic year
    const tenantBYears = await prisma.$queryRawUnsafe<any[]>(
      `SELECT academic_year_id FROM academic_years WHERE org_id = $1::uuid LIMIT 1`,
      TENANT_B_ID,
    );
    if (tenantBYears.length > 0) {
      const yearB = tenantBYears[0].academic_year_id;
      const reportB = await AcademicReadinessService.validateAcademicYear(TENANT_B_ID, yearB);

      assert.strictEqual(reportB.organization_id, TENANT_B_ID);
      // In Tenant B, subjects, timetable, curriculum are unconfigured -> Must be BLOCKED
      assert.strictEqual(reportB.readiness_status, 'BLOCKED');
      assert.strictEqual(reportB.publishing_eligibility, 'BLOCKED');
      assert.ok(reportB.blocking_errors.length > 0);
    }
  });

  await test('Multi-Tenant Isolation: Tenant B cannot evaluate Tenant A academic year (Throws 404)', async () => {
    try {
      await AcademicReadinessService.validateAcademicYear(TENANT_B_ID, TENANT_A_ACTIVE_YEAR);
      assert.fail('Should have thrown 404 for cross-tenant academic year access');
    } catch (err: any) {
      assert.strictEqual(err.statusCode, 404);
      assert.strictEqual(err.code, 'NOT_FOUND');
    }
  });

  await test('Multi-Tenant Isolation: Tenant B cannot access Tenant A dependency graph (Throws 404)', async () => {
    try {
      await AcademicReadinessService.getDependencyGraph(TENANT_B_ID, TENANT_A_ACTIVE_YEAR);
      assert.fail('Should have thrown 404 for cross-tenant dependency graph access');
    } catch (err: any) {
      assert.strictEqual(err.statusCode, 404);
      assert.strictEqual(err.code, 'NOT_FOUND');
    }
  });

  // ── SUITE 7: Publishing Governance & HTTP 501 Guardrails ──────────────────
  console.log('\n[Suite 7: Publishing Governance & HTTP 501 Guardrails]');

  await test('AcademicReadinessService.handlePublishUnsupported throws HTTP 501 FEATURE_NOT_IMPLEMENTED', () => {
    try {
      AcademicReadinessService.handlePublishUnsupported();
      assert.fail('Should have thrown 501');
    } catch (err: any) {
      assert.strictEqual(err.statusCode, 501);
      assert.strictEqual(err.code, 'FEATURE_NOT_IMPLEMENTED');
      assert.strictEqual(err.details?.limitation_code, 'GLOBAL_ACADEMIC_PUBLISH_UNSUPPORTED');
    }
  });

  await test('AcademicReadinessController.publishUnsupported returns 501 with descriptive error payload', () => {
    let responseStatus: number | null = null;
    let responseJson: any = null;

    const mockRes: any = {
      status(s: number) {
        responseStatus = s;
        return this;
      },
      json(data: any) {
        responseJson = data;
        return this;
      },
    };

    AcademicReadinessController.publishUnsupported({} as any, mockRes);
    assert.strictEqual(responseStatus, 501);
    assert.strictEqual(responseJson.success, false);
    assert.strictEqual(responseJson.error.code, 'FEATURE_NOT_IMPLEMENTED');
  });

  // ── FINAL SUMMARY ─────────────────────────────────────────────────────────
  console.log('\n===============================================================');
  console.log(`  PHASE 8 TEST RESULTS: ${passed} PASSED, ${failed} FAILED  `);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase8Tests()
  .catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
