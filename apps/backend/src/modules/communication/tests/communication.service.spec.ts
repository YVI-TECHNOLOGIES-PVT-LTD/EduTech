import assert from 'assert';
import { EscalationService } from '../services/EscalationService';
import { FeedService } from '../services/FeedService';
import { HelpdeskService } from '../services/HelpdeskService';
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
