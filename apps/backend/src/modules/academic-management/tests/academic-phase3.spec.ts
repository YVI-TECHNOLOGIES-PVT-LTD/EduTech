/**
 * EduTrack ERP — Phase 3: Board, Educational Framework & Subject Mapping Test Suite
 * Comprehensive corrective verification for Phase 3:
 * - Validates physical VARCHAR(50) boundaries for organizations.board_affiliation and grades.board
 * - Validates null and empty string transformations
 * - Validates elimination of fabricated 'CBSE' fallback in response mappings
 * - Validates multi-tenant isolation
 * - Validates explicit 501 rejection for unsupported Stage-2 entities
 */

import assert from 'assert';
import prisma from '../../../lib/prismaClient';
import { BoardService, SUPPORTED_BOARD_STANDARDS } from '../services/board.service';
import { GradeService } from '../services/grade.service';
import { BoardController } from '../controllers/board.controller';
import { updateBoardAffiliationSchema } from '../dto/request/update-board-affiliation.dto';
import { createGradeSchema } from '../dto/request/create-grade.dto';
import { AcademicError } from '../errors/academic.errors';

export async function runAcademicPhase3Tests() {
  console.log('===============================================================');
  console.log('  EDUTRACK ERP — PHASE 3: CORRECTIVE AUDIT TEST SUITE         ');
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

  console.log(`[Test Environment Context]`);
  console.log(`  Tenant A: ${TENANT_A} (${dbOrgs[0].org_name})`);
  console.log(`  Tenant B: ${TENANT_B} (${dbOrgs[1].org_name})\n`);

  // --------------------------------------------------------------------------
  // SUITE 1: BOARD AFFILIATION DTO & VARCHAR(50) VALIDATION
  // --------------------------------------------------------------------------
  console.log('[Suite 1: Board Affiliation & VARCHAR(50) Validation]');

  await test('updateBoardAffiliationSchema accepts valid string within 50 chars', () => {
    const parsed = updateBoardAffiliationSchema.safeParse({ board_affiliation: 'CBSE' });
    assert.ok(parsed.success);
    if (parsed.success) {
      assert.strictEqual(parsed.data.board_affiliation, 'CBSE');
    }
  });

  await test('updateBoardAffiliationSchema accepts null and retains null', () => {
    const parsed = updateBoardAffiliationSchema.safeParse({ board_affiliation: null });
    assert.ok(parsed.success);
    if (parsed.success) {
      assert.strictEqual(parsed.data.board_affiliation, null);
    }
  });

  await test('updateBoardAffiliationSchema transforms empty string to null', () => {
    const parsed = updateBoardAffiliationSchema.safeParse({ board_affiliation: '   ' });
    assert.ok(parsed.success);
    if (parsed.success) {
      assert.strictEqual(parsed.data.board_affiliation, null);
    }
  });

  await test('updateBoardAffiliationSchema rejects input exceeding 50 characters', () => {
    const tooLong = 'A'.repeat(51);
    const parsed = updateBoardAffiliationSchema.safeParse({ board_affiliation: tooLong });
    assert.strictEqual(parsed.success, false);
  });

  await test('createGradeSchema rejects board exceeding 50 characters', () => {
    const tooLong = 'B'.repeat(51);
    const parsed = createGradeSchema.safeParse({
      grade_code: 'G_TEST_LEN',
      grade_name: 'Grade Test Length',
      board: tooLong,
    });
    assert.strictEqual(parsed.success, false);
  });

  await test('createGradeSchema transforms empty board string to null', () => {
    const parsed = createGradeSchema.safeParse({
      grade_code: 'G_TEST_EMPTY',
      grade_name: 'Grade Test Empty',
      board: '   ',
    });
    assert.ok(parsed.success);
    if (parsed.success) {
      assert.strictEqual(parsed.data.board, null);
    }
  });

  // --------------------------------------------------------------------------
  // SUITE 2: BOARD PERSISTENCE & TENANT ISOLATION
  // --------------------------------------------------------------------------
  console.log('\n[Suite 2: Board Persistence & Multi-Tenant Isolation]');

  const originalAffiliationA = dbOrgs[0].board_affiliation;
  const originalAffiliationB = dbOrgs[1].board_affiliation;
  const testAffiliation = 'CBSE-AFFILIATED-P3';

  await test('BoardService.getBoardOverview returns institutional affiliation from physical organizations table', async () => {
    const overview = await BoardService.getBoardOverview(TENANT_A);
    assert.ok(overview);
    assert.strictEqual(overview.organization_id, TENANT_A);
    assert.strictEqual(overview.persistence_model, 'physical_postgresql_stage1');
  });

  await test('BoardService.updateBoardAffiliation persists string directly to physical PostgreSQL', async () => {
    const updated = await BoardService.updateBoardAffiliation(TENANT_A, testAffiliation, null);
    assert.strictEqual(updated.board_affiliation, testAffiliation);

    const rawCheck: any[] = await prisma.$queryRawUnsafe(
      `SELECT board_affiliation FROM organizations WHERE org_id = $1::uuid`,
      TENANT_A,
    );
    assert.strictEqual(rawCheck[0].board_affiliation, testAffiliation);
  });

  await test('BoardService.updateBoardAffiliation supports clearing affiliation to null', async () => {
    const updated = await BoardService.updateBoardAffiliation(TENANT_A, null, null);
    assert.strictEqual(updated.board_affiliation, null);

    const rawCheck: any[] = await prisma.$queryRawUnsafe(
      `SELECT board_affiliation FROM organizations WHERE org_id = $1::uuid`,
      TENANT_A,
    );
    assert.strictEqual(rawCheck[0].board_affiliation, null);
  });

  await test('Multi-Tenant Isolation: Tenant B cannot see or overwrite Tenant A board affiliation', async () => {
    // Re-set Tenant A to testAffiliation
    await BoardService.updateBoardAffiliation(TENANT_A, testAffiliation, null);

    // Tenant B overview must not leak Tenant A's affiliation
    const overviewB = await BoardService.getBoardOverview(TENANT_B);
    assert.notStrictEqual(overviewB.institutional_affiliation, testAffiliation);

    // Update Tenant B affiliation
    await BoardService.updateBoardAffiliation(TENANT_B, 'ICSE-AFFILIATED-P3', null);

    // Verify Tenant A is unchanged
    const rawCheckA: any[] = await prisma.$queryRawUnsafe(
      `SELECT board_affiliation FROM organizations WHERE org_id = $1::uuid`,
      TENANT_A,
    );
    assert.strictEqual(rawCheckA[0].board_affiliation, testAffiliation);
  });

  // Restore Tenant A & B original affiliations
  await prisma.$queryRawUnsafe(
    `UPDATE organizations SET board_affiliation = $1 WHERE org_id = $2::uuid`,
    originalAffiliationA,
    TENANT_A,
  );
  await prisma.$queryRawUnsafe(
    `UPDATE organizations SET board_affiliation = $1 WHERE org_id = $2::uuid`,
    originalAffiliationB,
    TENANT_B,
  );

  // --------------------------------------------------------------------------
  // SUITE 3: GRADE-LEVEL BOARD MAPPING & NO FABRICATED CBSE DEFAULT
  // --------------------------------------------------------------------------
  console.log('\n[Suite 3: Grade-Level Board Mapping & Elimination of Fabricated Defaults]');

  const uniqueCodeWithBoard = `GB-${Date.now().toString().slice(-4)}`;
  const uniqueCodeNullBoard = `GN-${Date.now().toString().slice(-4)}`;
  let gradeWithBoard: any = null;
  let gradeNullBoard: any = null;

  await test('GradeService.createGrade persists explicit board string in PostgreSQL', async () => {
    gradeWithBoard = await GradeService.createGrade(
      TENANT_A,
      {
        org_id: TENANT_A,
        grade_code: uniqueCodeWithBoard,
        grade_name: `Grade ${uniqueCodeWithBoard}`,
        board: 'CAMBRIDGE',
        display_order: 91,
      },
      null,
    );
    assert.strictEqual(gradeWithBoard.board, 'CAMBRIDGE');

    const rawCheck: any[] = await prisma.$queryRawUnsafe(
      `SELECT board FROM grades WHERE grade_id = $1::uuid`,
      gradeWithBoard.grade_id,
    );
    assert.strictEqual(rawCheck[0].board, 'CAMBRIDGE');
  });

  await test('GradeService.createGrade persists null board without fabricated CBSE fallback', async () => {
    gradeNullBoard = await GradeService.createGrade(
      TENANT_A,
      {
        org_id: TENANT_A,
        grade_code: uniqueCodeNullBoard,
        grade_name: `Grade ${uniqueCodeNullBoard}`,
        board: null,
        display_order: 92,
      },
      null,
    );
    assert.strictEqual(gradeNullBoard.board, null);

    const rawCheck: any[] = await prisma.$queryRawUnsafe(
      `SELECT board FROM grades WHERE grade_id = $1::uuid`,
      gradeNullBoard.grade_id,
    );
    assert.strictEqual(rawCheck[0].board, null);
  });

  await test('GradeService.getAllGrades filters grades by board parameter', async () => {
    const result = await GradeService.getAllGrades(TENANT_A, {
      board: 'CAMBRIDGE',
    });
    assert.ok(result.items.length >= 1);
    const found = result.items.find((g: any) => g.grade_id === gradeWithBoard.grade_id);
    assert.ok(found);
    assert.strictEqual(found.board, 'CAMBRIDGE');
  });

  await test('BoardService.getGradesForBoard returns grades matching board code', async () => {
    const result = await BoardService.getGradesForBoard(TENANT_A, 'CAMBRIDGE');
    assert.ok(result.total_grades >= 1);
    const found = result.grades.find((g: any) => g.grade_id === gradeWithBoard.grade_id);
    assert.ok(found);
  });

  await test('BoardService.getGradesForBoard rejects board codes exceeding 50 characters (400)', async () => {
    await assert.rejects(
      async () => {
        await BoardService.getGradesForBoard(TENANT_A, 'X'.repeat(51));
      },
      (err: any) => err instanceof AcademicError && err.statusCode === 400,
    );
  });

  await test('Cross-Tenant Isolation: Tenant B cannot access Tenant A grades via board filter', async () => {
    const resultB = await BoardService.getGradesForBoard(TENANT_B, 'CAMBRIDGE');
    const leaked = resultB.grades.find((g: any) => g.grade_id === gradeWithBoard.grade_id);
    assert.strictEqual(leaked, undefined);
  });

  // Clean up test grades
  await prisma.$queryRawUnsafe(
    `DELETE FROM grades WHERE grade_id IN ($1::uuid, $2::uuid)`,
    gradeWithBoard.grade_id,
    gradeNullBoard.grade_id,
  );

  // --------------------------------------------------------------------------
  // SUITE 4: EXPLICIT 501 FOR UNSUPPORTED STAGE-2 ENTITIES
  // --------------------------------------------------------------------------
  console.log('\n[Suite 4: Unsupported Feature Classification & 501 Enforcement]');

  await test('BoardController.handleFrameworksUnsupported returns 501 with UNSUPPORTED_BY_FINALIZED_DATABASE', async () => {
    let capturedStatus = 0;
    let capturedBody: any = null;

    const mockRes: any = {
      status(code: number) {
        capturedStatus = code;
        return this;
      },
      json(body: any) {
        capturedBody = body;
        return this;
      },
    };

    await BoardController.handleFrameworksUnsupported({} as any, mockRes);
    assert.strictEqual(capturedStatus, 501);
    assert.strictEqual(capturedBody.error, 'UNSUPPORTED_BY_FINALIZED_DATABASE');
    assert.strictEqual(capturedBody.status, 'UNSUPPORTED BY FINALIZED DATABASE');
  });

  await test('BoardController.handleSubjectsUnsupported returns 501 with UNSUPPORTED_BY_FINALIZED_DATABASE', async () => {
    let capturedStatus = 0;
    let capturedBody: any = null;

    const mockRes: any = {
      status(code: number) {
        capturedStatus = code;
        return this;
      },
      json(body: any) {
        capturedBody = body;
        return this;
      },
    };

    await BoardController.handleSubjectsUnsupported({} as any, mockRes);
    assert.strictEqual(capturedStatus, 501);
    assert.strictEqual(capturedBody.error, 'UNSUPPORTED_BY_FINALIZED_DATABASE');
    assert.strictEqual(capturedBody.status, 'UNSUPPORTED BY FINALIZED DATABASE');
  });

  console.log('\n===============================================================');
  console.log(`  CORRECTIVE AUDIT TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runAcademicPhase3Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal test error:', err);
      process.exit(1);
    });
}
