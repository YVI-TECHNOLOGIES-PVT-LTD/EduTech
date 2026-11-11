/**
 * EduTrack ERP — Phase 4: Digital Resource Library Test Suite
 * Comprehensive verification for Phase 4:
 * - Validates Resource DTOs and upload rules
 * - Validates file signature (magic bytes) validation and size restrictions
 * - Validates real PostgreSQL persistence (learning_resources, learning_resource_grades, resource_categories)
 * - Validates real Supabase Storage integration (edutrack-learning-resources)
 * - Validates PostgreSQL lifecycle triggers (published hard-delete prevention, unarchive block)
 * - Validates strict multi-tenant isolation across Tenant A and Tenant B
 * - Validates short-lived signed URLs for preview and download
 * - Validates HTTP 501 enforcement for unsupported Stage-2 entities (subjects, frameworks)
 */

import assert from 'assert';
import crypto from 'crypto';
import prisma from '../../../lib/prismaClient';
import {
  LearningResourceService,
  MAX_RESOURCE_FILE_SIZE,
  DEFAULT_RESOURCE_BUCKET,
} from '../services/learning-resource.service';
import { LearningResourceController } from '../controllers/learning-resource.controller';
import { LearningResourceRepository } from '../repositories/learning-resource.repository';
import { createResourceSchema } from '../dto/request/create-resource.dto';
import { updateResourceSchema } from '../dto/request/update-resource.dto';
import { listResourcesSchema } from '../dto/request/search-resource.dto';
import { AcademicError } from '../errors/academic.errors';
import { StorageService } from '../../../services/storage.service';
import { validateFileBufferSignature } from '../../../middlewares/upload.middleware';

export async function runAcademicPhase4Tests() {
  console.log('===============================================================');
  console.log('  EDUTRACK ERP — PHASE 4: DIGITAL RESOURCE LIBRARY TEST SUITE  ');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}: ${err.message}`);
      if (err.stack) {
        console.error(`    ${err.stack.split('\n')[1]}`);
      }
      failed++;
    }
  }

  // 1. Resolve real active tenants with staff from PostgreSQL
  const TENANT_A = '624efc1b-4144-43a4-90b8-552d945cbef7'; // Greenwood School, Delhi
  const TENANT_B = '5205f1f3-4e31-42d9-9b53-77fc84ad40df'; // National Public School, Ahmedabad

  const orgA = await prisma.organizations.findUnique({ where: { org_id: TENANT_A } });
  const orgB = await prisma.organizations.findUnique({ where: { org_id: TENANT_B } });

  if (!orgA || !orgB) {
    throw new Error('Test requires both test organizations active in database');
  }

  const staffA = await LearningResourceRepository.findFirstActiveStaff(TENANT_A);
  const staffB = await LearningResourceRepository.findFirstActiveStaff(TENANT_B);

  if (!staffA || !staffB) {
    throw new Error('Test requires active staff records in both test organizations');
  }

  console.log(`[Test Environment Context]`);
  console.log(`  Tenant A: ${TENANT_A} (${orgA.org_name}) | Staff: ${staffA.staff_id}`);
  console.log(`  Tenant B: ${TENANT_B} (${orgB.org_name}) | Staff: ${staffB.staff_id}\n`);

  const createdResourceIdsA: string[] = [];
  const createdResourceIdsB: string[] = [];

  // Helper to create a mock file
  function createMockPdf(content: string = 'Test PDF Content'): Express.Multer.File {
    const pdfHeader = Buffer.from('%PDF-1.4\n%âãÏÓ\n');
    const pdfBody = Buffer.from(
      `1 0 obj\n<< /Title (${content}) >>\nendobj\ntrailer\n<< >>\n%%EOF`,
    );
    const buffer = Buffer.concat([pdfHeader, pdfBody]);
    return {
      fieldname: 'file',
      originalname: 'test_document.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      buffer,
      size: buffer.length,
      destination: '',
      filename: 'test_document.pdf',
      path: '',
      stream: null as any,
    };
  }

  function createMockPng(): Express.Multer.File {
    // Standard PNG signature: 89 50 4E 47 0D 0A 1A 0A
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const pngBody = Buffer.from('IHDR chunk and image data');
    const buffer = Buffer.concat([pngHeader, pngBody]);
    return {
      fieldname: 'file',
      originalname: 'test_diagram.png',
      encoding: '7bit',
      mimetype: 'image/png',
      buffer,
      size: buffer.length,
      destination: '',
      filename: 'test_diagram.png',
      path: '',
      stream: null as any,
    };
  }

  // --------------------------------------------------------------------------
  // SUITE 1: RESOURCE DTO & VALIDATION RULES
  // --------------------------------------------------------------------------
  console.log('[Suite 1: Resource DTO & Validation Rules]');

  await test('createResourceSchema accepts valid external link payload', () => {
    const parsed = createResourceSchema.safeParse({
      title: 'Khan Academy Calculus',
      resource_type: 'external_link',
      external_url: 'https://www.khanacademy.org/math/calculus',
    });
    assert.ok(parsed.success);
    if (parsed.success) {
      assert.strictEqual(parsed.data.title, 'Khan Academy Calculus');
      assert.strictEqual(parsed.data.resource_type, 'external_link');
      assert.strictEqual(parsed.data.resource_status, 'draft');
    }
  });

  await test('createResourceSchema rejects external_link without external_url', () => {
    const parsed = createResourceSchema.safeParse({
      title: 'Missing URL Resource',
      resource_type: 'external_link',
    });
    assert.strictEqual(parsed.success, false);
  });

  await test('createResourceSchema rejects invalid external_url format', () => {
    const parsed = createResourceSchema.safeParse({
      title: 'Bad URL',
      resource_type: 'external_link',
      external_url: 'not-a-valid-url',
    });
    assert.strictEqual(parsed.success, false);
  });

  await test('createResourceSchema rejects title exceeding 200 characters', () => {
    const parsed = createResourceSchema.safeParse({
      title: 'A'.repeat(201),
      resource_type: 'file',
    });
    assert.strictEqual(parsed.success, false);
  });

  await test('createResourceSchema transforms empty string description to null', () => {
    const parsed = createResourceSchema.safeParse({
      title: 'Clean Description',
      description: '   ',
      resource_type: 'file',
    });
    assert.ok(parsed.success);
    if (parsed.success) {
      assert.strictEqual(parsed.data.description, null);
    }
  });

  await test('createResourceSchema parses stringified JSON grade_ids', () => {
    const g1 = crypto.randomUUID();
    const g2 = crypto.randomUUID();
    const parsed = createResourceSchema.safeParse({
      title: 'Resource with grades',
      resource_type: 'file',
      grade_ids: JSON.stringify([g1, g2]),
    });
    assert.ok(parsed.success);
    if (parsed.success) {
      assert.deepStrictEqual(parsed.data.grade_ids, [g1, g2]);
    }
  });

  await test('updateResourceSchema rejects blank title', () => {
    const parsed = updateResourceSchema.safeParse({
      title: '   ',
    });
    assert.strictEqual(parsed.success, false);
  });

  await test('listResourcesSchema sets sensible default pagination and sorting', () => {
    const parsed = listResourcesSchema.safeParse({});
    assert.ok(parsed.success);
    if (parsed.success) {
      assert.strictEqual(parsed.data.page, 1);
      assert.strictEqual(parsed.data.limit, 20);
      assert.strictEqual(parsed.data.sort_by, 'created_at');
      assert.strictEqual(parsed.data.sort_order, 'desc');
    }
  });

  // --------------------------------------------------------------------------
  // SUITE 2: STORAGE INFRASTRUCTURE & UPLOAD SECURITY
  // --------------------------------------------------------------------------
  console.log('\n[Suite 2: Storage Infrastructure & Upload Security]');

  await test('validateFileBufferSignature accepts valid PDF file buffer', () => {
    const mockPdf = createMockPdf();
    assert.doesNotThrow(() => validateFileBufferSignature(mockPdf));
  });

  await test('validateFileBufferSignature accepts valid PNG file buffer', () => {
    const mockPng = createMockPng();
    assert.doesNotThrow(() => validateFileBufferSignature(mockPng));
  });

  await test('validateFileBufferSignature rejects MIME spoofing (plain text declared as PDF)', () => {
    const fakePdf: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'malicious.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      buffer: Buffer.from('Just plain text pretending to be a PDF'),
      size: 38,
      destination: '',
      filename: 'malicious.pdf',
      path: '',
      stream: null as any,
    };
    assert.throws(() => validateFileBufferSignature(fakePdf), /signature/i);
  });

  await test('validateFileBufferSignature rejects empty file buffer', () => {
    const emptyFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'empty.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      buffer: Buffer.alloc(0),
      size: 0,
      destination: '',
      filename: 'empty.pdf',
      path: '',
      stream: null as any,
    };
    assert.throws(() => validateFileBufferSignature(emptyFile), /empty or unreadable/i);
  });

  await test('StorageService verifies presence of edutrack-learning-resources bucket', async () => {
    const testPath = `audit_p4_${Date.now()}.txt`;
    const buffer = Buffer.from('EduTrack Storage Self-Test');
    const uploadRes = await StorageService.uploadFile({
      bucket: DEFAULT_RESOURCE_BUCKET,
      path: testPath,
      buffer,
      mimeType: 'text/plain',
    });
    assert.ok(uploadRes.path);
    await StorageService.deleteFile(testPath, DEFAULT_RESOURCE_BUCKET);
  });

  // --------------------------------------------------------------------------
  // SUITE 3: DURABLE POSTGRESQL PERSISTENCE & RESOURCE LIFECYCLE
  // --------------------------------------------------------------------------
  console.log('\n[Suite 3: Durable PostgreSQL Persistence & Resource Lifecycle]');

  let testResourceIdA: string;
  let testExternalResourceIdA: string;

  await test('LearningResourceService.createResource persists external link resource in PostgreSQL', async () => {
    const res = await LearningResourceService.createResource(
      TENANT_A,
      {
        title: 'Interactive Physics Simulation (PhET)',
        description: 'Kinematics and projectile motion simulation',
        resource_type: 'external_link',
        external_url:
          'https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_all.html',
        resource_status: 'draft',
      },
      undefined,
      null,
    );

    assert.ok(res.resource_id);
    assert.strictEqual(res.org_id, TENANT_A);
    assert.strictEqual(res.resource_type, 'external_link');
    assert.strictEqual(res.storage_path, null);
    assert.strictEqual(res.resource_status, 'draft');

    testExternalResourceIdA = res.resource_id;
    createdResourceIdsA.push(res.resource_id);

    // Verify row directly in PostgreSQL catalog
    const dbRow = await LearningResourceRepository.findById(TENANT_A, res.resource_id);
    assert.ok(dbRow);
    assert.strictEqual(dbRow?.title, 'Interactive Physics Simulation (PhET)');
  });

  await test('LearningResourceService.createResource uploads binary to Supabase and persists record in PostgreSQL', async () => {
    const mockPdf = createMockPdf('Calculus Chapter 4 Worksheet');
    const res = await LearningResourceService.createResource(
      TENANT_A,
      {
        title: 'Calculus Chapter 4 Practice Sheet',
        description: 'Derivatives and rate of change problems',
        resource_type: 'file',
        resource_status: 'draft',
      },
      mockPdf,
      null,
    );

    assert.ok(res.resource_id);
    assert.strictEqual(res.org_id, TENANT_A);
    assert.strictEqual(res.resource_type, 'file');
    assert.ok(res.storage_path?.includes(TENANT_A));
    assert.strictEqual(res.file_name, 'test_document.pdf');
    assert.strictEqual(res.mime_type, 'application/pdf');
    assert.strictEqual(res.resource_status, 'draft');

    testResourceIdA = res.resource_id;
    createdResourceIdsA.push(res.resource_id);

    // Verify direct PostgreSQL persistence
    const dbRow = await LearningResourceRepository.findById(TENANT_A, res.resource_id);
    assert.ok(dbRow);
    assert.strictEqual(dbRow?.storage_bucket, DEFAULT_RESOURCE_BUCKET);
  });

  await test('LearningResourceService.listResources returns paginated list with joined metadata', async () => {
    const list = await LearningResourceService.listResources(TENANT_A, {
      page: 1,
      limit: 10,
      sort_by: 'created_at',
      sort_order: 'desc',
    });

    assert.ok(list.items.length >= 2);
    assert.ok(list.meta.total >= 2);
    const found = list.items.find((i) => i.resource_id === testResourceIdA);
    assert.ok(found);
    assert.strictEqual(typeof found.file_size_bytes, 'number');
  });

  await test('LearningResourceService.listResources filters by search keyword', async () => {
    const list = await LearningResourceService.listResources(TENANT_A, {
      search: 'Calculus Chapter 4',
      page: 1,
      limit: 10,
      sort_by: 'created_at',
      sort_order: 'desc',
    });

    assert.ok(list.items.length >= 1);
    assert.ok(list.items.some((i) => i.resource_id === testResourceIdA));
  });

  await test('LearningResourceService.updateResource updates metadata in PostgreSQL', async () => {
    const updated = await LearningResourceService.updateResource(
      TENANT_A,
      testResourceIdA,
      {
        title: 'Calculus Chapter 4 Practice Sheet (Revised)',
        description: 'Updated with solutions and hints',
        resource_status: 'published',
      },
      null,
    );

    assert.strictEqual(updated.title, 'Calculus Chapter 4 Practice Sheet (Revised)');
    assert.strictEqual(updated.description, 'Updated with solutions and hints');
    assert.strictEqual(updated.resource_status, 'published');
  });

  await test('PostgreSQL Trigger enforces: Published resource cannot be hard-deleted', async () => {
    // Attempting to hard-delete published resource must fail
    await assert.rejects(
      async () => {
        await LearningResourceService.deleteResource(TENANT_A, testResourceIdA);
      },
      (err: any) => {
        assert.ok(
          err.message.includes('cannot be hard-deleted') || err.message.includes('archive'),
          `Unexpected error message: ${err.message}`,
        );
        return true;
      },
    );
  });

  await test('PostgreSQL Trigger enforces: Published resource cannot be reverted to draft', async () => {
    await assert.rejects(
      async () => {
        await LearningResourceService.updateResource(
          TENANT_A,
          testResourceIdA,
          { resource_status: 'draft' },
          null,
        );
      },
      (err: any) => {
        assert.ok(
          err.message.includes('cannot be returned to draft') || err.message.includes('draft'),
          `Unexpected error message: ${err.message}`,
        );
        return true;
      },
    );
  });

  await test('LearningResourceService.archiveResource transitions status to archived', async () => {
    const archived = await LearningResourceService.archiveResource(TENANT_A, testResourceIdA, null);
    assert.strictEqual(archived.resource_status, 'archived');
  });

  await test('PostgreSQL Trigger enforces: Archived resource cannot be unarchived', async () => {
    await assert.rejects(
      async () => {
        await LearningResourceService.updateResource(
          TENANT_A,
          testResourceIdA,
          { resource_status: 'published' },
          null,
        );
      },
      (err: any) => {
        assert.ok(
          err.message.includes('cannot be unarchived'),
          `Unexpected error message: ${err.message}`,
        );
        return true;
      },
    );
  });

  await test('LearningResourceService.deleteResource deletes draft external link resource', async () => {
    const res = await LearningResourceService.deleteResource(TENANT_A, testExternalResourceIdA);
    assert.strictEqual(res.success, true);

    const check = await LearningResourceRepository.findById(TENANT_A, testExternalResourceIdA);
    assert.strictEqual(check, null);
  });

  // --------------------------------------------------------------------------
  // SUITE 4: MULTI-TENANT ISOLATION & SECURITY
  // --------------------------------------------------------------------------
  console.log('\n[Suite 4: Multi-Tenant Isolation & Security]');

  let testResourceIdB: string;

  await test('Create draft resource in Tenant B for isolation verification', async () => {
    const mockPdf = createMockPdf('Tenant B Geography Map');
    const res = await LearningResourceService.createResource(
      TENANT_B,
      {
        title: 'Tenant B Geography Map',
        resource_type: 'file',
        resource_status: 'draft',
      },
      mockPdf,
      null,
    );
    testResourceIdB = res.resource_id;
    createdResourceIdsB.push(res.resource_id);
    assert.strictEqual(res.org_id, TENANT_B);
  });

  await test('Tenant Isolation: Tenant A cannot fetch Tenant B resource by ID (Returns 404)', async () => {
    await assert.rejects(
      async () => {
        await LearningResourceService.getResourceById(TENANT_A, testResourceIdB);
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 404);
        return true;
      },
    );
  });

  await test('Tenant Isolation: Tenant A cannot preview Tenant B file (Returns 404)', async () => {
    await assert.rejects(
      async () => {
        await LearningResourceService.getPreviewUrl(TENANT_A, testResourceIdB);
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 404);
        return true;
      },
    );
  });

  await test('Tenant Isolation: Tenant A cannot download Tenant B file (Returns 404)', async () => {
    await assert.rejects(
      async () => {
        await LearningResourceService.getDownloadUrl(TENANT_A, testResourceIdB);
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 404);
        return true;
      },
    );
  });

  await test('Tenant Isolation: Tenant A cannot update Tenant B resource (Returns 404)', async () => {
    await assert.rejects(
      async () => {
        await LearningResourceService.updateResource(
          TENANT_A,
          testResourceIdB,
          { title: 'Tenant A Malicious Update' },
          null,
        );
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 404);
        return true;
      },
    );
  });

  await test('Tenant Isolation: Tenant A cannot delete Tenant B resource (Returns 404)', async () => {
    await assert.rejects(
      async () => {
        await LearningResourceService.deleteResource(TENANT_A, testResourceIdB);
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 404);
        return true;
      },
    );
  });

  await test('Tenant Isolation: Cross-tenant grade association is rejected (400)', async () => {
    // Look up a grade in Tenant B
    const gradeB = await prisma.grades.findFirst({ where: { org_id: TENANT_B } });
    if (gradeB) {
      await assert.rejects(
        async () => {
          await LearningResourceService.createResource(
            TENANT_A,
            {
              title: 'Cross-Tenant Grade Attempt',
              resource_type: 'external_link',
              external_url: 'https://example.com/cross-tenant',
              grade_ids: [gradeB.grade_id],
            },
            undefined,
            null,
          );
        },
        (err: any) => {
          assert.strictEqual(err.statusCode, 400);
          assert.ok(err.message.includes('do not belong to this organization'));
          return true;
        },
      );
    }
  });

  // --------------------------------------------------------------------------
  // SUITE 5: RESOURCE PREVIEW & DOWNLOAD SIGNED URLS
  // --------------------------------------------------------------------------
  console.log('\n[Suite 5: Resource Preview & Download Signed URLs]');

  await test('LearningResourceService.getPreviewUrl generates signed URL for preview', async () => {
    const preview = await LearningResourceService.getPreviewUrl(TENANT_A, testResourceIdA);
    assert.strictEqual(preview.resource_id, testResourceIdA);
    assert.strictEqual(preview.resource_type, 'file');
    assert.ok(preview.preview_url && preview.preview_url.startsWith('http'));
    assert.ok(preview.expires_at);
  });

  await test('LearningResourceService.getDownloadUrl generates signed URL with original filename', async () => {
    const download = await LearningResourceService.getDownloadUrl(TENANT_A, testResourceIdA);
    assert.strictEqual(download.resource_id, testResourceIdA);
    assert.strictEqual(download.resource_type, 'file');
    assert.strictEqual(download.file_name, 'test_document.pdf');
    assert.ok(download.download_url && download.download_url.startsWith('http'));
    assert.ok(download.expires_at);
  });

  // --------------------------------------------------------------------------
  // SUITE 6: UNSUPPORTED FEATURE HANDLING (HTTP 501 ENFORCEMENT)
  // --------------------------------------------------------------------------
  console.log('\n[Suite 6: Unsupported Feature Handling (HTTP 501 Enforcement)]');

  await test('LearningResourceController.handleSubjectMappingUnsupported returns 501', async () => {
    let statusSent = 0;
    let jsonSent: any = null;
    const mockRes: any = {
      status: (s: number) => {
        statusSent = s;
        return {
          json: (j: any) => {
            jsonSent = j;
            return j;
          },
        };
      },
    };

    await LearningResourceController.handleSubjectMappingUnsupported({} as any, mockRes);
    assert.strictEqual(statusSent, 501);
    assert.strictEqual(jsonSent.error, 'UNSUPPORTED_BY_FINALIZED_DATABASE');
    assert.strictEqual(jsonSent.status, 'UNSUPPORTED BY FINALIZED DATABASE');
  });

  await test('LearningResourceController.handleFrameworkMappingUnsupported returns 501', async () => {
    let statusSent = 0;
    let jsonSent: any = null;
    const mockRes: any = {
      status: (s: number) => {
        statusSent = s;
        return {
          json: (j: any) => {
            jsonSent = j;
            return j;
          },
        };
      },
    };

    await LearningResourceController.handleFrameworkMappingUnsupported({} as any, mockRes);
    assert.strictEqual(statusSent, 501);
    assert.strictEqual(jsonSent.error, 'UNSUPPORTED_BY_FINALIZED_DATABASE');
    assert.strictEqual(jsonSent.status, 'UNSUPPORTED BY FINALIZED DATABASE');
  });

  // --------------------------------------------------------------------------
  // CLEANUP TEST ARTIFACTS
  // --------------------------------------------------------------------------
  console.log('\n[Tear Down: Cleaning up test artifacts]');
  for (const id of createdResourceIdsA) {
    try {
      const res = await LearningResourceRepository.findById(TENANT_A, id);
      if (res?.storage_path) {
        await StorageService.deleteFile(res.storage_path, DEFAULT_RESOURCE_BUCKET).catch(() => {});
      }
      // Direct raw query to delete regardless of status in tear down
      await prisma.$executeRawUnsafe(
        'DELETE FROM learning_resources WHERE resource_id = $1::uuid',
        id,
      );
    } catch {}
  }

  for (const id of createdResourceIdsB) {
    try {
      const res = await LearningResourceRepository.findById(TENANT_B, id);
      if (res?.storage_path) {
        await StorageService.deleteFile(res.storage_path, DEFAULT_RESOURCE_BUCKET).catch(() => {});
      }
      await prisma.$executeRawUnsafe(
        'DELETE FROM learning_resources WHERE resource_id = $1::uuid',
        id,
      );
    } catch {}
  }
  console.log('  ✓ Test artifacts cleaned up successfully');

  console.log('\n===============================================================');
  console.log(`  PHASE 4 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    throw new Error(`Phase 4 test suite failed with ${failed} failure(s)`);
  }
}

if (require.main === module) {
  runAcademicPhase4Tests()
    .then(() => {
      console.log('All Phase 4 tests completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Test execution failed:', err);
      process.exit(1);
    });
}
