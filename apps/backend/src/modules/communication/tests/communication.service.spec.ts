import assert from 'assert';
import { EscalationService } from '../services/EscalationService';
import { FeedService } from '../services/FeedService';
import { HelpdeskService } from '../services/HelpdeskService';
import { CommunicationController } from '../controllers/communication.controller';
import { communicationRouter } from '../communication.routes';
import { feesRouter } from '../../fees/fees.routes';
import prisma from '../../../lib/prismaClient';

export async function runCommunicationTests() {
  console.log('=====================================================');
  console.log('   COMMUNICATION & HELPDESK TEST SUITE               ');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}: ${err.message}`);
      failed++;
    }
  }

  const testOrgId = '00000000-0000-0000-0000-000000000001';
  const testUserId = '00000000-0000-0000-0000-000000000002';
  const testStaffId = '00000000-0000-0000-0000-000000000003';
  const testCategoryId = '00000000-0000-0000-0000-000000000004';

  // 1. Escalation Rule 4-Tier Precedence Evaluation
  await test('1. Escalation Rule precedence: Category + Priority is highest tier', () => {
    const rules: any[] = [
      {
        escalation_rule_id: 'rule-org-default',
        category_id: null,
        priority: null,
        no_response_after_minutes: 120,
        is_active: true,
      },
      {
        escalation_rule_id: 'rule-priority-only',
        category_id: null,
        priority: 'urgent',
        no_response_after_minutes: 60,
        is_active: true,
      },
      {
        escalation_rule_id: 'rule-category-only',
        category_id: testCategoryId,
        priority: null,
        no_response_after_minutes: 45,
        is_active: true,
      },
      {
        escalation_rule_id: 'rule-cat-and-pri',
        category_id: testCategoryId,
        priority: 'urgent',
        no_response_after_minutes: 30,
        is_active: true,
      },
    ];

    const resolved = EscalationService.resolveApplicableRule(rules, 'urgent', testCategoryId);
    assert.strictEqual(
      resolved?.escalation_rule_id,
      'rule-cat-and-pri',
      'Should pick the exact category + priority rule',
    );
  });

  await test('2. Escalation Rule precedence: Category-only beats Priority-only', () => {
    const rules: any[] = [
      {
        escalation_rule_id: 'rule-org-default',
        category_id: null,
        priority: null,
        no_response_after_minutes: 120,
        is_active: true,
      },
      {
        escalation_rule_id: 'rule-priority-only',
        category_id: null,
        priority: 'urgent',
        no_response_after_minutes: 60,
        is_active: true,
      },
      {
        escalation_rule_id: 'rule-category-only',
        category_id: testCategoryId,
        priority: null,
        no_response_after_minutes: 45,
        is_active: true,
      },
    ];

    const resolved = EscalationService.resolveApplicableRule(rules, 'urgent', testCategoryId);
    assert.strictEqual(
      resolved?.escalation_rule_id,
      'rule-category-only',
      'Category-level rule must take precedence over priority-only rule',
    );
  });

  await test('3. Escalation Rule precedence: Priority-only beats Org default', () => {
    const otherCategoryId = '00000000-0000-0000-0000-000000000099';
    const rules: any[] = [
      {
        escalation_rule_id: 'rule-org-default',
        category_id: null,
        priority: null,
        no_response_after_minutes: 120,
        is_active: true,
      },
      {
        escalation_rule_id: 'rule-priority-only',
        category_id: null,
        priority: 'high',
        no_response_after_minutes: 60,
        is_active: true,
      },
    ];

    const resolved = EscalationService.resolveApplicableRule(rules, 'high', otherCategoryId);
    assert.strictEqual(
      resolved?.escalation_rule_id,
      'rule-priority-only',
      'Priority-only rule must take precedence over org default',
    );
  });

  await test('4. Escalation Rule precedence: Inactive specific rule blocks broader rule', () => {
    const rules: any[] = [
      {
        escalation_rule_id: 'rule-org-default',
        category_id: null,
        priority: null,
        no_response_after_minutes: 120,
        is_active: true,
      },
      {
        escalation_rule_id: 'rule-cat-disabled',
        category_id: testCategoryId,
        priority: null,
        no_response_after_minutes: 45,
        is_active: false, // Disabled
      },
    ];

    const resolved = EscalationService.resolveApplicableRule(rules, 'normal', testCategoryId);
    assert.strictEqual(
      resolved,
      null,
      'A disabled more-specific rule must suppress fallback to broader rules',
    );
  });

  // 2. Helpdesk Privacy & Role Guard
  await test('5. Helpdesk Security: Parents/students cannot create internal_note', async () => {
    let thrown = false;
    try {
      await HelpdeskService.addMessage(
        testOrgId,
        'mock-ticket-id',
        testUserId,
        false, // isStaff = false
        {
          content: 'Private note from parent?',
          message_type: 'internal_note',
        },
      );
    } catch (err: any) {
      thrown = true;
      assert.strictEqual(err.message, 'Only staff members can post internal notes');
    }
    assert.strictEqual(thrown, true, 'Non-staff posting internal_note must throw an error');
  });

  // 3. Router Mounting Verification
  await test('6. Router Mounting: Communication router contains all subroutes', () => {
    const stack = (communicationRouter as any).stack;
    const paths = stack.map((layer: any) => layer.route?.path).filter(Boolean);

    assert(paths.includes('/posts'), 'Must include /posts');
    assert(paths.includes('/posts/:id'), 'Must include /posts/:id');
    assert(paths.includes('/posts/:id/comments'), 'Must include /posts/:id/comments');
    assert(paths.includes('/reactions/catalog'), 'Must include /reactions/catalog');
    assert(paths.includes('/helpdesk/categories'), 'Must include /helpdesk/categories');
    assert(paths.includes('/helpdesk/tickets'), 'Must include /helpdesk/tickets');
    assert(paths.includes('/helpdesk/tickets/:id'), 'Must include /helpdesk/tickets/:id');
    assert(paths.includes('/helpdesk/escalation/rules'), 'Must include /helpdesk/escalation/rules');
    assert(
      paths.includes('/helpdesk/escalation/evaluate'),
      'Must include /helpdesk/escalation/evaluate',
    );
  });

  await test('7. Router Mounting: Fees router mounts /communication', () => {
    const stack = (feesRouter as any).stack;
    const commLayer = stack.find(
      (layer: any) => layer.name === 'router' && layer.regexp.toString().includes('communication'),
    );
    assert(commLayer !== undefined, 'feesRouter must mount communication router');
  });

  // 4. Schema Alignment Checks: Prisma Models
  await test('8. Schema Alignment: communication models match schema.prisma', async () => {
    // feed_posts model exists and queries safely
    await prisma.feed_posts.count({ where: { org_id: testOrgId } });
    // feed_comments model exists and queries safely
    await prisma.feed_comments.count({ where: { feed_posts: { org_id: testOrgId } } });
    // feed_reaction_types model exists and queries safely
    await prisma.feed_reaction_types.count();
    // helpdesk_categories model exists and queries safely
    await prisma.helpdesk_categories.count({ where: { org_id: testOrgId } });
    // helpdesk_tickets model exists and queries safely
    await prisma.helpdesk_tickets.count({ where: { org_id: testOrgId } });
    // helpdesk_messages model exists and queries safely
    await prisma.helpdesk_messages.count({ where: { org_id: testOrgId } });
    // helpdesk_escalation_rules model exists and queries safely
    await prisma.helpdesk_escalation_rules.count({ where: { org_id: testOrgId } });
  });

  // 5. Staff Role Mapping & Context Classification
  await test('9. Role Mapping: Management personas correctly identified', () => {
    const adminCtx = CommunicationController.extractUserContext({
      context: { user: { id: 'usr-admin', roles: ['Administrator'] } },
    } as any);
    assert.strictEqual(adminCtx.isManagement, true);
    assert.strictEqual(adminCtx.isStaff, true);
    assert.strictEqual(adminCtx.isTeacher, false);

    const superAdminCtx = CommunicationController.extractUserContext({
      context: { user: { id: 'usr-super', roles: ['Super Admin'] } },
    } as any);
    assert.strictEqual(superAdminCtx.isManagement, true);
    assert.strictEqual(superAdminCtx.isStaff, true);

    const principalCtx = CommunicationController.extractUserContext({
      context: { user: { id: 'usr-principal', roles: ['Principal'] } },
    } as any);
    assert.strictEqual(principalCtx.isManagement, true);
    assert.strictEqual(principalCtx.isStaff, true);
  });

  await test('10. Role Mapping: Teacher persona correctly identified', () => {
    const teacherCtx = CommunicationController.extractUserContext({
      context: { user: { id: 'usr-teacher', roles: ['Teacher'] } },
    } as any);
    assert.strictEqual(teacherCtx.isManagement, false);
    assert.strictEqual(teacherCtx.isTeacher, true);
    assert.strictEqual(teacherCtx.isStaff, true);
    assert.strictEqual(teacherCtx.isFinance, false);
  });

  await test('11. Role Mapping: Finance persona correctly identified', () => {
    const finCtx = CommunicationController.extractUserContext({
      context: { user: { id: 'usr-finance', roles: ['Finance'] } },
    } as any);
    assert.strictEqual(finCtx.isManagement, false);
    assert.strictEqual(finCtx.isFinance, true);
    assert.strictEqual(finCtx.isStaff, true);
    assert.strictEqual(finCtx.isTeacher, false);
  });

  await test('12. Role Mapping: Front Office persona correctly identified', () => {
    const foCtx = CommunicationController.extractUserContext({
      context: { user: { id: 'usr-fo', roles: ['Front Office'] } },
    } as any);
    assert.strictEqual(foCtx.isManagement, false);
    assert.strictEqual(foCtx.isFrontOffice, true);
    assert.strictEqual(foCtx.isStaff, true);
    assert.strictEqual(foCtx.isFinance, false);
  });

  await test('13. Role Mapping: Parent persona correctly isolated from staff privileges', () => {
    const parentCtx = CommunicationController.extractUserContext({
      context: { user: { id: 'usr-parent', roles: ['Parent'] } },
    } as any);
    assert.strictEqual(parentCtx.isManagement, false);
    assert.strictEqual(parentCtx.isStaff, false);
    assert.strictEqual(parentCtx.isParent, true);
  });

  // 6. Role-Based Scoping & Boundary Execution on Greenwood School Org
  await test('14. Role Scoping: Greenwood School ticket list for Management, Staff, and Parent', async () => {
    const greenwoodOrgId = '624efc1b-4144-43a4-90b8-552d945cbef7';
    const adminUserId = '7bde8ed1-d570-4b0c-9385-7021b3f18b37';
    const teacherUserId = 'a18f76c7-3730-4f3f-91ae-1401b297a3f1';
    const financeUserId = '1dff0bbc-c1d6-4d67-8b32-f8d82f25448d';
    const frontOfficeUserId = '339dccde-eb30-4f89-ada3-2858ce3bb406';
    const parentUserId = '77885aec-5431-5024-8f14-5f70a0a18efb';

    // Management list query
    const mgmtRes = await HelpdeskService.listTickets(
      greenwoodOrgId,
      { userId: adminUserId, isStaff: true, isManagement: true },
      { limit: 5 },
    );
    assert(mgmtRes && Array.isArray(mgmtRes.tickets), 'Management should get tickets array');

    // Teacher list query
    const teacherRes = await HelpdeskService.listTickets(
      greenwoodOrgId,
      { userId: teacherUserId, isStaff: true, isTeacher: true },
      { limit: 5 },
    );
    assert(teacherRes && Array.isArray(teacherRes.tickets), 'Teacher should get tickets array');

    // Finance list query
    const finRes = await HelpdeskService.listTickets(
      greenwoodOrgId,
      { userId: financeUserId, isStaff: true, isFinance: true },
      { limit: 5 },
    );
    assert(finRes && Array.isArray(finRes.tickets), 'Finance should get tickets array');

    // Front Office list query
    const foRes = await HelpdeskService.listTickets(
      greenwoodOrgId,
      { userId: frontOfficeUserId, isStaff: true, isFrontOffice: true },
      { limit: 5 },
    );
    assert(foRes && Array.isArray(foRes.tickets), 'Front Office should get tickets array');

    // Parent list query
    const parentRes = await HelpdeskService.listTickets(
      greenwoodOrgId,
      { userId: parentUserId, isStaff: false, isParent: true },
      { limit: 5 },
    );
    assert(parentRes && Array.isArray(parentRes.tickets), 'Parent should get tickets array');
  });

  await test('15. Role-based Feed Visibility scoping on Greenwood School Org', async () => {
    const greenwoodOrgId = '624efc1b-4144-43a4-90b8-552d945cbef7';
    const adminUserId = '7bde8ed1-d570-4b0c-9385-7021b3f18b37';
    const teacherUserId = 'a18f76c7-3730-4f3f-91ae-1401b297a3f1';

    // Management feed query
    const mgmtFeed = await FeedService.listPosts(
      greenwoodOrgId,
      { userId: adminUserId, isStaff: true, isManagement: true },
      { limit: 5 },
    );
    assert(mgmtFeed && Array.isArray(mgmtFeed.posts), 'Management should get posts array');

    // Teacher feed query
    const teacherFeed = await FeedService.listPosts(
      greenwoodOrgId,
      { userId: teacherUserId, isStaff: true, isTeacher: true },
      { limit: 5 },
    );
    assert(teacherFeed && Array.isArray(teacherFeed.posts), 'Teacher should get posts array');
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    throw new Error(`${failed} communication tests failed`);
  }
}

if (require.main === module) {
  runCommunicationTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
