import prisma from '../../../lib/prismaClient';
import { StorageService } from '../../../services/storage.service';
import { UserAvatarRepository } from '../repositories/user-avatar.repository';
import { detectBufferMimeType } from '../../../middlewares/upload.middleware';
import {
  ApplicationValidationError,
  ApplicationForbiddenError,
} from '../../admission-management/errors/admission.errors';
import { logger } from '../../../utils/logger';

const PROFILE_PHOTOS_BUCKET = 'profile-photos';
const ALLOWED_AVATAR_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_AVATAR_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

export interface UserContext {
  id: string;
  email?: string;
  org_id?: string;
  school_id?: string;
  roles?: string[];
  permissions?: string[];
}

export class UserAvatarService {
  /**
   * Validate image file for profile photo upload.
   * Restricts to image/jpeg, image/png, image/webp and verifies magic bytes.
   */
  public static validateAvatarFile(file?: Express.Multer.File): void {
    if (!file || !file.buffer) {
      throw new ApplicationValidationError('Image binary is required');
    }

    const mimeType = (file.mimetype || '').toLowerCase();
    const ext = (file.originalname || '').split('.').pop()?.toLowerCase() || '';

    if (!ALLOWED_AVATAR_MIMES.has(mimeType) || !ALLOWED_AVATAR_EXTENSIONS.has(ext)) {
      throw new ApplicationValidationError(
        `Invalid image format '${file.mimetype}'. Only JPEG, PNG, and WEBP image files are allowed. PDFs and SVGs are rejected.`,
      );
    }

    const detectedMime = detectBufferMimeType(file.buffer);
    if (!detectedMime || !ALLOWED_AVATAR_MIMES.has(detectedMime)) {
      throw new ApplicationValidationError(
        `File signature check failed. Content signature (${detectedMime || 'unknown'}) is not a valid JPEG, PNG, or WEBP image.`,
      );
    }

    // Size limit check (max 5 MB for profile avatar)
    if (file.size > 5 * 1024 * 1024) {
      throw new ApplicationValidationError('Profile photo file size exceeds maximum 5 MB limit.');
    }
  }

  /**
   * Check authorization & multi-tenant isolation for profile photo changes.
   */
  public static async authorizeUserAction(
    targetUserId: string,
    currentUser: UserContext,
  ): Promise<{ targetUserOrgId: string }> {
    if (!targetUserId) {
      throw new ApplicationValidationError('Target User ID is required');
    }

    const isUuid = (str?: string) =>
      !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    if (!isUuid(targetUserId)) {
      throw new ApplicationValidationError(`Invalid User ID UUID format: ${targetUserId}`);
    }

    const targetUser = await prisma.users.findUnique({
      where: { user_id: targetUserId },
      select: { user_id: true, org_id: true, status: true },
    });

    if (!targetUser) {
      throw new ApplicationValidationError(`User not found: ${targetUserId}`);
    }

    const userOrgId = currentUser.org_id || currentUser.school_id;

    // Tenant Isolation
    if (userOrgId && targetUser.org_id !== userOrgId) {
      throw new ApplicationForbiddenError('Cross-organization profile photo access rejected');
    }

    // Self-service vs Admin/Staff RBAC
    const isSelf = currentUser.id === targetUserId;
    const isStaffOrAdmin = (currentUser.roles || []).some((r) =>
      ['SUPERADMIN', 'ADMIN', 'ORG_ADMIN', 'HOI', 'STAFF', 'FACULTY'].includes(r),
    );

    if (!isSelf && !isStaffOrAdmin) {
      throw new ApplicationForbiddenError(
        "You are not authorized to update another user's profile photo",
      );
    }

    return { targetUserOrgId: targetUser.org_id };
  }

  /**
   * Upload & change a user's profile photo.
   */
  static async uploadAvatar(
    targetUserId: string,
    file: Express.Multer.File,
    currentUser: UserContext,
  ) {
    // 1. Validate image format & signature
    this.validateAvatarFile(file);

    // 2. Authorize & verify tenant isolation
    await this.authorizeUserAction(targetUserId, currentUser);

    // 3. Fetch current avatar path for cleanup later if replacing
    const oldAvatarPath = await UserAvatarRepository.getAvatarPath(targetUserId);

    // 4. Construct storage path: profile-photos/{user_id}/avatar.{ext}
    const rawExt = (file.originalname || '').split('.').pop()?.toLowerCase() || 'jpg';
    const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
    const objectKey = `${targetUserId}/avatar.${ext}`;
    const fullStoragePath = `${PROFILE_PHOTOS_BUCKET}/${objectKey}`;

    // 5. Upload file buffer to private profile-photos bucket
    try {
      await StorageService.uploadFile({
        bucket: PROFILE_PHOTOS_BUCKET,
        path: objectKey,
        buffer: file.buffer,
        mimeType: file.mimetype,
      });
    } catch (err: any) {
      logger.error(`[UserAvatarService] Failed storage upload for user ${targetUserId}`, {
        error: err.message,
      });
      throw new ApplicationValidationError(`Storage upload failed: ${err.message}`);
    }

    // 6. Save relative object path to users.avatar_url in PostgreSQL
    try {
      await UserAvatarRepository.updateAvatarPath(targetUserId, fullStoragePath);
    } catch (dbErr: any) {
      // Compensating Storage Cleanup: If DB update fails, clean up newly uploaded binary
      logger.error(
        `[UserAvatarService] DB update failed for ${targetUserId}. Cleaning up uploaded object.`,
        {
          error: dbErr.message,
        },
      );
      try {
        await StorageService.deleteFile(objectKey, PROFILE_PHOTOS_BUCKET);
      } catch (cleanErr: any) {
        logger.warn(
          `[UserAvatarService] Storage cleanup failed after DB error: ${cleanErr.message}`,
        );
      }
      throw dbErr;
    }

    // 7. Replacement safety: Clean up old storage object if path changed
    if (oldAvatarPath && oldAvatarPath !== fullStoragePath) {
      const cleanOldKey = oldAvatarPath.replace(/^profile-photos\//, '');
      if (cleanOldKey !== objectKey) {
        try {
          await StorageService.deleteFile(cleanOldKey, PROFILE_PHOTOS_BUCKET);
          logger.info(`[UserAvatarService] Cleaned up previous avatar object: ${cleanOldKey}`);
        } catch (cleanErr: any) {
          logger.warn(
            `[UserAvatarService] Failed cleaning old avatar object ${cleanOldKey}: ${cleanErr.message}`,
          );
        }
      }
    }

    // 8. Generate short-lived signed URL for display response
    const signedResult = await StorageService.getSignedUrl({
      bucket: PROFILE_PHOTOS_BUCKET,
      path: objectKey,
      expiresInSeconds: 3600,
    });

    return {
      user_id: targetUserId,
      avatar_url: signedResult.signedUrl,
      expires_at: signedResult.expiresAt,
    };
  }

  /**
   * Delete user profile photo.
   */
  static async deleteAvatar(targetUserId: string, currentUser: UserContext) {
    await this.authorizeUserAction(targetUserId, currentUser);

    const oldAvatarPath = await UserAvatarRepository.getAvatarPath(targetUserId);

    if (oldAvatarPath) {
      const cleanOldKey = oldAvatarPath.replace(/^profile-photos\//, '');
      try {
        await StorageService.deleteFile(cleanOldKey, PROFILE_PHOTOS_BUCKET);
      } catch (cleanErr: any) {
        logger.warn(
          `[UserAvatarService] Failed removing storage object ${cleanOldKey}: ${cleanErr.message}`,
        );
      }
    }

    await UserAvatarRepository.clearAvatarPath(targetUserId);

    return {
      user_id: targetUserId,
      avatar_url: null,
    };
  }

  /**
   * Resolve a temporary signed URL from a stored users.avatar_url path.
   */
  static async getAvatarSignedUrl(avatarPath: string | null): Promise<string | null> {
    if (!avatarPath || typeof avatarPath !== 'string' || !avatarPath.trim()) {
      return null;
    }

    // Direct HTTP URLs return directly
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
      return avatarPath;
    }

    const cleanPath = avatarPath.trim().replace(/^[/\\]+/, '');
    const cleanObjectKey = cleanPath.replace(/^profile-photos\//, '');

    try {
      const result = await StorageService.getSignedUrl({
        bucket: PROFILE_PHOTOS_BUCKET,
        path: cleanObjectKey,
        expiresInSeconds: 3600,
      });
      return result.signedUrl;
    } catch (err: any) {
      logger.warn(`[UserAvatarService] Failed resolving signed URL for avatar path ${avatarPath}`, {
        error: err.message,
      });
      return null;
    }
  }
}
