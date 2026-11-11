import crypto from 'crypto';
import { logger } from '../../../utils/logger';
import { EventBus } from '../../../workflows/event-bus.service';
import { StorageService } from '../../../services/storage.service';
import {
  LearningResourceRepository,
  LearningResourceRow,
  ResourceCategoryRow,
} from '../repositories/learning-resource.repository';
import {
  createResourceSchema,
  CreateResourceDto,
  CreateResourceInput,
} from '../dto/request/create-resource.dto';
import { UpdateResourceDto } from '../dto/request/update-resource.dto';
import { ListResourcesDto } from '../dto/request/search-resource.dto';
import { AcademicError } from '../errors/academic.errors';
import { validateFileBufferSignature } from '../../../middlewares/upload.middleware';

export const ALLOWED_RESOURCE_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const ALLOWED_RESOURCE_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png', 'webp']);

export const MAX_RESOURCE_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const DEFAULT_RESOURCE_BUCKET = 'edutrack-learning-resources';

function serializeResource(r: LearningResourceRow) {
  return {
    ...r,
    file_size_bytes:
      r.file_size_bytes !== null && r.file_size_bytes !== undefined
        ? Number(r.file_size_bytes)
        : null,
  };
}

export class LearningResourceService {
  /**
   * List paginated resources for an organization with filtering and sorting
   */
  static async listResources(orgId: string, filters: ListResourcesDto) {
    const items = await LearningResourceRepository.findMany(orgId, filters);
    const total = await LearningResourceRepository.count(orgId, filters);
    const limit = filters.limit || 20;
    const page = filters.page || 1;
    const totalPages = Math.ceil(total / limit);

    return {
      items: items.map(serializeResource),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Get resource details by ID and organization
   */
  static async getResourceById(orgId: string, resourceId: string) {
    const resource = await LearningResourceRepository.findById(orgId, resourceId);
    if (!resource) {
      throw new AcademicError(
        `Learning resource '${resourceId}' not found in organization`,
        404,
        'NOT_FOUND',
      );
    }
    return serializeResource(resource);
  }

  /**
   * Create / upload a new resource with durable PostgreSQL and Supabase persistence
   */
  static async createResource(
    orgId: string,
    rawDto: CreateResourceInput,
    file?: Express.Multer.File,
    userId?: string | null,
  ) {
    const dto = createResourceSchema.parse(rawDto);
    // 1. Resolve uploader staff ID
    let staffId = dto.uploaded_by_staff_id;
    if (staffId) {
      const staff = await LearningResourceRepository.findStaffById(orgId, staffId);
      if (!staff) {
        throw new AcademicError(
          `Uploader staff '${staffId}' does not belong to active staff of this organization`,
          400,
          'INVALID_STAFF',
        );
      }
    } else if (userId) {
      const userStaff = await LearningResourceRepository.findStaffByUserId(orgId, userId);
      if (userStaff) {
        staffId = userStaff.staff_id;
      }
    }

    if (!staffId) {
      const fallbackStaff = await LearningResourceRepository.findFirstActiveStaff(orgId);
      if (fallbackStaff) {
        staffId = fallbackStaff.staff_id;
      } else {
        throw new AcademicError(
          'No active staff member found in organization to associate as resource uploader',
          400,
          'NO_ACTIVE_STAFF',
        );
      }
    }

    // 2. Validate category if provided
    if (dto.category_id) {
      const cat = await LearningResourceRepository.findCategoryById(orgId, dto.category_id);
      if (!cat) {
        throw new AcademicError(
          `Resource category '${dto.category_id}' does not exist in organization`,
          400,
          'INVALID_CATEGORY',
        );
      }
    }

    // 3. Validate grade associations if provided
    if (dto.grade_ids && dto.grade_ids.length > 0) {
      const valid = await LearningResourceRepository.validateGradesBelongToOrg(
        orgId,
        dto.grade_ids,
      );
      if (!valid) {
        throw new AcademicError(
          'One or more specified grade IDs do not belong to this organization',
          400,
          'INVALID_GRADE',
        );
      }
    }

    const resourceId = crypto.randomUUID();

    // 4. Handle file upload vs external link
    if (dto.resource_type === 'file') {
      if (!file || !file.buffer) {
        throw new AcademicError(
          'Binary file payload is required when resource_type is file',
          400,
          'FILE_REQUIRED',
        );
      }

      // File size validation
      if (file.size > MAX_RESOURCE_FILE_SIZE) {
        throw new AcademicError(
          `File size (${file.size} bytes) exceeds 10MB limit`,
          400,
          'FILE_TOO_LARGE',
        );
      }

      // MIME type and extension validation
      const ext = (file.originalname || '').split('.').pop()?.toLowerCase() || '';
      const mime = (file.mimetype || '').toLowerCase();

      if (!ALLOWED_RESOURCE_MIME_TYPES.has(mime) || !ALLOWED_RESOURCE_EXTENSIONS.has(ext)) {
        throw new AcademicError(
          `Invalid file format '${file.mimetype}'. Only PDF, JPEG, PNG, and WEBP files are permitted.`,
          400,
          'INVALID_FILE_TYPE',
        );
      }

      // Magic byte signature validation
      try {
        validateFileBufferSignature(file);
      } catch (err: any) {
        throw new AcademicError(err.message, 400, 'INVALID_FILE_SIGNATURE');
      }

      // Generate collision-safe storage destination
      const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `org_${orgId}/resources/${resourceId}/${cleanFileName}`;
      const bucket = DEFAULT_RESOURCE_BUCKET;

      // Upload binary to Supabase Storage
      await StorageService.uploadFile({
        bucket,
        path: storagePath,
        buffer: file.buffer,
        mimeType: mime,
      });

      // Persist metadata to PostgreSQL with automatic cleanup on failure
      let createdRow: LearningResourceRow;
      try {
        createdRow = await LearningResourceRepository.create({
          resourceId,
          orgId,
          title: dto.title,
          description: dto.description,
          resourceType: 'file',
          storageBucket: bucket,
          storagePath,
          fileName: file.originalname,
          fileSizeBytes: file.size,
          mimeType: mime,
          externalUrl: null,
          categoryId: dto.category_id,
          uploadedByStaffId: staffId,
          resourceStatus: dto.resource_status || 'draft',
          createdBy: userId,
        });

        if (dto.grade_ids && dto.grade_ids.length > 0) {
          await LearningResourceRepository.syncGrades(orgId, resourceId, dto.grade_ids);
        }
      } catch (dbErr: any) {
        // Rollback storage object on database write failure
        logger.error(
          `[LearningResourceService] Database persistence failed for resource ${resourceId}. Cleaning up storage object ${storagePath}`,
          { error: dbErr.message },
        );
        await StorageService.deleteFile(storagePath, bucket).catch(() => {});
        throw dbErr;
      }

      logger.info(
        `Learning resource created: ${resourceId} (${dto.title}) in org ${orgId} by staff ${staffId}`,
        { resourceId, orgId, staffId, performedBy: userId },
      );

      EventBus.publish('academic.resource.created', {
        resourceId,
        title: dto.title,
        orgId,
        resourceType: 'file',
        timestamp: new Date().toISOString(),
      });

      const fullResource = await LearningResourceRepository.findById(orgId, resourceId);
      return serializeResource(fullResource || createdRow);
    } else {
      // External link resource
      if (!dto.external_url) {
        throw new AcademicError(
          'external_url is required when resource_type is external_link',
          400,
          'URL_REQUIRED',
        );
      }

      const createdRow = await LearningResourceRepository.create({
        resourceId,
        orgId,
        title: dto.title,
        description: dto.description,
        resourceType: 'external_link',
        storageBucket: null,
        storagePath: null,
        fileName: null,
        fileSizeBytes: null,
        mimeType: null,
        externalUrl: dto.external_url,
        categoryId: dto.category_id,
        uploadedByStaffId: staffId,
        resourceStatus: dto.resource_status || 'draft',
        createdBy: userId,
      });

      if (dto.grade_ids && dto.grade_ids.length > 0) {
        await LearningResourceRepository.syncGrades(orgId, resourceId, dto.grade_ids);
      }

      logger.info(`External link resource created: ${resourceId} (${dto.title}) in org ${orgId}`, {
        resourceId,
        orgId,
        staffId,
        performedBy: userId,
      });

      EventBus.publish('academic.resource.created', {
        resourceId,
        title: dto.title,
        orgId,
        resourceType: 'external_link',
        timestamp: new Date().toISOString(),
      });

      const fullResource = await LearningResourceRepository.findById(orgId, resourceId);
      return serializeResource(fullResource || createdRow);
    }
  }

  /**
   * Update existing resource metadata
   */
  static async updateResource(
    orgId: string,
    resourceId: string,
    dto: UpdateResourceDto,
    userId?: string | null,
  ) {
    const existing = await LearningResourceRepository.findById(orgId, resourceId);
    if (!existing) {
      throw new AcademicError(
        `Learning resource '${resourceId}' not found in organization`,
        404,
        'NOT_FOUND',
      );
    }

    // Validate lifecycle transitions
    if (
      existing.resource_status === 'archived' &&
      dto.resource_status &&
      dto.resource_status !== 'archived'
    ) {
      throw new AcademicError(
        `Archived resource '${resourceId}' cannot be unarchived. Create a new resource instead.`,
        400,
        'CANNOT_UNARCHIVE',
      );
    }

    if (existing.resource_status === 'published' && dto.resource_status === 'draft') {
      throw new AcademicError(
        `Published resource '${resourceId}' cannot be returned to draft status.`,
        400,
        'CANNOT_REVERT_TO_DRAFT',
      );
    }

    // Validate category
    if (dto.category_id) {
      const cat = await LearningResourceRepository.findCategoryById(orgId, dto.category_id);
      if (!cat) {
        throw new AcademicError(
          `Resource category '${dto.category_id}' does not exist in organization`,
          400,
          'INVALID_CATEGORY',
        );
      }
    }

    // Validate grades
    if (dto.grade_ids !== undefined) {
      const valid = await LearningResourceRepository.validateGradesBelongToOrg(
        orgId,
        dto.grade_ids,
      );
      if (!valid) {
        throw new AcademicError(
          'One or more specified grade IDs do not belong to this organization',
          400,
          'INVALID_GRADE',
        );
      }
    }

    const updated = await LearningResourceRepository.update(orgId, resourceId, {
      title: dto.title,
      description: dto.description,
      categoryId: dto.category_id,
      resourceStatus: dto.resource_status,
      updatedBy: userId,
    });

    if (dto.grade_ids !== undefined) {
      await LearningResourceRepository.syncGrades(orgId, resourceId, dto.grade_ids);
    }

    logger.info(`Learning resource updated: ${resourceId} in org ${orgId}`, {
      resourceId,
      orgId,
      performedBy: userId,
    });

    EventBus.publish('academic.resource.updated', {
      resourceId,
      orgId,
      timestamp: new Date().toISOString(),
    });

    const fullResource = await LearningResourceRepository.findById(orgId, resourceId);
    return serializeResource(fullResource || updated!);
  }

  /**
   * Archive a resource (soft deletion / status transition to 'archived')
   */
  static async archiveResource(orgId: string, resourceId: string, userId?: string | null) {
    const existing = await LearningResourceRepository.findById(orgId, resourceId);
    if (!existing) {
      throw new AcademicError(
        `Learning resource '${resourceId}' not found in organization`,
        404,
        'NOT_FOUND',
      );
    }

    const archived = await LearningResourceRepository.archive(orgId, resourceId, userId);

    logger.info(`Learning resource archived: ${resourceId} in org ${orgId}`, {
      resourceId,
      orgId,
      performedBy: userId,
    });

    EventBus.publish('academic.resource.archived', {
      resourceId,
      orgId,
      timestamp: new Date().toISOString(),
    });

    return serializeResource(archived!);
  }

  /**
   * Delete resource (metadata + storage object with safe cleanup)
   */
  static async deleteResource(orgId: string, resourceId: string) {
    const existing = await LearningResourceRepository.findById(orgId, resourceId);
    if (!existing) {
      throw new AcademicError(
        `Learning resource '${resourceId}' not found in organization`,
        404,
        'NOT_FOUND',
      );
    }

    if (existing.resource_status === 'published') {
      throw new AcademicError(
        `Published resource '${resourceId}' cannot be hard-deleted. Please archive the resource instead.`,
        400,
        'CANNOT_DELETE_PUBLISHED',
      );
    }

    // 1. Delete from PostgreSQL
    await LearningResourceRepository.delete(orgId, resourceId);

    // 2. Delete storage object if present
    if (existing.storage_path && existing.storage_bucket) {
      await StorageService.deleteFile(existing.storage_path, existing.storage_bucket).catch(
        (err) => {
          logger.warn(
            `[LearningResourceService] Failed removing storage file ${existing.storage_path}: ${err.message}`,
          );
        },
      );
    }

    logger.info(`Learning resource deleted: ${resourceId} in org ${orgId}`, {
      resourceId,
      orgId,
    });

    EventBus.publish('academic.resource.deleted', {
      resourceId,
      orgId,
      timestamp: new Date().toISOString(),
    });

    return { success: true, message: 'Resource deleted successfully' };
  }

  /**
   * Generate short-lived signed preview URL
   */
  static async getPreviewUrl(orgId: string, resourceId: string) {
    const resource = await LearningResourceRepository.findById(orgId, resourceId);
    if (!resource) {
      throw new AcademicError(
        `Learning resource '${resourceId}' not found in organization`,
        404,
        'NOT_FOUND',
      );
    }

    if (resource.resource_type === 'external_link') {
      return {
        resource_id: resource.resource_id,
        resource_type: 'external_link',
        preview_url: resource.external_url,
        expires_at: null,
      };
    }

    if (!resource.storage_path) {
      throw new AcademicError(
        `Resource '${resourceId}' does not have an associated storage object`,
        404,
        'STORAGE_OBJECT_NOT_FOUND',
      );
    }

    const bucket = resource.storage_bucket || DEFAULT_RESOURCE_BUCKET;
    const signed = await StorageService.getSignedUrl({
      bucket,
      path: resource.storage_path,
      expiresInSeconds: 600, // 10 minutes preview
    });

    return {
      resource_id: resource.resource_id,
      resource_type: 'file',
      preview_url: signed.signedUrl,
      expires_at: signed.expiresAt,
      mime_type: resource.mime_type,
    };
  }

  /**
   * Generate short-lived signed download URL
   */
  static async getDownloadUrl(orgId: string, resourceId: string) {
    const resource = await LearningResourceRepository.findById(orgId, resourceId);
    if (!resource) {
      throw new AcademicError(
        `Learning resource '${resourceId}' not found in organization`,
        404,
        'NOT_FOUND',
      );
    }

    if (resource.resource_type === 'external_link') {
      return {
        resource_id: resource.resource_id,
        resource_type: 'external_link',
        download_url: resource.external_url,
        file_name: null,
        expires_at: null,
      };
    }

    if (!resource.storage_path) {
      throw new AcademicError(
        `Resource '${resourceId}' does not have an associated storage object`,
        404,
        'STORAGE_OBJECT_NOT_FOUND',
      );
    }

    const bucket = resource.storage_bucket || DEFAULT_RESOURCE_BUCKET;
    const signed = await StorageService.getSignedUrl({
      bucket,
      path: resource.storage_path,
      expiresInSeconds: 3600, // 1 hour download
    });

    return {
      resource_id: resource.resource_id,
      resource_type: 'file',
      download_url: signed.signedUrl,
      file_name: resource.file_name,
      file_size_bytes:
        resource.file_size_bytes !== null && resource.file_size_bytes !== undefined
          ? Number(resource.file_size_bytes)
          : null,
      expires_at: signed.expiresAt,
    };
  }

  /**
   * List active resource categories for an organization
   */
  static async listCategories(orgId: string): Promise<ResourceCategoryRow[]> {
    return LearningResourceRepository.findCategories(orgId);
  }
}
