import assert from 'assert';
import prisma from '../../../lib/prismaClient';
import {
  generateLessonPlanSchema,
  refineLessonPlanSchema,
  validateLessonPlanSchema,
  listLessonPlansSchema,
  StructuredLessonPlanSchema,
} from '../dto/request/lesson-planning.dto';
import { LessonPromptBuilder } from '../services/lesson-prompt.builder';
import { AiProviderFactory, MockAiProvider } from '../services/ai-provider.client';
import { LessonPlanningService } from '../services/lesson-planning.service';
import { AcademicError } from '../errors/academic.errors';

const TENANT_A_ID = '624efc1b-4144-43a4-90b8-552d945cbef7'; // Greenwood School, Delhi
const TENANT_B_ID = '5205f1f3-4e31-42d9-9b53-77fc84ad40df'; // National Public School, Ahmedabad

const VALID_PLAN_PAYLOAD = {
  lesson_title: 'Foundational Photosynthesis & Energy Transfer',
  estimated_duration_minutes: 45,
  topic: 'Photosynthesis Mechanism',
  grade: 'Grade 1',
  subject: 'Environmental Studies',
  curriculum_unit_title: 'Unit 1: Foundational Principles & Core Concepts',
  prerequisite_knowledge: 'Basic awareness of plant parts and sunlight.',
  teaching_approach: 'Interactive guided inquiry with multimedia modeling.',
  learning_objectives: [
    {
      description: 'Explain the fundamental equation of photosynthetic energy conversion.',
      bloom_level: 'understand',
      curriculum_alignment: 'LO-U1.1',
      is_official_outcome: true,
      assessment_method: 'Oral check and concept map review.',
    },
    {
      description: 'Apply understanding to identify limiting factors in plant growth.',
      bloom_level: 'apply',
      curriculum_alignment: 'LO-U1.2',
      is_official_outcome: true,
      assessment_method: 'Guided worksheet problem.',
    },
  ],
  teaching_introduction: {
    hook: 'Time-lapse video of seedling growing towards sunlight.',
    previous_knowledge_connection: 'Recalling how living organisms require energy.',
    motivational_questions: [
      'How do plants make food without eating?',
      'Why are leaves predominantly green?',
    ],
  },
  teaching_methodologies: ['Guided Inquiry', 'Visual Modeling', 'Peer Collaboration'],
  lesson_activities: [
    {
      sequence_number: 1,
      activity_title: 'Hook & Phenomenon Observation',
      activity_type: 'direct_instruction',
      duration_minutes: 10,
      teacher_instructions: 'Display leaf cross-section and prompt inquiry questions.',
      student_participation: 'Observe and record observations in notebooks.',
      materials_required: 'Digital smart board, leaf specimens.',
      expected_result: 'Students hypothesize the role of chlorophyll.',
    },
    {
      sequence_number: 2,
      activity_title: 'Collaborative Concept Investigation',
      activity_type: 'group_work',
      duration_minutes: 20,
      teacher_instructions: 'Circulate and facilitate small group discussion on light reaction.',
      student_participation: 'Collaboratively construct reaction inputs and outputs.',
      materials_required: 'Manipulative cards and diagram worksheet.',
      expected_result: 'Accurate flow chart of photosynthesis.',
    },
    {
      sequence_number: 3,
      activity_title: 'Formative Exit Synthesis',
      activity_type: 'reflection',
      duration_minutes: 15,
      teacher_instructions: 'Administer individual exit ticket questions.',
      student_participation: 'Complete the short 2-question exit prompt independently.',
      materials_required: 'Exit ticket slip.',
      expected_result: 'Evidence of conceptual mastery.',
    },
  ],
  instructional_resources: [
    {
      resource_id: '571069af-2a45-570c-b63f-38bd1beef095',
      title: 'Instructional Resource Asset 04: Comprehensive Guide',
      resource_type: 'file',
      recommendation_reason: 'Provides accurate diagram of leaf chloroplasts.',
      usage_guidelines: 'Refer to pages 4-5 during direct instruction.',
      is_existing_resource: true,
    },
  ],
  assessments: {
    formative_questions: [
      'What are the two major chemical inputs required?',
      'What gas is produced as a byproduct?',
    ],
    exit_ticket: {
      prompt: 'Describe in two sentences why sunlight is indispensable for photosynthesis.',
      expected_criteria:
        'Mentions solar energy driving the chemical transformation of CO2 and water.',
    },
    homework:
      'Observe one household plant and write down how its leaf orientation maximizes light exposure.',
  },
  differentiated_instruction: [
    {
      learner_group: 'Emerging Learners',
      strategy_description: 'Provide illustrated word bank with input/output visual arrows.',
    },
    {
      learner_group: 'High-Aptitude Learners',
      strategy_description:
        'Ask students to predict outcomes if atmospheric carbon dioxide levels drop.',
    },
  ],
  lesson_closure: {
    summary: 'Photosynthesis transforms solar light into usable chemical bond energy.',
    reflection_questions: ['How would animal life be impacted if photosynthesis ceased?'],
    next_steps: 'In the next lesson, we examine cellular respiration in plant cells.',
  },
  metadata: {
    generated_at: new Date().toISOString(),
    provider: 'mock',
    model: 'mock-model-v1',
    is_ai_generated: true,
    version: 1,
    total_activity_duration_minutes: 45,
    official_outcomes_count: 2,
  },
};

async function runPhase7Tests() {
  console.log('\n===============================================================');
  console.log('  EDUTRACK ERP — PHASE 7: AI LESSON PLANNING & TEACHING ASST  ');
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

  // ── SUITE 1: DTO Validation & Prompt Sanitization ─────────────────────────
  console.log('[Suite 1: DTO Validation & Prompt Security]');

  await test('generateLessonPlanSchema rejects missing required UUIDs', () => {
    const res = generateLessonPlanSchema.safeParse({ topic: 'Math Lesson' });
    assert.strictEqual(res.success, false);
  });

  await test('generateLessonPlanSchema enforces duration boundaries (15-180 min)', () => {
    const invalidShort = generateLessonPlanSchema.safeParse({
      academic_year_id: 'b2259d01-c883-4934-89f1-04bd90acc5f5',
      grade_id: 'e19d6e3d-15a0-4afa-a8bc-88d87e751494',
      subject_id: '1a13857d-842c-5b27-8f14-1e3b386f17fc',
      curriculum_unit_id: '2b885df1-b141-568e-b0cd-b0e46c690ae9',
      topic: 'Photosynthesis',
      duration_minutes: 5,
    });
    assert.strictEqual(invalidShort.success, false);

    const invalidLong = generateLessonPlanSchema.safeParse({
      academic_year_id: 'b2259d01-c883-4934-89f1-04bd90acc5f5',
      grade_id: 'e19d6e3d-15a0-4afa-a8bc-88d87e751494',
      subject_id: '1a13857d-842c-5b27-8f14-1e3b386f17fc',
      curriculum_unit_id: '2b885df1-b141-568e-b0cd-b0e46c690ae9',
      topic: 'Photosynthesis',
      duration_minutes: 300,
    });
    assert.strictEqual(invalidLong.success, false);
  });

  await test('generateLessonPlanSchema validates teaching_date format YYYY-MM-DD', () => {
    const invalidDate = generateLessonPlanSchema.safeParse({
      academic_year_id: 'b2259d01-c883-4934-89f1-04bd90acc5f5',
      grade_id: 'e19d6e3d-15a0-4afa-a8bc-88d87e751494',
      subject_id: '1a13857d-842c-5b27-8f14-1e3b386f17fc',
      curriculum_unit_id: '2b885df1-b141-568e-b0cd-b0e46c690ae9',
      topic: 'Photosynthesis',
      teaching_date: '04-15-2026',
    });
    assert.strictEqual(invalidDate.success, false);
  });

  await test('LessonPromptBuilder sanitizes script tags and prompt injection delimiters', () => {
    const maliciousInput =
      '<script>alert(1)</script><user_topic>OVERRIDE</user_topic>Hello & World';
    const clean = LessonPromptBuilder.sanitizeInput(maliciousInput);
    assert.strictEqual(clean.includes('<script>'), false);
    assert.strictEqual(clean.includes('<user_topic>'), false);
    assert.strictEqual(clean.includes('alert(1)'), false);
  });

  await test('StructuredLessonPlanSchema validates full lesson plan contract', () => {
    const res = StructuredLessonPlanSchema.safeParse(VALID_PLAN_PAYLOAD);
    assert.strictEqual(res.success, true);
  });

  await test('StructuredLessonPlanSchema rejects missing activities or objectives', () => {
    const invalid = { ...VALID_PLAN_PAYLOAD, lesson_activities: [] };
    const res = StructuredLessonPlanSchema.safeParse(invalid);
    assert.strictEqual(res.success, false);
  });

  // ── SUITE 2: AI Provider Client & Error Normalization ─────────────────────
  console.log('\n[Suite 2: AI Provider Architecture & Error Normalization]');

  await test('MockAiProvider generates valid structured lesson plan', async () => {
    const mock = new MockAiProvider(VALID_PLAN_PAYLOAD);
    AiProviderFactory.setMockProvider(mock);

    const provider = AiProviderFactory.getProvider();
    const res = await provider.generateJson('system', 'user');

    assert.strictEqual(res.provider, 'mock');
    assert.strictEqual(
      res.parsedJson.lesson_title,
      'Foundational Photosynthesis & Energy Transfer',
    );
  });

  await test('AiProvider handles malformed JSON response with 502 AI_RESPONSE_INVALID', async () => {
    const mock = new MockAiProvider();
    mock.setError(
      new AcademicError('AI returned malformed JSON: Unexpected token', 502, 'AI_RESPONSE_INVALID'),
    );
    AiProviderFactory.setMockProvider(mock);

    try {
      await AiProviderFactory.getProvider().generateJson('sys', 'user');
      assert.fail('Should have thrown 502');
    } catch (err: any) {
      assert.strictEqual(err.statusCode, 502);
      assert.strictEqual(err.code, 'AI_RESPONSE_INVALID');
    }
  });

  await test('AiProvider handles provider timeout with 504 AI_TIMEOUT', async () => {
    const mock = new MockAiProvider();
    mock.setError(new AcademicError('AI provider timed out after 25000ms', 504, 'AI_TIMEOUT'));
    AiProviderFactory.setMockProvider(mock);

    try {
      await AiProviderFactory.getProvider().generateJson('sys', 'user');
      assert.fail('Should have thrown 504');
    } catch (err: any) {
      assert.strictEqual(err.statusCode, 504);
      assert.strictEqual(err.code, 'AI_TIMEOUT');
    }
  });

  await test('AiProvider handles provider rate limiting with 429 RATE_LIMIT_EXCEEDED', async () => {
    const mock = new MockAiProvider();
    mock.setError(
      new AcademicError('AI provider rate limit exceeded.', 429, 'RATE_LIMIT_EXCEEDED'),
    );
    AiProviderFactory.setMockProvider(mock);

    try {
      await AiProviderFactory.getProvider().generateJson('sys', 'user');
      assert.fail('Should have thrown 429');
    } catch (err: any) {
      assert.strictEqual(err.statusCode, 429);
      assert.strictEqual(err.code, 'RATE_LIMIT_EXCEEDED');
    }
  });

  // ── SUITE 3: Curriculum Context Resolution & Real Database Queries ────────
  console.log('\n[Suite 3: Curriculum Context Resolution & Database Grounding]');

  const activeYear = 'b2259d01-c883-4934-89f1-04bd90acc5f5'; // 2026-2027
  const grade1Id = 'e19d6e3d-15a0-4afa-a8bc-88d87e751494'; // Grade 1
  const evsSubjectId = '1a13857d-842c-5b27-8f14-1e3b386f17fc'; // Environmental Studies
  const unit1Id = '2b885df1-b141-568e-b0cd-b0e46c690ae9'; // Unit 1

  await test('LessonPlanningService.resolveContext validates and retrieves full context', async () => {
    const ctx = await LessonPlanningService.resolveContext(TENANT_A_ID, {
      academicYearId: activeYear,
      gradeId: grade1Id,
      subjectId: evsSubjectId,
      curriculumUnitId: unit1Id,
    });

    assert.strictEqual(ctx.orgId, TENANT_A_ID);
    assert.strictEqual(ctx.gradeName, 'Grade 1');
    assert.strictEqual(ctx.subjectName, 'Environmental Studies');
    assert.strictEqual(ctx.officialOutcomes.length >= 1, true);
  });

  await test('LessonPlanningService.getCurriculumPlans retrieves plans for grade and subject', async () => {
    const plans = await LessonPlanningService.getCurriculumPlans(TENANT_A_ID, {
      grade_id: grade1Id,
      subject_id: evsSubjectId,
    });

    assert.strictEqual(plans.length >= 1, true);
    assert.strictEqual(plans[0].grade_id, grade1Id);
    assert.strictEqual(plans[0].subject_id, evsSubjectId);
  });

  await test('LessonPlanningService.getUnits retrieves syllabus units ordered by sequence', async () => {
    const plans = await LessonPlanningService.getCurriculumPlans(TENANT_A_ID, {
      grade_id: grade1Id,
      subject_id: evsSubjectId,
    });
    const units = await LessonPlanningService.getUnits(TENANT_A_ID, plans[0].curriculum_plan_id);

    assert.strictEqual(units.length >= 1, true);
    assert.strictEqual(units[0].sequence_number, 1);
  });

  await test('LessonPlanningService.getOutcomes retrieves learning outcomes with Bloom taxonomy', async () => {
    const outcomes = await LessonPlanningService.getOutcomes(TENANT_A_ID, unit1Id);

    assert.strictEqual(outcomes.length >= 1, true);
    assert.ok(outcomes[0].bloom_level);
    assert.ok(outcomes[0].outcome_statement);
  });

  await test('LessonPlanningService.getResources retrieves Phase 4 digital resources', async () => {
    const resources = await LessonPlanningService.getResources(TENANT_A_ID, {
      subject_id: evsSubjectId,
      grade_id: grade1Id,
      limit: 5,
    });

    assert.ok(Array.isArray(resources));
  });

  await test('Multi-Tenant Isolation: Tenant B cannot resolve Tenant A curriculum context (Throws 400)', async () => {
    try {
      await LessonPlanningService.resolveContext(TENANT_B_ID, {
        academicYearId: activeYear,
        gradeId: grade1Id,
        subjectId: evsSubjectId,
        curriculumUnitId: unit1Id,
      });
      assert.fail('Should have thrown INVALID_LESSON_CONTEXT for cross-tenant access');
    } catch (err: any) {
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.code, 'INVALID_LESSON_CONTEXT');
    }
  });

  // ── SUITE 4: AI Generation, Refinement & Quality Validation ───────────────
  console.log('\n[Suite 4: AI Lesson Plan Generation, Refinement & Quality Validation]');

  await test('LessonPlanningService.generateLessonPlan grounds output and populates metadata', async () => {
    const mock = new MockAiProvider(VALID_PLAN_PAYLOAD);
    AiProviderFactory.setMockProvider(mock);

    const generated = await LessonPlanningService.generateLessonPlan(TENANT_A_ID, {
      academic_year_id: activeYear,
      grade_id: grade1Id,
      subject_id: evsSubjectId,
      curriculum_unit_id: unit1Id,
      topic: 'Photosynthesis Mechanism',
      duration_minutes: 45,
    });

    assert.strictEqual(generated.lesson_title, 'Foundational Photosynthesis & Energy Transfer');
    assert.strictEqual(generated.grade, 'Grade 1');
    assert.strictEqual(generated.subject, 'Environmental Studies');
    assert.strictEqual(generated.metadata.is_ai_generated, true);
    assert.strictEqual(generated.metadata.total_activity_duration_minutes, 45);
  });

  await test('LessonPlanningService.refineLessonPlan increments version and preserves duration', async () => {
    const refinedPayload = {
      ...VALID_PLAN_PAYLOAD,
      lesson_title: 'Foundational Photosynthesis & Energy Transfer (Refined: High Engagement)',
    };
    const mock = new MockAiProvider(refinedPayload);
    AiProviderFactory.setMockProvider(mock);

    const refined = await LessonPlanningService.refineLessonPlan(TENANT_A_ID, {
      current_plan: VALID_PLAN_PAYLOAD as any,
      refinement_instructions: 'Make activities more interactive and peer-driven.',
      focus_areas: ['activities'],
    });

    assert.strictEqual(refined.metadata.version, 2);
    assert.strictEqual(refined.lesson_title.includes('Refined'), true);
  });

  await test('LessonPlanningService.validateLessonPlanQuality scores duration and Bloom coverage', async () => {
    const evalResult = await LessonPlanningService.validateLessonPlanQuality(TENANT_A_ID, {
      plan: VALID_PLAN_PAYLOAD as any,
    });

    assert.strictEqual(evalResult.is_valid, true);
    assert.strictEqual(evalResult.duration_match, true);
    assert.strictEqual(evalResult.activity_count, 3);
    assert.strictEqual(evalResult.quality_score >= 80, true);
  });

  // ── SUITE 5: Saved Lesson Plans (Read-Only Physical Persistence) ──────────
  console.log('\n[Suite 5: Saved Lesson Plans Physical DB Inspection]');

  await test('LessonPlanningService.listSavedPlans returns paginated saved plans for Tenant A', async () => {
    const res = await LessonPlanningService.listSavedPlans(TENANT_A_ID, {
      page: 1,
      limit: 10,
    });

    assert.strictEqual(res.items.length >= 1, true);
    assert.strictEqual(res.meta.total >= 1, true);
    assert.ok(res.items[0].lesson_plan_id);
    assert.ok(res.items[0].teacher_name);
  });

  await test('LessonPlanningService.getSavedPlanById returns complete components tree', async () => {
    const sampleId = '9bab970e-9ada-5bd2-8e05-a1a33b0da27f';
    const plan = await LessonPlanningService.getSavedPlanById(TENANT_A_ID, sampleId);

    assert.strictEqual(plan.lesson_plan_id, sampleId);
    assert.strictEqual(plan.activities.length, 3);
    assert.strictEqual(plan.outcomes.length, 2);
    assert.strictEqual(plan.differentiation_strategies.length, 1);
    assert.strictEqual(plan.exit_tickets.length, 1);
    assert.strictEqual(plan.resources.length, 1);
  });

  await test('Multi-Tenant Isolation: Tenant B cannot access Tenant A saved lesson plan (Throws 404)', async () => {
    const sampleId = '9bab970e-9ada-5bd2-8e05-a1a33b0da27f';
    try {
      await LessonPlanningService.getSavedPlanById(TENANT_B_ID, sampleId);
      assert.fail('Should have thrown 404 for cross-tenant lesson plan access');
    } catch (err: any) {
      assert.strictEqual(err.statusCode, 404);
      assert.strictEqual(err.code, 'NOT_FOUND');
    }
  });

  // ── SUITE 6: Unsupported Write Operations (HTTP 501 Guardrails) ───────────
  console.log('\n[Suite 6: Unsupported Write Operations & HTTP 501 Guardrails]');

  await test('LessonPlanningService.handlePlanCreateUnsupported throws 501 FEATURE_NOT_IMPLEMENTED', () => {
    try {
      LessonPlanningService.handlePlanCreateUnsupported();
      assert.fail('Should have thrown 501');
    } catch (err: any) {
      assert.strictEqual(err.statusCode, 501);
      assert.strictEqual(err.code, 'FEATURE_NOT_IMPLEMENTED');
    }
  });

  await test('LessonPlanningService.handlePlanUpdateUnsupported throws 501 FEATURE_NOT_IMPLEMENTED', () => {
    try {
      LessonPlanningService.handlePlanUpdateUnsupported();
      assert.fail('Should have thrown 501');
    } catch (err: any) {
      assert.strictEqual(err.statusCode, 501);
      assert.strictEqual(err.code, 'FEATURE_NOT_IMPLEMENTED');
    }
  });

  await test('LessonPlanningService.handlePlanDeleteUnsupported throws 501 FEATURE_NOT_IMPLEMENTED', () => {
    try {
      LessonPlanningService.handlePlanDeleteUnsupported();
      assert.fail('Should have thrown 501');
    } catch (err: any) {
      assert.strictEqual(err.statusCode, 501);
      assert.strictEqual(err.code, 'FEATURE_NOT_IMPLEMENTED');
    }
  });

  await test('LessonPlanningService.handlePlanSubmitUnsupported throws 501 FEATURE_NOT_IMPLEMENTED', () => {
    try {
      LessonPlanningService.handlePlanSubmitUnsupported();
      assert.fail('Should have thrown 501');
    } catch (err: any) {
      assert.strictEqual(err.statusCode, 501);
      assert.strictEqual(err.code, 'FEATURE_NOT_IMPLEMENTED');
    }
  });

  await test('LessonPlanningService.handlePlanApproveUnsupported throws 501 FEATURE_NOT_IMPLEMENTED', () => {
    try {
      LessonPlanningService.handlePlanApproveUnsupported();
      assert.fail('Should have thrown 501');
    } catch (err: any) {
      assert.strictEqual(err.statusCode, 501);
      assert.strictEqual(err.code, 'FEATURE_NOT_IMPLEMENTED');
    }
  });

  // ── SUITE 7: Prisma Persistence Guard Enforcement ─────────────────────────
  console.log('\n[Suite 7: Prisma Persistence Guard Enforcement]');

  await test('Prisma guard blocks direct write on lesson_plans (throws Persistence Error)', async () => {
    try {
      await (prisma as any).lesson_plans.create({ data: { title: 'Illegal RAM Write' } });
      assert.fail('Prisma guard should have intercepted direct write on lesson_plans');
    } catch (err: any) {
      assert.ok(err.message.includes('[Persistence Error]'));
    }
  });

  await test('Prisma guard blocks direct write on lesson_plan_outcomes (throws Persistence Error)', async () => {
    try {
      await (prisma as any).lesson_plan_outcomes.create({ data: {} });
      assert.fail('Prisma guard should have intercepted direct write on lesson_plan_outcomes');
    } catch (err: any) {
      assert.ok(err.message.includes('[Persistence Error]'));
    }
  });

  await test('Prisma guard blocks direct write on lesson_plan_resources (throws Persistence Error)', async () => {
    try {
      await (prisma as any).lesson_plan_resources.create({ data: {} });
      assert.fail('Prisma guard should have intercepted direct write on lesson_plan_resources');
    } catch (err: any) {
      assert.ok(err.message.includes('[Persistence Error]'));
    }
  });

  await test('Prisma guard blocks direct write on lesson_activities (throws Persistence Error)', async () => {
    try {
      await (prisma as any).lesson_activities.create({ data: {} });
      assert.fail('Prisma guard should have intercepted direct write on lesson_activities');
    } catch (err: any) {
      assert.ok(err.message.includes('[Persistence Error]'));
    }
  });

  await test('Prisma guard blocks direct write on lesson_differentiation_strategies (throws Persistence Error)', async () => {
    try {
      await (prisma as any).lesson_differentiation_strategies.create({ data: {} });
      assert.fail(
        'Prisma guard should have intercepted direct write on lesson_differentiation_strategies',
      );
    } catch (err: any) {
      assert.ok(err.message.includes('[Persistence Error]'));
    }
  });

  await test('Prisma guard blocks direct write on lesson_exit_tickets (throws Persistence Error)', async () => {
    try {
      await (prisma as any).lesson_exit_tickets.create({ data: {} });
      assert.fail('Prisma guard should have intercepted direct write on lesson_exit_tickets');
    } catch (err: any) {
      assert.ok(err.message.includes('[Persistence Error]'));
    }
  });

  // ── FINAL SUMMARY ─────────────────────────────────────────────────────────
  console.log('\n===============================================================');
  console.log(`  PHASE 7 TEST RESULTS: ${passed} PASSED, ${failed} FAILED  `);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase7Tests()
  .catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
