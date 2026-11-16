import assert from 'assert';
import {
  lead_stage,
  lead_source,
  lead_priority,
  lead_activity_type,
  activity_status,
  visit_type,
  visit_status,
} from '@prisma/client';
import { LeadService } from '../services/lead.service';
import { LeadValidator } from '../validators/lead.validator';
import { InvalidLeadStatusTransitionError, LeadValidationError } from '../errors/lead.errors';
import { createLeadSchema } from '../dto/request/create-lead.dto';
import { searchLeadSchema } from '../dto/request/search-lead.dto';
import { createActivitySchema } from '../dto/request/create-activity.dto';

export async function runLeadModuleTests() {
  console.log('[Lead Management] Running unit tests...');
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

  // 1. Validator tests
  await test('LeadValidator allows valid stage transitions', () => {
    LeadValidator.validateStatusTransition(lead_stage.enquiry_received, lead_stage.qualified);
    LeadValidator.validateStatusTransition(lead_stage.qualified, lead_stage.application_submitted);
  });

  await test('LeadValidator rejects invalid stage transitions', () => {
    assert.throws(
      () =>
        LeadValidator.validateStatusTransition(lead_stage.enrolled, lead_stage.enquiry_received),
      InvalidLeadStatusTransitionError,
    );
  });

  await test('LeadValidator requires remarks/reason for REJECTED stage', () => {
    assert.throws(
      () =>
        LeadValidator.validateStatusTransition(
          lead_stage.enquiry_received,
          lead_stage.rejected,
          '',
        ),
      Error,
    );
  });

  await test('createLeadSchema validates required fields', () => {
    const valid = createLeadSchema.safeParse({
      org_id: 'a0000000-0000-0000-0000-000000000001',
      academic_year_grade_id: 'a0000000-0000-0000-0000-000000000002',
      student_first_name: 'John',
      student_last_name: 'Doe',
      contact_name: 'Jane Doe',
      contact_phone: '+919876543210',
      contact_email: 'jane@example.com',
      source: lead_source.walk_in,
      stage: lead_stage.enquiry_received,
      priority: lead_priority.high,
    });
    assert.strictEqual(valid.success, true);

    const invalid = createLeadSchema.safeParse({
      student_first_name: '',
      contact_phone: '12',
    });
    assert.strictEqual(invalid.success, false);
  });

  await test('searchLeadSchema validates sorting and pagination', () => {
    const valid = searchLeadSchema.safeParse({
      page: 2,
      pageSize: 25,
      sort: 'enquiry_date',
      order: 'desc',
      stage: 'enquiry_received',
    });
    assert.strictEqual(valid.success, true);
    if (valid.success) {
      assert.strictEqual(valid.data.page, 2);
      assert.strictEqual(valid.data.pageSize, 25);
      assert.strictEqual(valid.data.sort, 'enquiry_date');
    }
  });

  await test('createActivitySchema validates activity payloads', () => {
    const valid = createActivitySchema.safeParse({
      activity_type: lead_activity_type.phone_call,
      status: activity_status.completed,
      notes: 'Initial discussion with parent',
    });
    assert.strictEqual(valid.success, true);
  });

  // 2. Duplicate helper tests
  await test('LeadService checkDuplicates helper returns payload', async () => {
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
