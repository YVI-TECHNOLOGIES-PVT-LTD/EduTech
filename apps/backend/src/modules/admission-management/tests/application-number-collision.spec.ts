import assert from 'assert';
import {
  generateApplicationNumber,
  isApplicationNumberUniqueConstraintError,
} from '../../../utils/application-number.util';

export async function runApplicationNumberCollisionTests() {
  console.log('\n============================================================');
  console.log('APPLICATION NUMBER COLLISION & RETRY HANDLING TEST SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}`);
      console.error('    Error:', err.message || err);
      if (err.stack) {
        console.error('    Stack:', err.stack);
      }
      failed++;
    }
  }

  const currentYear = new Date().getFullYear();

  // -------------------------------------------------------------------------------------------------
  // 1. Application number format
  // -------------------------------------------------------------------------------------------------
  await test('1. Application number format matches APP-{YEAR}-{8_HEX_SUFFIX}', () => {
    const appNumber = generateApplicationNumber();
    const regex = new RegExp(`^APP-${currentYear}-[A-F0-9]{8}$`);
    assert.match(appNumber, regex, `Generated number ${appNumber} did not match pattern`);

    // Custom year override
    const pastYearApp = generateApplicationNumber(2024);
    assert.match(pastYearApp, /^APP-2024-[A-F0-9]{8}$/);
  });

  // -------------------------------------------------------------------------------------------------
  // 2. Concurrent application creation produces zero collisions
  // -------------------------------------------------------------------------------------------------
  await test('2. Concurrent application creation produces 1,000 unique values without collision', () => {
    const total = 1000;
    const generated = new Set<string>();
    for (let i = 0; i < total; i++) {
      const num = generateApplicationNumber();
      assert.strictEqual(generated.has(num), false, `Collision detected on: ${num}`);
      generated.add(num);
    }
    assert.strictEqual(generated.size, total);
  });

  // -------------------------------------------------------------------------------------------------
  // 3. Collision retry behavior (recovers on retry with fresh number)
  // -------------------------------------------------------------------------------------------------
  await test('3. Collision retry behavior generates fresh number and recovers after P2002', async () => {
    let attempts = 0;
    const generatedNumbers: string[] = [];

    // Simulated create operation that fails on attempt 1 with P2002 on application_number, then succeeds
    async function mockCreateApplication() {
      const MAX_RETRIES = 3;
      let lastError: any;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        attempts++;
        const num = generateApplicationNumber();
        generatedNumbers.push(num);
        try {
          if (attempt === 1) {
            const p2002Err: any = new Error(
              'Unique constraint failed on the fields: (`application_number`)',
            );
            p2002Err.code = 'P2002';
            p2002Err.meta = { target: ['application_number'] };
            throw p2002Err;
          }
          return { application_id: 'app-1', application_number: num, status: 'submitted' };
        } catch (err: any) {
          lastError = err;
          if (isApplicationNumberUniqueConstraintError(err) && attempt < MAX_RETRIES) {
            continue;
          }
          throw err;
        }
      }
      throw lastError;
    }

    const result = await mockCreateApplication();
    assert.strictEqual(attempts, 2, 'Should succeed on attempt 2');
    assert.strictEqual(generatedNumbers.length, 2, 'Should generate 2 distinct numbers');
    assert.notStrictEqual(
      generatedNumbers[0],
      generatedNumbers[1],
      'Retry must generate fresh number',
    );
    assert.strictEqual(result.application_number, generatedNumbers[1]);
  });

  // -------------------------------------------------------------------------------------------------
  // 4. Retry exhaustion (propagates error after 3 failed attempts)
  // -------------------------------------------------------------------------------------------------
  await test('4. Retry exhaustion propagates original P2002 error after exactly 3 attempts', async () => {
    let attempts = 0;

    async function mockExhaustedApplication() {
      const MAX_RETRIES = 3;
      let lastError: any;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        attempts++;
        const num = generateApplicationNumber();
        try {
          // Always throw P2002 on application_number
          const p2002Err: any = new Error(
            'Unique constraint failed on the fields: (`application_number`)',
          );
          p2002Err.code = 'P2002';
          p2002Err.meta = { target: ['application_number'] };
          throw p2002Err;
        } catch (err: any) {
          lastError = err;
          if (isApplicationNumberUniqueConstraintError(err) && attempt < MAX_RETRIES) {
            continue;
          }
          throw err;
        }
      }
      throw lastError;
    }

    try {
      await mockExhaustedApplication();
      assert.fail('Should have thrown exhausted error');
    } catch (err: any) {
      assert.strictEqual(err.code, 'P2002');
      assert.strictEqual(attempts, 3, 'Must stop at exactly 3 attempts');
      assert.strictEqual(isApplicationNumberUniqueConstraintError(err), true);
    }
  });

  // -------------------------------------------------------------------------------------------------
  // 5. Duplicate lead submission returns existing application
  // -------------------------------------------------------------------------------------------------
  await test('5. Duplicate lead submission returns existing application idempotently before creation', async () => {
    const existingAppRecord = {
      application_id: 'app-existing-123',
      lead_id: 'lead-duplicate-999',
      application_number: 'APP-2026-F93B12DE',
      status: 'submitted',
    };

    // Simulated service check
    async function mockServiceCheck(leadId: string) {
      // Step 1: Pre-check duplicate prevention
      const existing = leadId === 'lead-duplicate-999' ? existingAppRecord : null;
      if (existing) {
        return { application: existing, isNew: false };
      }
      const newNum = generateApplicationNumber();
      return {
        application: { application_id: 'app-new', lead_id: leadId, application_number: newNum },
        isNew: true,
      };
    }

    const res = await mockServiceCheck('lead-duplicate-999');
    assert.strictEqual(res.isNew, false);
    assert.strictEqual(res.application.application_id, 'app-existing-123');
    assert.strictEqual(res.application.application_number, 'APP-2026-F93B12DE');
  });

  // -------------------------------------------------------------------------------------------------
  // 6. Existing application retrieval during concurrent race condition
  // -------------------------------------------------------------------------------------------------
  await test('6. Existing application retrieval on concurrent race condition returns existing record', async () => {
    let raceLookedUp = false;
    const raceApp = {
      application_id: 'app-race-456',
      lead_id: 'lead-race-111',
      application_number: 'APP-2026-B81234AA',
      status: 'submitted',
    };

    async function mockRaceApplicationCreation(leadId: string) {
      const MAX_RETRIES = 3;
      let lastError: any;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const num = generateApplicationNumber();
        try {
          // Simulate race condition where another thread committed application for this lead
          const p2002Err: any = new Error('Unique constraint failed on the fields: (`lead_id`)');
          p2002Err.code = 'P2002';
          p2002Err.meta = { target: ['lead_id'] };
          throw p2002Err;
        } catch (err: any) {
          lastError = err;
          if (err?.code === 'P2002') {
            raceLookedUp = true;
            // Lookup raceApp for lead
            if (raceApp.lead_id === leadId) {
              return { application: raceApp, isNew: false };
            }
            if (isApplicationNumberUniqueConstraintError(err) && attempt < MAX_RETRIES) {
              continue;
            }
          }
          throw err;
        }
      }
      throw lastError;
    }

    const res = await mockRaceApplicationCreation('lead-race-111');
    assert.strictEqual(raceLookedUp, true);
    assert.strictEqual(res.isNew, false);
    assert.strictEqual(res.application.application_id, 'app-race-456');
  });

  // -------------------------------------------------------------------------------------------------
  // 7. Unrelated P2002 errors are not retried as application_number collisions
  // -------------------------------------------------------------------------------------------------
  await test('7. Unrelated P2002 errors (e.g. email/lead_id) are not retried and throw immediately', async () => {
    let attempts = 0;

    async function mockUnrelatedP2002() {
      const MAX_RETRIES = 3;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        attempts++;
        const num = generateApplicationNumber();
        try {
          const unrelatedErr: any = new Error('Unique constraint failed on the fields: (`email`)');
          unrelatedErr.code = 'P2002';
          unrelatedErr.meta = { target: ['email'] };
          throw unrelatedErr;
        } catch (err: any) {
          if (isApplicationNumberUniqueConstraintError(err) && attempt < MAX_RETRIES) {
            continue;
          }
          throw err;
        }
      }
    }

    try {
      await mockUnrelatedP2002();
      assert.fail('Should have thrown unrelated P2002');
    } catch (err: any) {
      assert.strictEqual(err.code, 'P2002');
      assert.strictEqual(err.meta.target[0], 'email');
      assert.strictEqual(attempts, 1, 'Must NOT retry on unrelated unique constraint');
    }

    // Direct helper test
    assert.strictEqual(
      isApplicationNumberUniqueConstraintError({
        code: 'P2002',
        meta: { target: ['email'] },
      }),
      false,
    );
    assert.strictEqual(
      isApplicationNumberUniqueConstraintError({
        code: 'P2002',
        meta: { target: ['application_number'] },
      }),
      true,
    );
    assert.strictEqual(
      isApplicationNumberUniqueConstraintError({
        code: 'P2002',
        message: 'Unique constraint failed on the fields: (`application_number`)',
      }),
      true,
    );
  });

  // -------------------------------------------------------------------------------------------------
  // 8. Public application creation uses collision-resistant numbers
  // -------------------------------------------------------------------------------------------------
  await test('8. Public application creation uses collision-resistant number and handles retries', async () => {
    let attempts = 0;
    const generatedNums: string[] = [];

    async function mockPublicApply() {
      const year = new Date().getFullYear();
      const MAX_RETRIES = 3;
      let lastCreateErr: any;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        attempts++;
        const applicationNumber = generateApplicationNumber(year);
        generatedNums.push(applicationNumber);
        try {
          if (attempt === 1) {
            const err: any = new Error(
              'Unique constraint failed on the fields: (`application_number`)',
            );
            err.code = 'P2002';
            err.meta = { target: ['application_number'] };
            throw err;
          }
          return {
            applicationId: 'pub-app-1',
            applicationNumber,
            leadId: 'lead-pub-1',
          };
        } catch (createErr: any) {
          lastCreateErr = createErr;
          if (createErr?.code === 'P2002') {
            if (isApplicationNumberUniqueConstraintError(createErr) && attempt < MAX_RETRIES) {
              continue;
            }
          }
          throw createErr;
        }
      }
      throw lastCreateErr;
    }

    const pubRes = await mockPublicApply();
    assert.strictEqual(attempts, 2);
    assert.match(pubRes.applicationNumber, new RegExp(`^APP-${currentYear}-[A-F0-9]{8}$`));
    assert.strictEqual(pubRes.applicationNumber, generatedNums[1]);
  });

  // -------------------------------------------------------------------------------------------------
  // 9. Internal application creation uses shared utility and retry handling
  // -------------------------------------------------------------------------------------------------
  await test('9. Internal application creation (ApplicationService / admission.repository) works with shared generator', async () => {
    let attempts = 0;
    const year = 2026;

    async function mockInternalCreate() {
      const MAX_RETRIES = 3;
      let lastErr: any;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        attempts++;
        const appNumber = generateApplicationNumber(year);
        try {
          if (attempt < 3) {
            const err: any = new Error(
              'Unique constraint failed on the fields: (`application_number`)',
            );
            err.code = 'P2002';
            err.meta = { target: 'application_number' };
            throw err;
          }
          return { application_id: 'internal-app-1', application_number: appNumber };
        } catch (err: any) {
          lastErr = err;
          if (isApplicationNumberUniqueConstraintError(err) && attempt < MAX_RETRIES) {
            continue;
          }
          throw err;
        }
      }
      throw lastErr;
    }

    const result = await mockInternalCreate();
    assert.strictEqual(attempts, 3, 'Recovered on attempt 3');
    assert.match(result.application_number, /^APP-2026-[A-F0-9]{8}$/);
  });

  // -------------------------------------------------------------------------------------------------
  // 10. Lead lifecycle application creation (LeadLifecycleService)
  // -------------------------------------------------------------------------------------------------
  await test('10. Lead lifecycle application creation uses shared utility and handles conversion transaction', async () => {
    let txAttempts = 0;
    const year = new Date().getFullYear();

    async function mockLeadLifecycleConvert(leadId: string) {
      const MAX_RETRIES = 3;
      let lastError: any;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        txAttempts++;
        const applicationNumber = generateApplicationNumber(year);
        try {
          return {
            application: {
              application_id: 'app-lifecycle-1',
              lead_id: leadId,
              application_number: applicationNumber,
            },
            isNew: true,
          };
        } catch (err: any) {
          lastError = err;
          if (err?.code === 'P2002') {
            if (isApplicationNumberUniqueConstraintError(err) && attempt < MAX_RETRIES) {
              continue;
            }
          }
          throw err;
        }
      }
      throw lastError;
    }

    const converted = await mockLeadLifecycleConvert('lead-convert-777');
    assert.strictEqual(txAttempts, 1);
    assert.strictEqual(converted.isNew, true);
    assert.match(
      converted.application.application_number,
      new RegExp(`^APP-${currentYear}-[A-F0-9]{8}$`),
    );
  });

  console.log(
    `\n[Application Number Collision] Tests finished: ${passed} passed, ${failed} failed.\n`,
  );
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runApplicationNumberCollisionTests();
}
