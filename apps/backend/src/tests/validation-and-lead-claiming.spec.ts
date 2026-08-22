import assert from 'assert';
import {
  normalizePhoneNumber,
  isValidPhoneNumber,
  normalizeEmail,
  isValidEmail,
  phoneSchema,
  optionalPhoneSchema,
  emailSchema,
  optionalEmailSchema,
} from '@edutrack/validation';
import prisma from '../lib/prismaClient';
import { AuthService } from '../auth/auth.service';

export async function runValidationAndLeadClaimingTests() {
  console.log('\n============================================================');
  console.log('CANONICAL PHONE/EMAIL VALIDATION & LEAD CLAIMING TEST SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}`);
      console.error('    Error:', err.message || err);
      failed++;
    }
  }

  // 1. Phone Normalization & Validation Tests
  await test('PHONE VALID: All supported formats normalize to 10 digits', () => {
    const validInputs = [
      '9876543210',
      '+919876543210',
      '919876543210',
      '09876543210',
      '+91 98765 43210',
      '98765-43210',
    ];
    for (const input of validInputs) {
      assert.strictEqual(
        normalizePhoneNumber(input),
        '9876543210',
        `Failed to normalize valid phone '${input}'`,
      );
      assert.strictEqual(
        isValidPhoneNumber(input),
        true,
        `isValidPhoneNumber returned false for valid phone '${input}'`,
      );
      assert.strictEqual(
        phoneSchema.parse(input),
        '9876543210',
        `phoneSchema failed to parse valid phone '${input}'`,
      );
    }
  });

  await test('PHONE INVALID: All malformed phone inputs are rejected', () => {
    const invalidInputs = [
      'abc9876543210',
      '98765abc43210',
      '9876543210xyz',
      'abc+91 98765 43210',
      '1234567890',
      '123456789',
      '12345678901',
      '12345',
      'abcdefghij',
      'abc9876543',
      '0000000000',
      '1111111111',
    ];
    for (const input of invalidInputs) {
      assert.strictEqual(
        normalizePhoneNumber(input),
        null,
        `Expected null for invalid phone '${input}'`,
      );
      assert.strictEqual(
        isValidPhoneNumber(input),
        false,
        `isValidPhoneNumber returned true for invalid phone '${input}'`,
      );
    }
  });

  // International Phone Validation Tests
  await test('PHONE INTERNATIONAL: Validates and normalizes international numbers with country context', () => {
    // US Phone
    assert.strictEqual(normalizePhoneNumber('+14155551234'), '+14155551234');
    assert.strictEqual(normalizePhoneNumber('4155551234', 'US'), '+14155551234');
    assert.strictEqual(isValidPhoneNumber('+14155551234'), true);
    assert.strictEqual(isValidPhoneNumber('+112345'), false);

    // UK Phone
    assert.strictEqual(normalizePhoneNumber('+442071234567'), '+442071234567');
    assert.strictEqual(isValidPhoneNumber('+442071234567'), true);

    // UAE Phone
    assert.strictEqual(normalizePhoneNumber('+971501234567'), '+971501234567');
    assert.strictEqual(isValidPhoneNumber('+971501234567'), true);

    // Singapore Phone
    assert.strictEqual(normalizePhoneNumber('+6591234567'), '+6591234567');
    assert.strictEqual(isValidPhoneNumber('+6591234567'), true);

    // Uniqueness: Indian number 9876543210 must NOT collide with US +14155551234
    const indiaNormalized = normalizePhoneNumber('9876543210', 'IN');
    const usNormalized = normalizePhoneNumber('+14155551234');
    assert.strictEqual(indiaNormalized, '9876543210');
    assert.strictEqual(usNormalized, '+14155551234');
    assert.notStrictEqual(indiaNormalized, usNormalized);
  });

  // 2. Email Normalization & Validation Tests
  await test('EMAIL VALID: Valid email formats accepted across domains', () => {
    const validEmails = [
      'user@gmail.com',
      'principal@school.edu.in',
      'admin@school.com',
      'hr@institution.org',
      'teacher@school.ac.in',
    ];
    for (const email of validEmails) {
      assert.strictEqual(
        isValidEmail(email),
        true,
        `isValidEmail returned false for valid email '${email}'`,
      );
      assert.strictEqual(
        emailSchema.parse(email),
        email.toLowerCase(),
        `emailSchema failed for valid email '${email}'`,
      );
    }
  });

  await test('EMAIL NORMALIZATION: Trim and lowercase', () => {
    const input = ' Admin@School.COM ';
    assert.strictEqual(normalizeEmail(input), 'admin@school.com');
    assert.strictEqual(emailSchema.parse(input), 'admin@school.com');
  });

  await test('EMAIL INVALID: Malformed email syntax rejected', () => {
    const invalidEmails = [
      'test',
      'test@',
      '@school.com',
      'test@school',
      'test@@gmail.com',
      'test gmail@gmail.com',
      'test@.com',
    ];
    for (const email of invalidEmails) {
      assert.strictEqual(
        isValidEmail(email),
        false,
        `isValidEmail returned true for invalid email '${email}'`,
      );
      assert.throws(
        () => emailSchema.parse(email),
        /Enter a valid email address/,
        `emailSchema accepted invalid email '${email}'`,
      );
    }
  });

  // 3. Lead Claiming Regression Tests (Step 6 variants)
  await test('LEAD CLAIMING: Formatted lead phone variants resolve to canonical 10-digit phone', async () => {
    const org = await prisma.organizations.findFirst({ where: { status: 'active' } });
    if (!org) return;

    const ayg = await prisma.academic_year_grades.findFirst({
      where: { academic_years: { org_id: org.org_id } },
    });
    if (!ayg) return;

    const testFormats = ['+91 98765 43210', '09876543210', '919876543210', '98765-43210'];

    for (let i = 0; i < testFormats.length; i++) {
      const formattedLeadPhone = testFormats[i];
      const testSuffix = (Date.now() + i).toString().slice(-6);
      const leadEmail = `lead_format_${i}_${testSuffix}@school.edu.in`;
      const regPhone = '9876543210';

      const lead: any = await prisma.leads.create({
        data: {
          org_id: org.org_id,
          lead_number: `LEAD-TEST-${testSuffix}`,
          academic_year_grade_id: ayg.academic_year_grade_id,
          student_first_name: 'ChildName',
          student_last_name: 'Test',
          contact_name: `ParentName Test ${i}`,
          contact_phone: formattedLeadPhone,
          contact_email: leadEmail,
          source: 'website' as any,
          stage: 'enquiry_received' as any,
        },
      });

      try {
        const regResult = await AuthService.registerParent({
          full_name: `ParentName Test ${i}`,
          email: leadEmail,
          phone: regPhone,
          password: 'Password123!',
          org_id: org.org_id,
          source: 'website',
        });

        assert.strictEqual(regResult.success, true);
        assert.strictEqual(
          regResult.claimed,
          true,
          `Lead with phone '${formattedLeadPhone}' must be claimed by clean phone '${regPhone}'`,
        );
        assert.strictEqual(
          regResult.lead_id,
          lead.lead_id,
          `Claimed lead ID must match pre-existing lead ID`,
        );

        if (regResult.user_id) {
          await prisma.user_roles.deleteMany({ where: { user_id: regResult.user_id } });
          await prisma.parents.deleteMany({ where: { user_id: regResult.user_id } });
          await prisma.users.deleteMany({ where: { user_id: regResult.user_id } });
        }
      } finally {
        await prisma.leads.deleteMany({ where: { lead_id: lead.lead_id } });
      }
    }
  });

  console.log(`\n============================================================`);
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`============================================================\n`);

  if (failed > 0) {
    throw new Error(`${failed} test(s) failed in Validation & Lead Claiming test suite`);
  }
}

if (require.main === module) {
  runValidationAndLeadClaimingTests().catch((err) => {
    console.error('Validation test runner failed:', err);
    process.exit(1);
  });
}
