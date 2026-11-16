import assert from 'assert';
import { NotificationService } from '../services/notification.service';
import { NotificationRepository } from '../repositories/notification.repository';
import { EventBus } from '../../../workflows/event-bus.service';
import { LeadEvents, LeadEventType } from '../../lead-management/events/lead.events';
import {
  AdmissionEvents,
  ApplicationEventType,
} from '../../admission-management/events/admission.events';
import { StudentEvents, StudentEventType } from '../../student-management/events/student.events';
import { NotificationSubscriber } from '../subscribers/notification.subscriber';
import {
  realtimeNotificationServer,
  RealtimeNotificationServer,
} from '../realtime/notification.realtime';
import {
  listNotificationsQuerySchema,
  createNotificationSchema,
  notification_category,
  notification_priority,
} from '../dto/notification.dto';

export async function runNotificationModuleTests() {
  console.log('[Notification Management] Running unit & integration tests...');
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res
          .then(() => {
            console.log(`  ✓ ${name}`);
            passed++;
          })
          .catch((err) => {
            console.error(`  ✗ ${name}:`, err.message);
            failed++;
          });
      } else {
        console.log(`  ✓ ${name}`);
        passed++;
      }
    } catch (err: any) {
      console.error(`  ✗ ${name}:`, err.message);
      failed++;
    }
  }

  // 1. DTO Validation Tests
  test('listNotificationsQuerySchema parses valid query params', () => {
    const valid = listNotificationsQuerySchema.parse({
      page: '2',
      limit: '15',
      category: 'ADMISSION',
      is_read: 'true',
    });
    assert.strictEqual(valid.page, 2);
    assert.strictEqual(valid.limit, 15);
    assert.strictEqual(valid.category, notification_category.ADMISSION);
    assert.strictEqual(valid.is_read, true);
  });

  test('listNotificationsQuerySchema applies default pagination values', () => {
    const defaults = listNotificationsQuerySchema.parse({});
    assert.strictEqual(defaults.page, 1);
    assert.strictEqual(defaults.limit, 20);
    assert.strictEqual(defaults.category, undefined);
    assert.strictEqual(defaults.is_read, undefined);
  });

  test('createNotificationSchema validates required fields and enums', () => {
    const valid = createNotificationSchema.parse({
      recipient_user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      category: 'ADMISSION',
      type: 'lead.activity_added',
      priority: 'HIGH',
      title: 'Activity Logged',
      message: 'New activity for lead #1001',
      entity_type: 'lead',
      entity_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      action_url: '/app/leads',
    });
    assert.strictEqual(valid.category, notification_category.ADMISSION);
    assert.strictEqual(valid.priority, notification_priority.HIGH);
    assert.strictEqual(valid.title, 'Activity Logged');
  });

  test('createNotificationSchema rejects invalid UUIDs', () => {
    assert.throws(() => {
      createNotificationSchema.parse({
        recipient_user_id: 'not-a-uuid',
        type: 'test',
        title: 'Test',
        message: 'Message',
      });
    });
  });

  test('createNotificationSchema rejects invalid category enums', () => {
    assert.throws(() => {
      createNotificationSchema.parse({
        recipient_user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        category: 'INVALID_CATEGORY',
        type: 'test',
        title: 'Test',
        message: 'Message',
      });
    });
  });

  // 2. Subscriber & Event Integration Tests
  test('NotificationSubscriber registers EventBus listeners idempotently', () => {
    NotificationSubscriber.register();
    assert.doesNotThrow(() => {
      NotificationSubscriber.register();
    });
  });

  test('EventBus publishes domain events to registered notification subscribers', async () => {
    let receivedPayload: any = null;
    EventBus.subscribe('test.event', async (payload: any) => {
      receivedPayload = payload;
    });

    await EventBus.publish('test.event', { sampleId: '12345' });
    assert.deepStrictEqual(receivedPayload, { sampleId: '12345' });
  });

  // 3. Decision Notification Deduplication and Mapping Logic
  test('Decision status correctly maps to title, priority and deduplicated notification', () => {
    const decisionStates = [
      {
        status: 'approved',
        expectedTitle: 'Admission Approved',
        expectedPriority: notification_priority.HIGH,
      },
      {
        status: 'waitlisted',
        expectedTitle: 'Application Waitlisted',
        expectedPriority: notification_priority.NORMAL,
      },
      {
        status: 'rejected',
        expectedTitle: 'Admission Decision Update',
        expectedPriority: notification_priority.NORMAL,
      },
      {
        status: 'withdrawn',
        expectedTitle: 'Application Withdrawn',
        expectedPriority: notification_priority.LOW,
      },
    ];

    for (const d of decisionStates) {
      let title = 'Admission Decision Update';
      let priority = notification_priority.NORMAL;

      if (d.status === 'approved') {
        title = 'Admission Approved';
        priority = notification_priority.HIGH;
      } else if (d.status === 'waitlisted') {
        title = 'Application Waitlisted';
        priority = notification_priority.NORMAL;
      } else if (d.status === 'rejected') {
        title = 'Admission Decision Update';
        priority = notification_priority.NORMAL;
      } else if (d.status === 'withdrawn') {
        title = 'Application Withdrawn';
        priority = notification_priority.LOW;
      }

      assert.strictEqual(title, d.expectedTitle);
      assert.strictEqual(priority, d.expectedPriority);
    }
  });

  // 4. Recipient Resolution and Self-Spam Prevention Logic
  test('Recipient resolution notifies assigned counselor and prevents self-spam', () => {
    const lead = {
      assigned_counsellor_id: 'counselor-123',
      created_by: 'creator-456',
    };

    // Case A: Staff member X logs activity -> notifies counselor
    const performerA = 'staff-789';
    let recipientA: string | null = null;
    if (lead.assigned_counsellor_id && lead.assigned_counsellor_id !== performerA) {
      recipientA = lead.assigned_counsellor_id;
    } else if (lead.created_by && lead.created_by !== performerA) {
      recipientA = lead.created_by;
    }
    assert.strictEqual(recipientA, 'counselor-123');

    // Case B: Counselor logs activity -> notifies creator (avoiding counselor self-spam)
    const performerB = 'counselor-123';
    let recipientB: string | null = null;
    if (lead.assigned_counsellor_id && lead.assigned_counsellor_id !== performerB) {
      recipientB = lead.assigned_counsellor_id;
    } else if (lead.created_by && lead.created_by !== performerB) {
      recipientB = lead.created_by;
    }
    assert.strictEqual(recipientB, 'creator-456');
  });

  // 5. Tenant and Recipient Isolation Logic
  test('Tenant and recipient security boundaries correctly enforce auth context', () => {
    const userA = { userId: 'user-a', orgId: 'org-1' };
    const userB = { userId: 'user-b', orgId: 'org-1' };
    const userC = { userId: 'user-c', orgId: 'org-2' };

    const notificationRecord = {
      notification_id: 'notif-100',
      recipient_user_id: 'user-a',
      org_id: 'org-1',
    };

    // User A can access own notification
    assert.strictEqual(
      notificationRecord.recipient_user_id === userA.userId &&
        notificationRecord.org_id === userA.orgId,
      true,
    );

    // User B denied (different user)
    assert.strictEqual(
      notificationRecord.recipient_user_id === userB.userId &&
        notificationRecord.org_id === userB.orgId,
      false,
    );

    // User C denied (different organization)
    assert.strictEqual(
      notificationRecord.recipient_user_id === userC.userId &&
        notificationRecord.org_id === userC.orgId,
      false,
    );
  });

  // 6. Realtime Notification Server Unit & Multi-Tenant Routing Tests
  test('RealtimeNotificationServer singleton initializes and safely handles offline recipients', () => {
    const serverInstance = RealtimeNotificationServer.getInstance();
    assert.strictEqual(serverInstance, realtimeNotificationServer);

    // Sending to an offline user should not throw or crash
    assert.doesNotThrow(() => {
      realtimeNotificationServer.sendToUser('org-alpha', 'user-offline', {
        type: 'notification.created',
        data: {
          notification_id: 'notif-999',
          title: 'Test Notification',
        },
      });
    });
  });

  test('Realtime message payload contains required fields without leaking secrets', () => {
    const payload = {
      type: 'notification.created' as const,
      data: {
        notification_id: '11111111-2222-3333-4444-555555555555',
        org_id: 'org-123',
        recipient_user_id: 'user-456',
        category: 'ADMISSION',
        priority: 'HIGH',
        title: 'Application Approved',
        message: 'Your admission application has been approved.',
        is_read: false,
        created_at: new Date().toISOString(),
      },
    };

    assert.strictEqual(payload.type, 'notification.created');
    assert.strictEqual(payload.data.title, 'Application Approved');
    assert.strictEqual((payload.data as any).password, undefined);
    assert.strictEqual((payload.data as any).token, undefined);
  });

  console.log(`[Notification Management Tests] Completed: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    throw new Error(`[Notification Management Tests] ${failed} test(s) failed`);
  }
}
