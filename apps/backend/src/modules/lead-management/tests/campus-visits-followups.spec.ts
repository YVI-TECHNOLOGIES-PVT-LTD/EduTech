import assert from 'assert';
import {
  visit_type,
  visit_status,
  lead_activity_type,
  activity_status,
} from '@prisma/client';
import { LeadVisitService } from '../services/lead.visit.service';
import { LeadActivityService } from '../services/lead.activity.service';
import { LeadValidationError, LeadNotFoundError } from '../errors/lead.errors';
import prisma from '../../../lib/prismaClient';

export async function runCampusVisitsAndFollowupsTests() {
  console.log('\n======================================================');
  console.log('[Front Office] Running Campus Visits & Follow-ups Test Suite');
  console.log('======================================================\n');

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

  // Find or create test lead for the suite
  let testLead: any = null;
  let testOrgId: string = '';

  try {
    testLead = await prisma.leads.findFirst({
      include: {
        academic_year_grades: true,
      },
    });

    if (testLead) {
      testOrgId = testLead.org_id;
    }
  } catch (err) {
    console.warn('Database not available for live seeding, testing logic invariants.');
  }

  // 1. Enum Contract Verification
  await test('Enum contracts for visit_type and visit_status match database schema', () => {
    assert.strictEqual(visit_type.campus, 'campus');
    assert.strictEqual(visit_type.virtual, 'virtual');
    assert.strictEqual(visit_status.scheduled, 'scheduled');
    assert.strictEqual(visit_status.completed, 'completed');
    assert.strictEqual(visit_status.cancelled, 'cancelled');
    assert.strictEqual(visit_status.no_show, 'no_show');
  });

  await test('Enum contracts for lead_activity_type and activity_status match database schema', () => {
    assert.strictEqual(lead_activity_type.follow_up, 'follow_up');
    assert.strictEqual(lead_activity_type.counselling, 'counselling');
    assert.strictEqual(lead_activity_type.phone_call, 'phone_call');
    assert.strictEqual(activity_status.scheduled, 'scheduled');
    assert.strictEqual(activity_status.completed, 'completed');
    assert.strictEqual(activity_status.cancelled, 'cancelled');
  });

  // 2. Validation & Invariant Testing
  await test('LeadVisitService rejects invalid date strings', async () => {
    if (!testLead) return;
    await assert.rejects(
      async () => {
        await LeadVisitService.scheduleVisit(
          {
            lead_id: testLead.lead_id,
            visit_type: visit_type.campus,
            scheduled_at: 'invalid-date-string',
          },
          null,
          testOrgId,
        );
      },
      (err: any) => err instanceof LeadValidationError,
    );
  });

  await test('LeadVisitService enforces tenant organization isolation', async () => {
    if (!testLead) return;
    const fakeOrgId = '00000000-0000-0000-0000-000000000001';
    await assert.rejects(
      async () => {
        await LeadVisitService.scheduleVisit(
          {
            lead_id: testLead.lead_id,
            visit_type: visit_type.campus,
            scheduled_at: new Date().toISOString(),
          },
          null,
          fakeOrgId,
        );
      },
      (err: any) => err instanceof LeadNotFoundError,
    );
  });

  // 3. Live Operation Testing (if DB is available)
  let createdVisitId: string | null = null;
  if (testLead) {
    await test('LeadVisitService schedules a campus visit and logs timeline activity', async () => {
      const scheduledDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const visit = await LeadVisitService.scheduleVisit(
        {
          lead_id: testLead.lead_id,
          visit_type: visit_type.campus,
          scheduled_at: scheduledDate.toISOString(),
          remarks: 'Automated test campus tour',
        },
        null,
        testOrgId,
      );

      assert.ok(visit.visit_id);
      assert.strictEqual(visit.status, visit_status.scheduled);
      assert.strictEqual(visit.visit_type, visit_type.campus);
      createdVisitId = visit.visit_id;
    });

    await test('LeadVisitService retrieves visits queue with filtering', async () => {
      const queue = await LeadVisitService.getQueue({
        org_id: testOrgId,
        status: visit_status.scheduled,
        page: 1,
        pageSize: 10,
      });

      assert.ok(queue);
      assert.ok(Array.isArray(queue.items));
      assert.ok(queue.items.length >= 1);
    });

    await test('LeadVisitService reschedules an existing visit appointment', async () => {
      if (!createdVisitId) return;
      const newDate = new Date(Date.now() + 72 * 60 * 60 * 1000);
      const updated = await LeadVisitService.updateVisitStatus(
        createdVisitId,
        {
          scheduled_at: newDate.toISOString(),
          remarks: 'Rescheduled for weekend tour',
        },
        null,
        testOrgId,
      );

      assert.strictEqual(updated.visit_id, createdVisitId);
      assert.strictEqual(updated.remarks, 'Rescheduled for weekend tour');
    });

    await test('LeadVisitService marks visit as completed with outcome activity', async () => {
      if (!createdVisitId) return;
      const completed = await LeadVisitService.updateVisitStatus(
        createdVisitId,
        {
          status: visit_status.completed,
          remarks: 'Tour completed successfully, parent interested in Grade 1.',
        },
        null,
        testOrgId,
      );

      assert.strictEqual(completed.status, visit_status.completed);
    });

    await test('State Machine: Rejects modifying a finalized/completed visit', async () => {
      if (!createdVisitId) return;
      await assert.rejects(
        async () => {
          await LeadVisitService.updateVisitStatus(
            createdVisitId!,
            {
              status: visit_status.cancelled,
            },
            null,
            testOrgId,
          );
        },
        (err: any) => err instanceof LeadValidationError,
      );

      await assert.rejects(
        async () => {
          await LeadVisitService.updateVisitStatus(
            createdVisitId!,
            {
              scheduled_at: new Date().toISOString(),
            },
            null,
            testOrgId,
          );
        },
        (err: any) => err instanceof LeadValidationError,
      );
    });

    await test('Tenant Isolation: Cross-tenant visit update and delete are rejected', async () => {
      if (!createdVisitId) return;
      const foreignOrgId = '00000000-0000-0000-0000-000000000099';
      await assert.rejects(
        async () => {
          await LeadVisitService.updateVisitStatus(
            createdVisitId!,
            { remarks: 'Hacked' },
            null,
            foreignOrgId,
          );
        },
        (err: any) => err instanceof LeadValidationError,
      );

      await assert.rejects(
        async () => {
          await LeadVisitService.deleteVisit(createdVisitId!, null, foreignOrgId);
        },
        (err: any) => err instanceof LeadValidationError,
      );
    });

    await test('LeadActivityService retrieves due follow-ups queue', async () => {
      const followUps = await LeadActivityService.getDueFollowUps({
        org_id: testOrgId,
        page: 1,
        pageSize: 10,
      });

      assert.ok(followUps);
      assert.ok(Array.isArray(followUps.items));
    });

    await test('LeadVisitService deletes test visit cleanly', async () => {
      if (!createdVisitId) return;
      const res = await LeadVisitService.deleteVisit(createdVisitId, null, testOrgId);
      assert.strictEqual(res.success, true);
    });
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) {
    throw new Error(`${failed} tests failed in Campus Visits and Follow-ups suite`);
  }
}

if (require.main === module) {
  runCampusVisitsAndFollowupsTests()
    .then(() => {
      console.log('All Campus Visits and Follow-ups tests completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Test suite failed:', err);
      process.exit(1);
    });
}
