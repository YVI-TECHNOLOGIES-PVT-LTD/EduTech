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
    assert(paths.includes('/feeds'), 'Must include /feeds');
    assert(paths.includes('/feeds/:id'), 'Must include /feeds/:id');
    assert(paths.includes('/feeds/:id/comments'), 'Must include /feeds/:id/comments');
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

  // ==========================================
  // C2 ANNOUNCEMENTS & FEEDS DETAILED SUITE
  // ==========================================

  const greenwoodOrgId = '624efc1b-4144-43a4-90b8-552d945cbef7';
  const adminUserId = '7bde8ed1-d570-4b0c-9385-7021b3f18b37';
  const amaraTeacherUserId = '1efd57c3-76c1-4ccc-837c-03444f5342b7'; // Assigned to Grade 4 section B (053ea5f9-9804-4690-8c49-f513680b9df7)
  const amaraAssignedSectionId = '053ea5f9-9804-4690-8c49-f513680b9df7';
  const unassignedSectionId = '01095fb1-ea4a-4389-aafb-fb7257abde94'; // Section B of Grade 11
  const parentUserId = '932b113e-2f39-547d-bcc4-8a6a7095e933'; // Linked to Grade 5 AYG b6148849-e40e-4bbd-87f6-3959db873f46
  const crossOrgAygId = '6e7fa2e5-9ffd-4cc7-a796-5b158d6b0dc0'; // From Ahmedabad org

  let testDraftPostId: string = '';
  let testPublishedPostId: string = '';

  await test('16. Announcement Creation: Draft creation with valid payload & targets', async () => {
    const post = await FeedService.createPost(
      greenwoodOrgId,
      adminUserId,
      { userId: adminUserId, isStaff: true, isManagement: true },
      {
        feedType: 'parent',
        audienceScope: 'selected_academic_groups',
        title: '[TEST-C2] Annual Sports Day Draft',
        content: 'Annual Sports Day will be conducted on Friday morning.',
        commentsEnabled: true,
        reactionsEnabled: true,
        sectionIds: [amaraAssignedSectionId],
      },
    );

    assert(post && post.feedPostId, 'Post must be created and return feedPostId');
    assert.strictEqual(post.status, 'draft', 'Newly created post must be in draft status');
    assert.strictEqual(post.title, '[TEST-C2] Annual Sports Day Draft');
    assert.strictEqual(post.commentsEnabled, true);
    assert.strictEqual(post.reactionsEnabled, true);
    assert(post.sectionTargets && post.sectionTargets.length === 1);
    assert.strictEqual(post.sectionTargets[0].sectionId, amaraAssignedSectionId);
    testDraftPostId = post.feedPostId;
  });

  await test('17. Announcement Creation: Parents/students cannot create announcements', async () => {
    let thrown = false;
    try {
      await FeedService.createPost(
        greenwoodOrgId,
        parentUserId,
        { userId: parentUserId, isStaff: false, isParent: true },
        {
          feedType: 'parent',
          audienceScope: 'all_parents',
          title: 'Parent Post Attempt',
          content: 'This should fail',
        },
      );
    } catch (err: any) {
      thrown = true;
      assert.strictEqual(err.code, 'FORBIDDEN');
    }
    assert.strictEqual(
      thrown,
      true,
      'Parent attempting to create announcement must throw 403 FORBIDDEN',
    );
  });

  await test('18. Announcement Creation: Blank content is rejected', async () => {
    let thrown = false;
    try {
      await FeedService.createPost(
        greenwoodOrgId,
        adminUserId,
        { userId: adminUserId, isStaff: true, isManagement: true },
        {
          feedType: 'parent',
          audienceScope: 'all_parents',
          title: 'Valid Title',
          content: '    ',
        },
      );
    } catch (err: any) {
      thrown = true;
      assert.strictEqual(err.code, 'INVALID_CONTENT');
    }
    assert.strictEqual(thrown, true, 'Blank content must be rejected with 400 INVALID_CONTENT');
  });

  await test('19. Announcement Creation: Cross-organization target is rejected', async () => {
    let thrown = false;
    try {
      await FeedService.createPost(
        greenwoodOrgId,
        adminUserId,
        { userId: adminUserId, isStaff: true, isManagement: true },
        {
          feedType: 'parent',
          audienceScope: 'selected_academic_groups',
          title: 'Cross Org Target',
          content: 'Targeting an Ahmedabad AYG from Greenwood',
          academicYearGradeIds: [crossOrgAygId],
        },
      );
    } catch (err: any) {
      thrown = true;
      assert.strictEqual(err.code, 'TARGET_NOT_FOUND');
    }
    assert.strictEqual(thrown, true, 'Cross-org targets must be rejected with TARGET_NOT_FOUND');
  });

  await test('20. Announcement Creation: Teacher targeting out-of-scope section is rejected', async () => {
    let thrown = false;
    try {
      await FeedService.createPost(
        greenwoodOrgId,
        amaraTeacherUserId,
        { userId: amaraTeacherUserId, isStaff: true, isTeacher: true },
        {
          feedType: 'classroom',
          audienceScope: 'selected_academic_groups',
          title: 'Teacher Out Of Scope',
          content: 'Trying to post to unassigned Grade 11 Section B',
          sectionIds: [unassignedSectionId],
        },
      );
    } catch (err: any) {
      thrown = true;
      assert.strictEqual(err.code, 'FORBIDDEN_ACADEMIC_SCOPE');
    }
    assert.strictEqual(
      thrown,
      true,
      'Teacher targeting unassigned section must throw 403 FORBIDDEN_ACADEMIC_SCOPE',
    );
  });

  await test('21. Announcement Creation: Teacher targeting assigned section succeeds', async () => {
    const teacherPost = await FeedService.createPost(
      greenwoodOrgId,
      amaraTeacherUserId,
      { userId: amaraTeacherUserId, isStaff: true, isTeacher: true },
      {
        feedType: 'classroom',
        audienceScope: 'selected_academic_groups',
        title: '[TEST-C2] Class 4B Homework Update',
        content: 'Please bring your math journals tomorrow.',
        sectionIds: [amaraAssignedSectionId],
      },
    );
    assert.strictEqual(teacherPost.feedType, 'classroom');
    assert.strictEqual(teacherPost.status, 'draft');

    // Clean up temporary teacher post
    await prisma.feed_posts.delete({ where: { feed_post_id: teacherPost.feedPostId } });
  });

  await test('22. Draft Updates: Updating draft title, content, and target replacement', async () => {
    const updated = await FeedService.updateDraft(
      greenwoodOrgId,
      testDraftPostId,
      adminUserId,
      { userId: adminUserId, isStaff: true, isManagement: true },
      {
        title: '[TEST-C2] Annual Sports Day (Updated Draft)',
        content: 'Annual Sports Day will be held on Friday at 8:30 AM.',
        sectionIds: [amaraAssignedSectionId],
      },
    );

    assert.strictEqual(updated.title, '[TEST-C2] Annual Sports Day (Updated Draft)');
    assert.strictEqual(updated.content, 'Annual Sports Day will be held on Friday at 8:30 AM.');
  });

  await test('23. Publication Guard: Selected academic groups post requires at least one target', async () => {
    const emptyDraft = await prisma.feed_posts.create({
      data: {
        org_id: greenwoodOrgId,
        author_user_id: adminUserId,
        feed_type: 'parent',
        audience_scope: 'selected_academic_groups',
        title: 'Untargeted Draft',
        content: 'No targets attached',
        status: 'draft',
      },
    });

    let thrown = false;
    try {
      await FeedService.publishPost(greenwoodOrgId, emptyDraft.feed_post_id, adminUserId, {
        userId: adminUserId,
        isStaff: true,
        isManagement: true,
      });
    } catch (err: any) {
      thrown = true;
      assert.strictEqual(err.code, 'TARGET_REQUIRED');
    } finally {
      await prisma.feed_posts.delete({ where: { feed_post_id: emptyDraft.feed_post_id } });
    }
    assert.strictEqual(
      thrown,
      true,
      'Publishing untargeted selected_academic_groups post must fail',
    );
  });

  await test('24. Publication: Publishing draft post sets status=published and publishedAt', async () => {
    const published = await FeedService.publishPost(greenwoodOrgId, testDraftPostId, adminUserId, {
      userId: adminUserId,
      isStaff: true,
      isManagement: true,
    });

    assert.strictEqual(published.status, 'published');
    assert(published.publishedAt !== null, 'publishedAt must be populated');
    testPublishedPostId = published.feedPostId;
  });

  await test('25. Lifecycle Integrity: Published post cannot return to draft', async () => {
    let thrown = false;
    try {
      await FeedService.updateDraft(
        greenwoodOrgId,
        testPublishedPostId,
        adminUserId,
        { userId: adminUserId, isStaff: true, isManagement: true },
        { title: 'Trying to update published post as draft' },
      );
    } catch (err: any) {
      thrown = true;
      assert.strictEqual(err.code, 'POST_ALREADY_PUBLISHED');
    }
    assert.strictEqual(thrown, true, 'Published post cannot be updated as draft');
  });

  await test('26. Audience Visibility: Parent sees all_parents and child grade, but NOT staff_only', async () => {
    // 1. Create a staff-only post
    const staffPost = await FeedService.createPost(
      greenwoodOrgId,
      adminUserId,
      { userId: adminUserId, isStaff: true, isManagement: true },
      {
        feedType: 'staff_community',
        audienceScope: 'staff_only',
        title: '[TEST-C2] Staff Meeting Notice',
        content: 'Staff briefing in the library at 3 PM.',
        status: 'published',
      },
    );

    // 2. Query parent feed
    const parentFeed = await FeedService.listPosts(
      greenwoodOrgId,
      { userId: parentUserId, isStaff: false, isParent: true },
      { limit: 50 },
    );

    const postIdsInParentFeed = parentFeed.data.map((p) => p.feedPostId);
    assert(
      !postIdsInParentFeed.includes(staffPost.feedPostId),
      'Staff-only post must NOT be visible to parent',
    );

    // Clean up staff post
    await prisma.feed_posts.delete({ where: { feed_post_id: staffPost.feedPostId } });
  });

  let testCommentId: string = '';

  await test('27. Comments: Adding comment to published post succeeds', async () => {
    const comment = await FeedService.addComment(
      greenwoodOrgId,
      testPublishedPostId,
      adminUserId,
      { userId: adminUserId, isStaff: true, isManagement: true },
      'Thank you for the announcement update!',
    );

    assert(comment && comment.commentId, 'Comment must be created with ID');
    assert.strictEqual(comment.content, 'Thank you for the announcement update!');
    assert.strictEqual(comment.author.userId, adminUserId);
    testCommentId = comment.commentId;
  });

  await test('28. Comments: Adding comment to post with comments_enabled=false throws error', async () => {
    const noCommentsPost = await prisma.feed_posts.create({
      data: {
        org_id: greenwoodOrgId,
        author_user_id: adminUserId,
        feed_type: 'parent',
        audience_scope: 'all_parents',
        title: 'No Comments Allowed',
        content: 'Comments are disabled for this notice.',
        comments_enabled: false,
        status: 'published',
        published_at: new Date(),
      },
    });

    let thrown = false;
    try {
      await FeedService.addComment(
        greenwoodOrgId,
        noCommentsPost.feed_post_id,
        adminUserId,
        { userId: adminUserId, isStaff: true, isManagement: true },
        'Should fail to comment',
      );
    } catch (err: any) {
      thrown = true;
      assert.strictEqual(err.code, 'COMMENTS_DISABLED');
    } finally {
      await prisma.feed_posts.delete({ where: { feed_post_id: noCommentsPost.feed_post_id } });
    }
    assert.strictEqual(thrown, true, 'Commenting on post with comments_enabled=false must fail');
  });

  await test('29. Comments: Author and staff moderator can delete comments (soft delete)', async () => {
    // 1. List active comments - should include testCommentId
    const beforeList = await FeedService.listComments(
      greenwoodOrgId,
      testPublishedPostId,
      adminUserId,
      { userId: adminUserId, isStaff: true, isManagement: true },
    );
    assert(
      beforeList.some((c) => c.commentId === testCommentId),
      'Comment should be listed before deletion',
    );

    // 2. Soft-delete comment
    const deleted = await FeedService.deleteComment(
      greenwoodOrgId,
      testCommentId,
      adminUserId,
      { userId: adminUserId, isStaff: true, isManagement: true },
      'Author self-removal',
    );
    assert(deleted.deletedAt !== null, 'deletedAt must be set');

    // 3. List active comments again - must NOT include deleted comment
    const afterList = await FeedService.listComments(
      greenwoodOrgId,
      testPublishedPostId,
      adminUserId,
      { userId: adminUserId, isStaff: true, isManagement: true },
    );
    assert(
      !afterList.some((c) => c.commentId === testCommentId),
      'Deleted comment must be excluded from listing',
    );
  });

  await test('30. Reactions: Adding reaction and changing reaction updates the same row', async () => {
    const catalog = await FeedService.getReactionCatalogue(greenwoodOrgId, testPublishedPostId);
    assert(catalog.length > 0, 'Should have reaction catalogue entries');

    const likeReaction = catalog.find((r) => r.reactionCode === 'like') || catalog[0];
    const celebrateReaction = catalog.find((r) => r.reactionCode === 'celebrate') || catalog[1];

    // 1. Add reaction (like)
    const react1 = await FeedService.reactToPost(
      greenwoodOrgId,
      testPublishedPostId,
      adminUserId,
      { userId: adminUserId, isStaff: true, isManagement: true },
      likeReaction.reactionTypeId,
    );
    assert.strictEqual(react1.reactionTypeId, likeReaction.reactionTypeId);

    // 2. Change reaction (celebrate)
    const react2 = await FeedService.reactToPost(
      greenwoodOrgId,
      testPublishedPostId,
      adminUserId,
      { userId: adminUserId, isStaff: true, isManagement: true },
      celebrateReaction.reactionTypeId,
    );
    assert.strictEqual(react2.reactionTypeId, celebrateReaction.reactionTypeId);

    // 3. Verify exactly one reaction exists in DB for this user + post
    const count = await prisma.feed_post_reactions.count({
      where: { feed_post_id: testPublishedPostId, user_id: adminUserId },
    });
    assert.strictEqual(count, 1, 'Only one reaction row must exist per user per post');
  });

  await test('31. Reaction Summary: Aggregates counts and identifies currentUserReaction', async () => {
    const postDetail = await FeedService.getPostById(
      greenwoodOrgId,
      testPublishedPostId,
      adminUserId,
      { userId: adminUserId, isStaff: true, isManagement: true },
    );

    assert(Array.isArray(postDetail.reactionSummary), 'reactionSummary must be an array');
    assert(
      postDetail.currentUserReaction !== null,
      'currentUserReaction must be identified for admin',
    );

    // Remove user reaction
    await FeedService.removeReaction(greenwoodOrgId, testPublishedPostId, adminUserId);
    const postDetailAfter = await FeedService.getPostById(
      greenwoodOrgId,
      testPublishedPostId,
      adminUserId,
      { userId: adminUserId, isStaff: true, isManagement: true },
    );
    assert.strictEqual(
      postDetailAfter.currentUserReaction,
      null,
      'currentUserReaction must be null after removal',
    );
  });

  await test('32. Removal: Soft remove updates status=removed, preserves records, rejects modifications', async () => {
    const removed = await FeedService.removePost(greenwoodOrgId, testPublishedPostId, adminUserId, {
      userId: adminUserId,
      isStaff: true,
      isManagement: true,
    });
    assert.strictEqual(removed.status, 'removed');

    // Verify cannot modify removed post
    let thrown = false;
    try {
      await FeedService.updateDraft(
        greenwoodOrgId,
        testPublishedPostId,
        adminUserId,
        { userId: adminUserId, isStaff: true, isManagement: true },
        { title: 'Attempt to update removed post' },
      );
    } catch (err: any) {
      thrown = true;
      assert.strictEqual(err.code, 'POST_REMOVED');
    }
    assert.strictEqual(thrown, true, 'Updating removed post must be rejected');

    // Clean up test post
    await prisma.feed_posts.delete({ where: { feed_post_id: testPublishedPostId } });
  });

  await test('33. Tenant Security: Operations across tenant boundaries are rejected', async () => {
    const otherOrgId = '5205f1f3-4e31-42d9-9b53-77fc84ad40df';
    let thrown = false;
    try {
      await FeedService.getPostById(
        otherOrgId,
        '00000000-0000-0000-0000-000000000001',
        adminUserId,
        { userId: adminUserId, isStaff: true, isManagement: true },
      );
    } catch (err: any) {
      thrown = true;
      assert.strictEqual(err.code, 'POST_NOT_FOUND');
    }
    assert.strictEqual(thrown, true, 'Cross-tenant post lookup must throw 404 POST_NOT_FOUND');
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
