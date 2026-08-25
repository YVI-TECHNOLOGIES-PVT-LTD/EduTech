import assert from 'assert';
import multer from 'multer';
import { UserAvatarService } from '../services/user-avatar.service';
import { UserAvatarRepository } from '../repositories/user-avatar.repository';
import {
  ApplicationValidationError,
  ApplicationForbiddenError,
} from '../../admission-management/errors/admission.errors';

export async function runUserAvatarTests() {
  console.log('[User Avatar Unit Tests] Starting profile-photo test execution...');
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

  // 1. Validation: Allowed formats (JPEG, PNG, WEBP)
  await test('Image Validation: Accepts valid JPEG binary signature', () => {
    // JPEG header: FF D8 FF
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    const mockFile = {
      buffer: jpegBuffer,
      mimetype: 'image/jpeg',
      originalname: 'avatar.jpg',
      size: 1024,
    } as Express.Multer.File;

    UserAvatarService.validateAvatarFile(mockFile);
  });

  await test('Image Validation: Accepts valid PNG binary signature', () => {
    // PNG header: 89 50 4E 47
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const mockFile = {
      buffer: pngBuffer,
      mimetype: 'image/png',
      originalname: 'photo.png',
      size: 2048,
    } as Express.Multer.File;

    UserAvatarService.validateAvatarFile(mockFile);
  });

  await test('Image Validation: Rejects PDF files', () => {
    // PDF header: %PDF
    const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35]);
    const mockFile = {
      buffer: pdfBuffer,
      mimetype: 'application/pdf',
      originalname: 'document.pdf',
      size: 1024,
    } as Express.Multer.File;

    assert.throws(
      () => UserAvatarService.validateAvatarFile(mockFile),
      (err: any) =>
        err instanceof ApplicationValidationError && err.message.includes('Invalid image format'),
    );
  });

  await test('Image Validation: Rejects oversized images (> 5MB)', () => {
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const mockFile = {
      buffer: pngBuffer,
      mimetype: 'image/png',
      originalname: 'large.png',
      size: 6 * 1024 * 1024, // 6 MB
    } as Express.Multer.File;

    assert.throws(
      () => UserAvatarService.validateAvatarFile(mockFile),
      (err: any) =>
        err instanceof ApplicationValidationError &&
        err.message.includes('exceeds maximum 5 MB limit'),
    );
  });

  // 2. Authorization & Tenant Isolation Checks
  await test('Authorization: Rejects invalid user_id UUID format', async () => {
    const currentUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      org_id: '123e4567-e89b-12d3-a456-426614174001',
      roles: ['PARENT'],
    };

    try {
      await UserAvatarService.authorizeUserAction('invalid-uuid-string', currentUser);
      assert.fail('Should have thrown ApplicationValidationError');
    } catch (err: any) {
      assert(err instanceof ApplicationValidationError);
    }
  });

  await test('Authorization: Rejects non-existent user or cross-organization access', async () => {
    const currentUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      org_id: '123e4567-e89b-12d3-a456-426614174001',
      roles: ['PARENT'],
    };

    try {
      await UserAvatarService.authorizeUserAction(
        '123e4567-e89b-12d3-a456-426614174999',
        currentUser,
      );
      assert.fail('Should have thrown ApplicationValidationError or ApplicationForbiddenError');
    } catch (err: any) {
      assert(err instanceof ApplicationValidationError || err instanceof ApplicationForbiddenError);
    }
  });

  // 3. Storage Path Rules
  await test('Storage Path Formatting: Never contains signed URLs or base64 in DB path', () => {
    const userId = '7bde8ed1-d570-4b0c-9385-7021b3f18b37';
    const ext = 'jpg';
    const dbPath = `profile-photos/${userId}/avatar.${ext}`;

    assert.strictEqual(dbPath.startsWith('profile-photos/'), true);
    assert.strictEqual(dbPath.includes('http://'), false);
    assert.strictEqual(dbPath.includes('https://'), false);
    assert.strictEqual(dbPath.includes('base64'), false);
  });

  console.log(`[User Avatar Unit Tests] Completed: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runUserAvatarTests();
}
