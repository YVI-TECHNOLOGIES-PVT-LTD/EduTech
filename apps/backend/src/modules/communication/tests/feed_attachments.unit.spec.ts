import assert from 'assert';
import { FeedService } from '../services/FeedService';

export async function runFeedAttachmentUnitTests() {
  console.log('=====================================================');
  console.log('   FEED ATTACHMENTS UNIT & SECURITY TEST SUITE       ');
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

  const testOrgId = '00000000-0000-0000-0000-000000000001';
  const testPostId = '00000000-0000-0000-0000-000000000002';
  const testUserId = '00000000-0000-0000-0000-000000000003';

  // 1. Magic byte validation: Valid JPEG header
  await test('1. MIME Detection: Validates JPEG magic bytes (FF D8 FF)', () => {
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    const mime = FeedService.detectBufferMimeType(jpegBuffer);
    assert.strictEqual(mime, 'image/jpeg');
  });

  // 2. Magic byte validation: Valid PNG header
  await test('2. MIME Detection: Validates PNG magic bytes (89 50 4E 47 0D 0A 1A 0A)', () => {
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    const mime = FeedService.detectBufferMimeType(pngBuffer);
    assert.strictEqual(mime, 'image/png');
  });

  // 3. Magic byte validation: Valid WebP header
  await test('3. MIME Detection: Validates WebP magic bytes (RIFF....WEBP)', () => {
    const webpBuffer = Buffer.from([
      0x52,
      0x49,
      0x46,
      0x46, // 'RIFF'
      0x24,
      0x00,
      0x00,
      0x00, // size
      0x57,
      0x45,
      0x42,
      0x50, // 'WEBP'
      0x56,
      0x50,
      0x38,
      0x20, // 'VP8 '
    ]);
    const mime = FeedService.detectBufferMimeType(webpBuffer);
    assert.strictEqual(mime, 'image/webp');
  });

  // 4. Spoofed extension rejection: Text file named photo.png
  await test('4. Security: Rejects spoofed text file named photo.png', () => {
    const fakeBuffer = Buffer.from('<?php echo "evil"; ?> This is not an image');
    assert.throws(
      () => {
        FeedService.validateAttachmentFile('photo.png', fakeBuffer);
      },
      (err: any) => {
        assert(err.code === 'INVALID_FILE_TYPE' || err.code === 'MIME_SPOOFED');
        return true;
      },
    );
  });

  // 5. Spoofed extension rejection: Executable header named avatar.jpg
  await test('5. Security: Rejects executable header (MZ) named avatar.jpg', () => {
    const exeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
    assert.throws(
      () => {
        FeedService.validateAttachmentFile('avatar.jpg', exeBuffer);
      },
      (err: any) => {
        assert(err.code === 'INVALID_FILE_TYPE' || err.code === 'MIME_SPOOFED');
        return true;
      },
    );
  });

  // 6. File size validation: Reject file exceeding 10 MB limit
  await test('6. Size Limit: Rejects file exceeding 10 MB (10 * 1024 * 1024 + 1 bytes)', () => {
    const header = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    // Create virtual buffer representation
    const oversizedLength = 10 * 1024 * 1024 + 1;
    const oversizedBuffer = Buffer.alloc(100);
    header.copy(oversizedBuffer, 0);

    assert.throws(
      () => {
        FeedService.validateAttachmentFileSize(oversizedLength);
      },
      (err: any) => {
        assert(err.code === 'FILE_TOO_LARGE');
        return true;
      },
    );
  });

  // 7. Rejects empty buffer
  await test('7. Validation: Rejects zero-byte file', () => {
    assert.throws(
      () => {
        FeedService.validateAttachmentFile('test.jpg', Buffer.alloc(0));
      },
      (err: any) => {
        assert(err.code === 'EMPTY_FILE' || err.code === 'FILE_TOO_SMALL');
        return true;
      },
    );
  });

  // 8. Storage path convention enforcement
  await test('8. Storage Path: Generates path isolated by org_id and feed_post_id', () => {
    const path = FeedService.buildAttachmentStoragePath(testOrgId, testPostId, 'photo.jpg');
    assert(
      path.startsWith(`organizations/${testOrgId}/feeds/${testPostId}/`),
      'Must contain org and post isolation',
    );
    assert(path.endsWith('.jpg'), 'Must preserve valid extension');
    assert(!path.includes('..'), 'Must prevent directory traversal');
  });

  // 9. Display order validation: Reorder payload cannot be empty
  await test('9. Reorder Validation: Rejects empty reorder payload', async () => {
    await assert.rejects(
      async () => {
        FeedService.validateReorderPayload([]);
      },
      (err: any) => {
        assert.strictEqual(err.code, 'INVALID_REORDER_PAYLOAD');
        return true;
      },
    );
  });

  // 10. Display order validation: Rejects duplicate display orders
  await test('10. Reorder Validation: Rejects duplicate display orders in payload', async () => {
    await assert.rejects(
      async () => {
        FeedService.validateReorderPayload([
          { attachmentId: '00000000-0000-0000-0000-000000000001', displayOrder: 1 },
          { attachmentId: '00000000-0000-0000-0000-000000000002', displayOrder: 1 },
        ]);
      },
      (err: any) => {
        assert.strictEqual(err.code, 'DUPLICATE_DISPLAY_ORDER');
        return true;
      },
    );
  });

  // 11. Display order validation: Rejects non-positive display orders
  await test('11. Reorder Validation: Rejects zero or negative display order', async () => {
    await assert.rejects(
      async () => {
        FeedService.validateReorderPayload([
          { attachmentId: '00000000-0000-0000-0000-000000000001', displayOrder: 0 },
        ]);
      },
      (err: any) => {
        assert.strictEqual(err.code, 'INVALID_DISPLAY_ORDER');
        return true;
      },
    );
  });

  // 12. Maximum active attachments enforcement (5 max)
  await test('12. Concurrency Limit: Enforces maximum 5 active attachments per post', () => {
    const activeCount = 5;
    assert.throws(
      () => {
        FeedService.assertAttachmentLimitNotExceeded(activeCount);
      },
      (err: any) => {
        assert.strictEqual(err.code, 'ATTACHMENT_LIMIT_EXCEEDED');
        return true;
      },
    );
  });

  // 13. DTO transformation: camelCase and snake_case mapping with signed URL
  await test('13. DTO Transformation: Correctly maps database row to DTO with short-lived signed URL', () => {
    const sampleDbRow = {
      attachment_id: '99999999-9999-9999-9999-999999999999',
      org_id: testOrgId,
      feed_post_id: testPostId,
      file_name: 'sports_day.webp',
      storage_path: `organizations/${testOrgId}/feeds/${testPostId}/sports_day.webp`,
      mime_type: 'image/webp',
      file_size_bytes: 524288,
      display_order: 1,
      caption: 'Annual Sports Day 2026',
      uploaded_by: testUserId,
      uploaded_at: new Date('2026-11-18T08:00:00Z'),
    };

    const signedUrl = 'https://supabase.local/storage/v1/object/sign/communication-feeds/...';
    const expiresAt = '2026-11-18T09:00:00Z';

    const dto = FeedService.mapAttachmentRowToDto(sampleDbRow, signedUrl, expiresAt);

    assert.strictEqual(dto.attachmentId, sampleDbRow.attachment_id);
    assert.strictEqual(dto.attachment_id, sampleDbRow.attachment_id);
    assert.strictEqual(dto.fileName, 'sports_day.webp');
    assert.strictEqual(dto.mimeType, 'image/webp');
    assert.strictEqual(dto.fileSizeBytes, 524288);
    assert.strictEqual(dto.displayOrder, 1);
    assert.strictEqual(dto.caption, 'Annual Sports Day 2026');
    assert.strictEqual(dto.signedUrl, signedUrl);
    assert.strictEqual(dto.signedUrlExpiresAt, expiresAt);
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    throw new Error(`${failed} feed attachment unit tests failed`);
  }
}

if (require.main === module) {
  runFeedAttachmentUnitTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
