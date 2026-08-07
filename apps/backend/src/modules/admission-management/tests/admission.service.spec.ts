import assert from 'assert';
import { application_status, document_verify_status } from '@prisma/client';
import { ApplicationValidator } from '../validators/application.validator';
import { DocumentValidator } from '../validators/document.validator';
import { InvalidApplicationStatusTransitionError } from '../errors/admission.errors';

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
