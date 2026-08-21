import assert from 'assert';
import { application_status, document_verify_status } from '@prisma/client';
import { ApplicationValidator } from '../validators/application.validator';
import { DocumentValidator } from '../validators/document.validator';
import {
  InvalidApplicationStatusTransitionError,
  ApplicationValidationError,
} from '../errors/admission.errors';
import {
  detectBufferMimeType,
  validateFileBufferSignature,
} from '../../../middlewares/upload.middleware';
import { recordPaymentSchema } from '../dto/request/record-payment.dto';
import { recordDecisionSchema } from '../dto/request/record-decision.dto';

export async function runAdmissionModuleTests() {
  console.log('[Admission Application Management] Running unit tests...');
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
  test('ApplicationValidator allows valid status transitions', () => {
    ApplicationValidator.validateStatusTransition(
      application_status.submitted,
      application_status.documents_pending,
    );
    ApplicationValidator.validateStatusTransition(
      application_status.assessment_pending,
      application_status.approved,
    );
  });

  test('ApplicationValidator rejects invalid status transitions', () => {
    assert.throws(
      () =>
        ApplicationValidator.validateStatusTransition(
          application_status.withdrawn,
          application_status.submitted,
        ),
      InvalidApplicationStatusTransitionError,
    );
  });

  test('DocumentValidator validates mandatory upload inputs', () => {
    assert.throws(
      () => DocumentValidator.validateUpload({ document_type_id: '', file_path: '' }),
      Error,
    );
  });

  // 2. Magic-Byte Validation Tests
  test('detectBufferMimeType accurately detects PDF (%PDF-)', () => {
    const pdfBuf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    assert.strictEqual(detectBufferMimeType(pdfBuf), 'application/pdf');
  });

  test('detectBufferMimeType accurately detects PNG', () => {
    const pngBuf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    assert.strictEqual(detectBufferMimeType(pngBuf), 'image/png');
  });

  test('detectBufferMimeType accurately detects JPEG', () => {
    const jpegBuf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    assert.strictEqual(detectBufferMimeType(jpegBuf), 'image/jpeg');
  });

  test('detectBufferMimeType accurately detects WEBP', () => {
    const webpBuf = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);
    assert.strictEqual(detectBufferMimeType(webpBuf), 'image/webp');
  });

  test('validateFileBufferSignature accepts valid PDF file', () => {
    const file = {
      buffer: Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]),
      mimetype: 'application/pdf',
      originalname: 'document.pdf',
    } as Express.Multer.File;

    assert.doesNotThrow(() => validateFileBufferSignature(file));
  });

  test('validateFileBufferSignature rejects mismatched declared MIME and actual binary', () => {
    const spoofedFile = {
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]), // JPEG
      mimetype: 'application/pdf', // Declared as PDF
      originalname: 'document.pdf',
    } as Express.Multer.File;

    assert.throws(() => validateFileBufferSignature(spoofedFile), ApplicationValidationError);
  });

  test('validateFileBufferSignature rejects unknown/executable binary', () => {
    const exeFile = {
      buffer: Buffer.from([0x4d, 0x5a, 0x90, 0x00]), // MZ DOS header
      mimetype: 'application/pdf',
      originalname: 'malicious.pdf',
    } as Express.Multer.File;

    assert.throws(() => validateFileBufferSignature(exeFile), ApplicationValidationError);
  });

  // 3. Admission Fee Payment DTO Validation Tests
  test('recordPaymentSchema accepts valid cash payment', () => {
    const valid = recordPaymentSchema.safeParse({
      amount: 1200,
      payment_status: 'paid',
      payment_mode: 'cash',
      payment_date: new Date().toISOString(),
      remarks: 'Cash collected at desk',
    });
    assert.strictEqual(valid.success, true);
  });

  test('recordPaymentSchema accepts valid bank transfer payment with UTR', () => {
    const valid = recordPaymentSchema.safeParse({
      amount: 1200,
      payment_status: 'paid',
      payment_mode: 'bank_transfer',
      transaction_reference: 'SBI94820194820',
      payment_date: new Date().toISOString(),
    });
    assert.strictEqual(valid.success, true);
  });

  test('recordPaymentSchema rejects non-positive amounts', () => {
    const negative = recordPaymentSchema.safeParse({ amount: -500 });
    assert.strictEqual(negative.success, false);

    const zero = recordPaymentSchema.safeParse({ amount: 0 });
    assert.strictEqual(zero.success, false);
  });

  test('recordPaymentSchema rejects invalid payment status enum', () => {
    const invalidStatus = recordPaymentSchema.safeParse({
      payment_status: 'UNKNOWN_STATUS' as any,
    });
    assert.strictEqual(invalidStatus.success, false);
  });

  // 4. Admission Decision DTO Validation Tests
  test('recordDecisionSchema accepts valid approved decision', () => {
    const valid = recordDecisionSchema.safeParse({
      decision_status: 'approved',
      decision_date: new Date().toISOString(),
      scholarship_percentage: 25.5,
      offer_expiry_date: new Date(Date.now() + 86400000 * 14).toISOString(),
      remarks: 'Selected for merit scholarship',
    });
    assert.strictEqual(valid.success, true);
  });

  test('recordDecisionSchema accepts valid waitlisted decision with position', () => {
    const valid = recordDecisionSchema.safeParse({
      decision_status: 'waitlisted',
      waitlist_position: 4,
      reason: 'Capacity full for Grade 1',
    });
    assert.strictEqual(valid.success, true);
  });

  test('recordDecisionSchema accepts valid rejected and withdrawn decisions', () => {
    const rejected = recordDecisionSchema.safeParse({
      decision_status: 'rejected',
      reason: 'Did not meet age criteria',
    });
    assert.strictEqual(rejected.success, true);

    const withdrawn = recordDecisionSchema.safeParse({
      decision_status: 'withdrawn',
      reason: 'Parent requested withdrawal',
    });
    assert.strictEqual(withdrawn.success, true);
  });

  test('recordDecisionSchema rejects invalid scholarship percentages', () => {
    const over100 = recordDecisionSchema.safeParse({
      decision_status: 'approved',
      scholarship_percentage: 150,
    });
    assert.strictEqual(over100.success, false);

    const negative = recordDecisionSchema.safeParse({
      decision_status: 'approved',
      scholarship_percentage: -10,
    });
    assert.strictEqual(negative.success, false);
  });

  test('recordDecisionSchema rejects non-positive waitlist positions', () => {
    const zeroPos = recordDecisionSchema.safeParse({
      decision_status: 'waitlisted',
      waitlist_position: 0,
    });
    assert.strictEqual(zeroPos.success, false);
  });

  test('recordDecisionSchema rejects invalid decision_status enum', () => {
    const invalid = recordDecisionSchema.safeParse({
      decision_status: 'ACCEPTED' as any,
    });
    assert.strictEqual(invalid.success, false);
  });

  console.log(
    `[Admission Application Management] Tests finished: ${passed} passed, ${failed} failed.`,
  );
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runAdmissionModuleTests();
}
