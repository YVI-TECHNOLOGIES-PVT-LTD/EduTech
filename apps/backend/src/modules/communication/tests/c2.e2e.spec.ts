import assert from 'assert';
import { FeedService } from '../services/FeedService';
import prisma from '../../../lib/prismaClient';

export async function runC2Tests() {
  console.log('=====================================================');
  console.log('   C2 ANNOUNCEMENTS & FEEDS E2E SPEC                 ');
  console.log('=====================================================\n');

  const orgId = '624efc1b-4144-43a4-90b8-552d945cbef7'; // Greenwood School

  // 1. Find a Finance User in Greenwood
  const financeUser = await prisma.users.findFirst({
    where: {
      org_id: orgId,
      user_roles_user_roles_user_idTousers: {
        some: {
          roles: {
            role_name: { contains: 'Finance', mode: 'insensitive' },
          },
        },
      },
    },
  });

  const userId = financeUser?.user_id || '1dff0bbc-c1d6-4d67-8b32-f8d82f25448d';

  const userContext = {
    userId,
    isStaff: true,
    isFinance: true,
    isManagement: false,
    isTeacher: false,
    isFrontOffice: false,
    isParent: false,
    isStudent: false,
    roles: ['FINANCE'],
  };

  // 1. Finance visibility
  console.log('1. Testing Feed List for Finance User...');
  const res = await FeedService.listPosts(orgId, userContext, { limit: 50 });
  console.log(`   ✓ Found ${res.pagination.total} total posts, retrieved ${res.posts.length}`);
  assert(res.posts.length > 0, 'Finance user must see published posts from Greenwood School');
  assert(res.pagination.total > 0, 'Total posts must be greater than 0');

  const sample = res.posts[0];
  assert(sample.feedPostId !== undefined, 'Must contain camelCase feedPostId');
  assert(sample.feed_post_id !== undefined, 'Must contain snake_case feed_post_id');
  assert(sample.feedType !== undefined, 'Must contain camelCase feedType');
  assert(sample.feed_type !== undefined, 'Must contain snake_case feed_type');
  assert(sample.author !== undefined, 'Must contain author object');
  console.log(`   ✓ Sample post validated: "${sample.title || sample.content.slice(0, 30)}..."`);

  // 2. Reaction catalogue
  console.log('2. Testing Reaction Catalogue...');
  const catalogue = await FeedService.getReactionCatalogue();
  console.log(`   ✓ Reaction types available: ${catalogue.length}`);
  assert(
    catalogue.length >= 5,
    'Catalogue must have standard reactions (like, love, celebrate, etc.)',
  );

  // 3. Allowed reactions for post
  console.log('3. Testing Allowed Reactions for post...');
  const allowed = await FeedService.getAllowedReactions(sample.feedPostId);
  console.log(`   ✓ Allowed reactions count: ${allowed.length}`);

  // 4. Draft creation (Section 5.1)
  console.log('4. Testing Announcement Draft Creation...');
  const draft = await FeedService.createPost(
    orgId,
    userId,
    {
      feedType: 'parent',
      audienceScope: 'organization',
      title: 'Q2 Fee Schedule Reminder (E2E Test)',
      content: 'Important update regarding Q2 school fee schedules and due dates.',
      commentsEnabled: true,
      reactionsEnabled: true,
    },
    userContext,
  );
  console.log(`   ✓ Draft created: ${draft.feed_post_id} (${draft.status})`);
  assert.strictEqual(draft.status, 'draft', 'Newly created announcement must have status draft');

  // 5. Draft update (Section 5.2)
  console.log('5. Testing Save Draft (Update)...');
  const updated = await FeedService.updateDraft(
    orgId,
    draft.feed_post_id,
    userId,
    {
      title: 'Q2 Fee Schedule Reminder (Updated E2E Test)',
      content: 'Updated content regarding Q2 school fee schedules and payment options.',
    },
    userContext,
  );
  assert.strictEqual(updated.title, 'Q2 Fee Schedule Reminder (Updated E2E Test)');
  console.log(`   ✓ Draft updated: ${updated.feed_post_id}`);

  // 6. Publish announcement (Section 5.3)
  console.log('6. Testing Announcement Publishing...');
  const published = await FeedService.publishPost(orgId, draft.feed_post_id, userId, userContext);
  assert.strictEqual(published.status, 'published', 'Post must be published');
  assert(published.published_at !== null, 'published_at must be populated');
  console.log(`   ✓ Post published: ${published.feed_post_id} at ${published.published_at}`);

  // 7. Add comment (Section 7.1)
  console.log('7. Testing Add Comment...');
  const comment = await FeedService.addComment(
    orgId,
    draft.feed_post_id,
    userId,
    'Finance announcement comment',
  );
  assert(comment.feed_comment_id !== undefined, 'Comment must have ID');
  console.log(`   ✓ Comment added: ${comment.feed_comment_id}`);

  // 8. List comments (Section 7.2)
  console.log('8. Testing Retrieve Comments...');
  const comments = await FeedService.listComments(draft.feed_post_id);
  assert.strictEqual(comments.length, 1, 'Should find 1 active comment');
  console.log(`   ✓ Retrieved comments: count = ${comments.length}`);

  // 9. Soft-delete comment (Section 7.3)
  console.log('9. Testing Soft Delete Comment...');
  const deletedComment = await FeedService.deleteComment(
    comment.feed_comment_id,
    userId,
    'Test deletion',
    userContext,
  );
  assert(deletedComment.deleted_at !== null, 'deleted_at must be set');
  const commentsAfterDelete = await FeedService.listComments(draft.feed_post_id);
  assert.strictEqual(
    commentsAfterDelete.length,
    0,
    'Soft-deleted comment must be excluded from retrieval',
  );
  console.log('   ✓ Soft deleted comment excluded successfully');

  // 10. React to post (Section 8.2)
  console.log('10. Testing React to Post...');
  const reaction = await FeedService.reactToPost(
    orgId,
    draft.feed_post_id,
    userId,
    catalogue[0].reaction_type_id,
  );
  assert(reaction.feed_post_reaction_id !== undefined, 'Reaction must be created');
  console.log(`   ✓ Reaction recorded: ${reaction.reaction_type_id}`);

  // 11. Change reaction (upsert)
  console.log('11. Testing Change Reaction (Upsert)...');
  const changedReaction = await FeedService.reactToPost(
    orgId,
    draft.feed_post_id,
    userId,
    catalogue[1].reaction_type_id,
  );
  assert.strictEqual(
    changedReaction.feed_post_reaction_id,
    reaction.feed_post_reaction_id,
    'Should update same row',
  );
  console.log(`   ✓ Reaction changed to: ${changedReaction.reaction_type_id}`);

  // 12. Remove reaction (Section 8.3)
  console.log('12. Testing Remove Reaction...');
  await FeedService.removeReaction(draft.feed_post_id, userId);
  console.log('   ✓ Reaction removed successfully');

  // 13. Soft-remove announcement (Section 5.4)
  console.log('13. Testing Soft Remove Announcement...');
  const removed = await FeedService.removePost(orgId, draft.feed_post_id, userId, userContext);
  assert.strictEqual(removed.status, 'removed', 'Post status must be removed');
  assert(removed.removed_at !== null, 'removed_at must be set');
  assert.strictEqual(removed.removed_by_user_id, userId, 'removed_by_user_id must match');
  console.log('   ✓ Announcement removed successfully');

  console.log('\n=====================================================');
  console.log('   ALL C2 SPECIFICATION TESTS PASSED SUCCESSFULLY!    ');
  console.log('=====================================================\n');
}

if (require.main === module) {
  runC2Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
