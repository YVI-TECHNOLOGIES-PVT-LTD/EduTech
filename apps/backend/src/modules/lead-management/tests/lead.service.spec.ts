import assert from 'assert';
import { lead_stage } from '@prisma/client';
import { LeadService } from '../services/lead.service';
import { LeadValidator } from '../validators/lead.validator';
import { InvalidLeadStatusTransitionError } from '../errors/lead.errors';

export async function runLeadModuleTests() {
  console.log('[Lead Management] Running unit tests...');
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}: ${err.message}`);
      failed++;
    }
  }

  // 1. Validator tests
  test('LeadValidator allows valid stage transitions', () => {
    LeadValidator.validateStatusTransition(lead_stage.enquiry_received, lead_stage.qualified);
    LeadValidator.validateStatusTransition(lead_stage.qualified, lead_stage.application_submitted);
  });

  test('LeadValidator rejects invalid stage transitions', () => {
    assert.throws(
      () => LeadValidator.validateStatusTransition(lead_stage.enrolled, lead_stage.enquiry_received),
      InvalidLeadStatusTransitionError
    );
  });

  test('LeadValidator requires remarks/reason for REJECTED stage', () => {
    assert.throws(
      () => LeadValidator.validateStatusTransition(lead_stage.enquiry_received, lead_stage.rejected, ''),
      Error
    );
  });

  // 2. Duplicate helper tests
  test('LeadService checkDuplicates helper returns payload', async () => {
    const res = await LeadService.checkDuplicates('0000000000');
    assert.strictEqual(typeof res.isDuplicate, 'boolean');
  });

  console.log(`[Lead Management] Tests finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runLeadModuleTests();
}
