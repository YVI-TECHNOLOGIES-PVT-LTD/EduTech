import assert from 'assert';
import { FinanceEventType, FinanceEventPayload } from '../events/finance.events';
import { FinanceTemplateRenderer } from '../services/FinanceTemplateRenderer';
import { FinanceChannelAdapters } from '../services/FinanceChannelAdapters';
import { FinanceNotificationService } from '../services/FinanceNotificationService';
import { FinanceNotificationRepository } from '../repositories/FinanceNotificationRepository';
import { EventBus } from '../../../workflows/event-bus.service';

export async function runFinanceNotificationTests() {
  console.log('=====================================================');
  console.log('   FINANCE PHASE 9: NOTIFICATIONS & COMMUNICATION    ');
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

  const validTenant = '00000000-0000-0000-0000-000000000001';
  const testUserId = '00000000-0000-0000-0000-000000000099';
  const testStudentId = '11111111-1111-1111-1111-111111111111';

  // -------------------------------------------------------------------------
  // 1. Parameter Validation & Tenant Isolation
  // -------------------------------------------------------------------------
  await test('publishEvent rejects missing tenant orgId', async () => {
    await assert.rejects(async () => {
      await FinanceNotificationService.publishEvent({
        eventType: FinanceEventType.PAYMENT_SUCCESS,
        orgId: '',
        sourceEntityId: '123',
        sourceWorkflow: 'test',
        timestamp: new Date().toISOString(),
        correlationId: 'test_corr_1',
      });
    }, /Tenant organization ID is required/);
  });

  await test('publishEvent rejects missing eventType', async () => {
    await assert.rejects(async () => {
      await FinanceNotificationService.publishEvent({
        eventType: '' as any,
        orgId: validTenant,
        sourceEntityId: '123',
        sourceWorkflow: 'test',
        timestamp: new Date().toISOString(),
        correlationId: 'test_corr_2',
      });
    }, /Event type is required/);
  });

  await test('getSummary rejects missing tenant organization ID', async () => {
    await assert.rejects(async () => {
      await FinanceNotificationService.getSummary('');
    }, /Tenant organization ID is required/);
  });

  await test('getNotifications rejects missing tenant organization ID', async () => {
    await assert.rejects(async () => {
      await FinanceNotificationService.getNotifications('');
    }, /Tenant organization ID is required/);
  });

  await test('getNotificationDetail rejects missing tenant organization ID', async () => {
    await assert.rejects(async () => {
      await FinanceNotificationService.getNotificationDetail(
        '',
        '00000000-0000-0000-0000-000000000010',
      );
    }, /Tenant organization ID is required/);
  });

  // -------------------------------------------------------------------------
  // 2. Template Rendering & Security Escaping
  // -------------------------------------------------------------------------
  await test('Template renderer correctly renders allowlisted variables for payment success', () => {
    const rendered = FinanceTemplateRenderer.renderEventNotification(
      FinanceEventType.PAYMENT_SUCCESS,
      {
        studentName: 'Aarav Sharma',
        amount: 25000,
        orderReference: 'ORD_9921',
        paymentMethod: 'UPI',
        receiptNumber: 'RCP_2026_001',
      },
    );

    assert.ok(
      rendered.title.includes('₹25,000') || rendered.title.includes('25000'),
      'Title must contain formatted amount',
    );
    assert.ok(rendered.message.includes('Aarav Sharma'), 'Message must contain student name');
    assert.ok(rendered.message.includes('ORD_9921'), 'Message must contain order reference');
  });

  await test('Template renderer sanitizes HTML to prevent XSS injection', () => {
    const rendered = FinanceTemplateRenderer.renderEventNotification(FinanceEventType.FEE_OVERDUE, {
      studentName: '<script>alert("xss")</script>Rohan',
      outstandingAmount: 15000,
      daysOverdue: 14,
      dueDate: '2026-10-01',
    });

    assert.ok(!rendered.message.includes('<script>'), 'Message must not contain raw script tags');
    assert.ok(
      rendered.message.includes('&lt;script&gt;'),
      'Message must encode HTML entities safely',
    );
  });

  await test('Template renderer provides safe fallback for missing variables', () => {
    const rendered = FinanceTemplateRenderer.renderEventNotification(
      FinanceEventType.FEE_DUE_SOON,
      {},
    );

    assert.ok(rendered.title.length > 0, 'Title must not be empty');
    assert.ok(rendered.message.length > 0, 'Message must not be empty');
    assert.ok(
      !rendered.message.includes('undefined'),
      'Message must not contain literal undefined',
    );
  });

  await test('Template preview returns safe sample render without sending', () => {
    const preview = FinanceTemplateRenderer.previewTemplate('FEE_ASSESSMENT_CREATED');
    assert.ok(preview.title.length > 0, 'Preview must have title');
    assert.ok(preview.message.length > 0, 'Preview must have message');
    assert.ok(preview.variablesUsed, 'Preview must report variablesUsed');
  });

  // -------------------------------------------------------------------------
  // 3. Channel Health Probes & Provider Transparency
  // -------------------------------------------------------------------------
  await test('Channel health probe reports In-App as operational and stores persistently', () => {
    const health = FinanceChannelAdapters.getChannelHealth(validTenant);
    const inApp = health.find((h) => h.channel === 'in_app');
    assert.ok(inApp, 'In-App channel must be present');
    assert.strictEqual(inApp?.status, 'operational');
    assert.ok(
      inApp?.description.includes('operational'),
      'Description must confirm operational status',
    );
  });

  await test('Channel health probe truthfully identifies missing SMS credentials without mock deception', () => {
    const health = FinanceChannelAdapters.getChannelHealth(validTenant);
    const sms = health.find((h) => h.channel === 'sms');
    assert.ok(sms, 'SMS channel must be reported in health list');
    // If TWILIO_ACCOUNT_SID not set, it should report missing_credentials
    if (!process.env.TWILIO_ACCOUNT_SID) {
      assert.strictEqual(sms?.status, 'missing_credentials');
    }
  });

  // -------------------------------------------------------------------------
  // 4. Batch Reminder Financial Invariants (Filtering)
  // -------------------------------------------------------------------------
  await test('sendBatchReminders dry run returns preview without dispatching', async () => {
    const result = await FinanceNotificationService.sendBatchReminders(validTenant, testUserId, {
      reminderType: 'overdue',
      dryRun: true,
    });

    assert.strictEqual(result.dispatchedCount, 0, 'Dry run must not dispatch notifications');
    assert.ok(result.totalEligible >= 0, 'Total eligible must be non-negative integer');
    assert.ok(Array.isArray(result.previewSummary), 'Preview summary must be an array');
  });

  // -------------------------------------------------------------------------
  // 5. Retry Mechanism & Safe 404 / 400 / 409 Guards
  // -------------------------------------------------------------------------
  await test('retryNotification safely fails when notification record does not exist', async () => {
    await assert.rejects(async () => {
      await FinanceNotificationService.retryNotification(
        validTenant,
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
        'in_app',
      );
    }, /Notification record not found/);
  });

  await test('retryNotification rejects unsupported delivery channel with 400 error', async () => {
    await assert.rejects(async () => {
      await FinanceNotificationService.retryNotification(
        validTenant,
        '00000000-0000-0000-0000-000000000001',
        'carrier_pigeon' as any,
      );
    }, /Unsupported retry channel/);
  });

  await test('retryNotification blocks redundant retry when notification is already delivered (HTTP 409 guard)', async () => {
    const origFindById = FinanceNotificationRepository.findById;
    try {
      FinanceNotificationRepository.findById = (async () => ({
        notification_id: '11111111-2222-3333-4444-555555555555',
        org_id: validTenant,
        recipient_user_id: testUserId,
        category: 'FEE',
        type: 'fee.payment.success',
        priority: 'normal',
        title: 'Payment Confirmed',
        message: 'Payment received',
        entity_type: null,
        entity_id: null,
        action_url: null,
        is_read: false,
        read_at: null,
        metadata: { delivery_status: 'delivered', channel: 'in_app' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })) as any;

      await assert.rejects(async () => {
        await FinanceNotificationService.retryNotification(
          validTenant,
          '11111111-2222-3333-4444-555555555555',
          'in_app',
        );
      }, /Notification delivery is already confirmed; redundant retry is blocked/);
    } finally {
      FinanceNotificationRepository.findById = origFindById;
    }
  });

  // -------------------------------------------------------------------------
  // 6. EventBus Reliability, Deduplication & Error Isolation
  // -------------------------------------------------------------------------
  await test('EventBus subscribes and executes handlers asynchronously', async () => {
    let handled = false;
    const testEvent = 'TEST_ASYNC_EVENT';
    const handler = async () => {
      handled = true;
    };
    EventBus.subscribe(testEvent, handler);
    await EventBus.publish(testEvent, { sample: 123 });
    assert.strictEqual(handled, true, 'Handler should be invoked');
    EventBus.clearListeners(testEvent);
  });

  await test('EventBus deduplicates identical listener subscriptions', async () => {
    let executionCount = 0;
    const testEvent = 'TEST_DEDUP_EVENT';
    const dedupHandler = async () => {
      executionCount++;
    };

    // Subscribing the same function twice
    EventBus.subscribe(testEvent, dedupHandler);
    EventBus.subscribe(testEvent, dedupHandler);

    await EventBus.publish(testEvent, { foo: 'bar' });
    assert.strictEqual(
      executionCount,
      1,
      'Duplicate handler subscription should only execute once',
    );
    EventBus.clearListeners(testEvent);
  });

  await test('EventBus isolates subscriber errors to prevent cascading failure', async () => {
    const testEvent = 'TEST_ERROR_ISOLATION_EVENT';
    let survivingHandlerExecuted = false;

    const failingHandler = async () => {
      throw new Error('Subscriber internal failure');
    };
    const healthyHandler = async () => {
      survivingHandlerExecuted = true;
    };

    EventBus.subscribe(testEvent, failingHandler);
    EventBus.subscribe(testEvent, healthyHandler);

    // Publishing should not throw or reject
    await EventBus.publish(testEvent, { test: true });
    assert.strictEqual(
      survivingHandlerExecuted,
      true,
      'Healthy handler must execute despite failing peer handler',
    );
    EventBus.clearListeners(testEvent);
  });

  await test('EventBus supports unsubscribe and clearListeners correctly', async () => {
    const testEvent = 'TEST_UNSUB_EVENT';
    let ran = false;
    const handler = async () => {
      ran = true;
    };

    EventBus.subscribe(testEvent, handler);
    EventBus.unsubscribe(testEvent, handler);
    await EventBus.publish(testEvent, {});
    assert.strictEqual(ran, false, 'Unsubscribed handler should not execute');

    EventBus.subscribe(testEvent, handler);
    EventBus.clearListeners(testEvent);
    await EventBus.publish(testEvent, {});
    assert.strictEqual(ran, false, 'Handler should not execute after clearListeners');
  });

  // -------------------------------------------------------------------------
  // 7. Advanced Template Safety & Numerical Formatting
  // -------------------------------------------------------------------------
  await test('Template renderer formats localized dates cleanly for due dates', () => {
    const rendered = FinanceTemplateRenderer.renderEventNotification(
      FinanceEventType.FEE_DUE_SOON,
      {
        studentName: 'Sneha Rao',
        dueDate: '2026-11-20T00:00:00.000Z',
        outstandingAmount: 8500,
      },
    );

    assert.ok(
      rendered.message.includes('2026') ||
        rendered.message.includes('Nov') ||
        rendered.message.includes('20'),
      'Message must contain formatted date',
    );
    assert.ok(!rendered.message.includes('NaN'), 'Formatted date must not produce NaN');
  });

  await test('Template renderer guards currency formatting against NaN and invalid numbers', () => {
    const renderedNaN = FinanceTemplateRenderer.renderEventNotification(
      FinanceEventType.PAYMENT_SUCCESS,
      {
        studentName: 'Karan',
        amount: 'invalid_number' as any,
      },
    );

    assert.ok(
      !renderedNaN.message.includes('NaN'),
      'Currency fallback must never render literal NaN',
    );
    assert.ok(renderedNaN.message.includes('₹0'), 'Invalid amount must fallback to ₹0 safely');
  });

  await test('Template renderer thoroughly escapes all HTML control characters', () => {
    const rendered = FinanceTemplateRenderer.renderEventNotification(
      FinanceEventType.PAYMENT_SUCCESS,
      {
        studentName: 'Alice & Bob "Junior" <script> \'test\'',
        amount: 5000,
      },
    );

    assert.ok(!rendered.message.includes('<script>'), 'Must not contain raw <script>');
    assert.ok(rendered.message.includes('&amp;'), 'Must encode ampersand');
    assert.ok(rendered.message.includes('&lt;script&gt;'), 'Must encode tags');
    assert.ok(rendered.message.includes('&quot;'), 'Must encode double quotes');
    assert.ok(rendered.message.includes('&#39;'), 'Must encode single quotes');
  });

  // -------------------------------------------------------------------------
  // 8. Financial Invariants & Authoritative Event Payload Contract
  // -------------------------------------------------------------------------
  await test('FinanceEventType catalog comprehensively defines all required lifecycle events', () => {
    const expectedEvents = [
      FinanceEventType.FEE_ASSESSMENT_CREATED,
      FinanceEventType.FEE_DUE_SOON,
      FinanceEventType.FEE_OVERDUE,
      FinanceEventType.PAYMENT_INITIATED,
      FinanceEventType.PAYMENT_SUCCESS,
      FinanceEventType.PAYMENT_FAILED,
      FinanceEventType.PAYMENT_RECEIPT_AVAILABLE,
      FinanceEventType.CONCESSION_SUBMITTED,
      FinanceEventType.CONCESSION_APPROVED,
      FinanceEventType.CONCESSION_REJECTED,
      FinanceEventType.CONCESSION_APPLIED,
      FinanceEventType.COLLECTION_FOLLOW_UP_REQUIRED,
    ];

    for (const evt of expectedEvents) {
      assert.ok(typeof evt === 'string' && evt.length > 0, `Event ${evt} must be defined string`);
    }
  });

  await test('FinanceNotificationService.getTemplates returns comprehensive template contracts with allowlistedVariables', () => {
    const templates = FinanceNotificationService.getTemplates();
    assert.ok(Array.isArray(templates), 'Templates must be an array');
    assert.ok(templates.length >= 12, 'Must include at least 12 finance notification templates');

    for (const tpl of templates) {
      assert.ok(tpl.id && typeof tpl.id === 'string', `Template ${tpl.key} must provide id`);
      assert.ok(tpl.name && typeof tpl.name === 'string', `Template ${tpl.key} must provide name`);
      assert.ok(
        tpl.eventType && typeof tpl.eventType === 'string',
        `Template ${tpl.key} must provide eventType`,
      );
      assert.ok(
        tpl.titleTemplate && typeof tpl.titleTemplate === 'string',
        `Template ${tpl.key} must provide titleTemplate`,
      );
      assert.ok(
        tpl.bodyTemplate && typeof tpl.bodyTemplate === 'string',
        `Template ${tpl.key} must provide bodyTemplate`,
      );
      assert.ok(
        tpl.messageTemplate && typeof tpl.messageTemplate === 'string',
        `Template ${tpl.key} must provide messageTemplate`,
      );
      assert.ok(
        Array.isArray(tpl.supportedChannels),
        `Template ${tpl.key} supportedChannels must be array`,
      );
      assert.ok(
        Array.isArray(tpl.allowlistedVariables),
        `Template ${tpl.key} allowlistedVariables must be array`,
      );
      assert.ok(
        tpl.allowlistedVariables.length > 0,
        `Template ${tpl.key} must expose allowlistedVariables`,
      );
    }
  });

  console.log(`\nFinance Notification tests complete: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    throw new Error(`${failed} notification tests failed!`);
  }
}

if (require.main === module) {
  runFinanceNotificationTests().catch((err) => {
    console.error('Test execution error:', err);
    process.exit(1);
  });
}
