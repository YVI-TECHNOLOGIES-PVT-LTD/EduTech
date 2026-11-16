import assert from 'assert';
import { SettingsService } from '../services/SettingsService';
import prisma from '../../../lib/prismaClient';

export async function runFinanceConfigurationTests() {
  console.log('=====================================================');
  console.log('   FINANCE PHASE 2: CONFIGURATION TEST SUITE         ');
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

  // Find or use a test organization
  let testOrg: any = null;
  try {
    testOrg = await prisma.organizations.findFirst({
      where: { status: 'active' },
    });
  } catch {
    // Database might not be reachable or empty
  }

  const fallbackOrgId = testOrg?.org_id || '00000000-0000-0000-0000-000000000001';

  // 1. Sanitized Razorpay Status Tests
  await test('Razorpay status returns sanitized data without leaking secrets', () => {
    const status = SettingsService.getRazorpayStatus();
    assert.strictEqual(status.name, 'Razorpay');
    assert.ok(['CONFIGURED', 'NOT_CONFIGURED', 'PARTIALLY_CONFIGURED'].includes(status.status));
    assert.ok(['test', 'live', 'unknown'].includes(status.environment_mode));
    assert.strictEqual(typeof status.key_id_configured, 'boolean');
    assert.strictEqual(typeof status.key_secret_configured, 'boolean');
    assert.strictEqual(typeof status.webhook_secret_configured, 'boolean');

    // CRITICAL: Ensure NO credentials or secrets exist on the status object
    const statusObj = status as any;
    assert.strictEqual(statusObj.key_secret, undefined);
    assert.strictEqual(statusObj.webhook_secret, undefined);
    assert.strictEqual(statusObj.secret, undefined);
    assert.strictEqual(statusObj.RAZORPAY_KEY_SECRET, undefined);
  });

  // 2. Safe Gateway Connection Probe Tests
  await test('Razorpay connection probe is safe and non-transactional', async () => {
    const result = await SettingsService.testRazorpayConnection();
    assert.strictEqual(typeof result.success, 'boolean');
    assert.ok(['SUCCESS', 'FAILED', 'NOT_CONFIGURED'].includes(result.status));
    assert.strictEqual(typeof result.message, 'string');
    assert.strictEqual(typeof result.timestamp, 'string');

    // Confirm no secrets leaked in probe result
    const resultObj = result as any;
    assert.strictEqual(resultObj.key_secret, undefined);
    assert.strictEqual(resultObj.secret, undefined);
  });

  // 3. Validation and Allowlist Tests
  await test('updateConfiguration rejects empty payloads', async () => {
    await assert.rejects(
      async () => {
        await SettingsService.updateConfiguration(fallbackOrgId, 'user-1', {});
      },
      /No valid editable fields were provided/
    );
  });

  await test('updateConfiguration rejects immutable fields (mass assignment prevention)', async () => {
    const immutableFields = ['org_id', 'org_code', 'org_name', 'status', 'currency', 'key_secret', 'created_by'];

    for (const field of immutableFields) {
      await assert.rejects(
        async () => {
          await SettingsService.updateConfiguration(fallbackOrgId, 'user-1', {
            [field]: 'tampered-value',
            board_affiliation: 'CBSE',
          });
        },
        new RegExp(`Field '${field}' is immutable and cannot be updated`)
      );
    }
  });

  await test('updateConfiguration validates phone number format', async () => {
    await assert.rejects(
      async () => {
        await SettingsService.updateConfiguration(fallbackOrgId, 'user-1', {
          phone: '12', // Too short
        });
      },
      /Phone number must be between 5 and 20 characters/
    );
  });

  await test('updateConfiguration validates email format', async () => {
    await assert.rejects(
      async () => {
        await SettingsService.updateConfiguration(fallbackOrgId, 'user-1', {
          email: 'invalid-email-format',
        });
      },
      /A valid email address is required/
    );
  });

  await test('updateConfiguration validates payment window range', async () => {
    await assert.rejects(
      async () => {
        await SettingsService.updateConfiguration(fallbackOrgId, 'user-1', {
          default_payment_window_days: -5,
        });
      },
      /Default payment window must be between 1 and 365 days/
    );

    await assert.rejects(
      async () => {
        await SettingsService.updateConfiguration(fallbackOrgId, 'user-1', {
          default_payment_window_days: 1000,
        });
      },
      /Default payment window must be between 1 and 365 days/
    );
  });

  await test('Missing tenant context raises error', async () => {
    await assert.rejects(
      async () => {
        await SettingsService.getConfiguration('');
      },
      /Tenant organization ID is required/
    );

    await assert.rejects(
      async () => {
        await SettingsService.updateConfiguration('', 'user-1', { board_affiliation: 'ICSE' });
      },
      /Tenant organization ID is required/
    );
  });

  // 4. Database-backed tests if testOrg exists
  if (testOrg) {
    await test('getConfiguration loads verified organization context and currency', async () => {
      const config = await SettingsService.getConfiguration(testOrg.org_id);
      assert.strictEqual(config.organization.org_id, testOrg.org_id);
      assert.strictEqual(config.organization.org_name, testOrg.org_name);
      assert.strictEqual(config.currency.code, 'INR');
      assert.strictEqual(config.currency.symbol, '₹');
      assert.strictEqual(config.currency.is_editable, false);
      assert.strictEqual(config.receipts.prefix, 'RCPT');
      assert.strictEqual(config.receipts.is_sequence_editable, false);
      assert.ok(Array.isArray(config.payment_methods));
      assert.ok(config.payment_methods.some((m) => m.code === 'upi'));
      assert.ok(config.payment_methods.some((m) => m.code === 'cash'));
      assert.ok(config.payment_methods.some((m) => m.code === 'card'));
      assert.ok(Array.isArray(config.schema_limitations));
    });

    await test('updateConfiguration correctly updates allowlisted fields', async () => {
      const originalAffiliation = testOrg.board_affiliation || '';
      const testAffiliation = 'CBSE-Affiliated-2026';

      const updated = await SettingsService.updateConfiguration(testOrg.org_id, 'test-user', {
        board_affiliation: testAffiliation,
        receipt_footer: 'Official school receipt note',
        default_payment_window_days: 45,
      });

      assert.strictEqual(updated.organization.board_affiliation, testAffiliation);
      assert.strictEqual(updated.receipts.footer_note, 'Official school receipt note');
      assert.strictEqual(updated.demands.default_payment_window_days, 45);

      // Restore
      await SettingsService.updateConfiguration(testOrg.org_id, 'test-user', {
        board_affiliation: originalAffiliation,
      });
    });

    await test('Cross-tenant isolation: non-existent tenant throws', async () => {
      await assert.rejects(
        async () => {
          await SettingsService.getConfiguration('00000000-0000-0000-0000-999999999999');
        },
        /Organization record not found/
      );
    });
  }

  // 5. Backward Compatibility Tests
  await test('Legacy getSettings / upsertSettings fallback gracefully', async () => {
    const legacy = await SettingsService.getSettings(fallbackOrgId);
    assert.ok(legacy);
    assert.strictEqual(legacy.currency, 'INR');
    assert.strictEqual(legacy.receipt_prefix, 'RCPT');
    assert.strictEqual(legacy.demand_prefix, 'DEM');
  });

  console.log(`\nFinance Phase 2 tests complete: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    throw new Error(`${failed} Finance Phase 2 tests failed!`);
  }
}

if (require.main === module) {
  runFinanceConfigurationTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Test execution failed:', err);
      process.exit(1);
    });
}
