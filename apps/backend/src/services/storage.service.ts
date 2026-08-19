import { supabase } from '../config/supabase';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface StorageUploadParams {
  bucket?: string;
  path: string;
  buffer: Buffer;
  mimeType: string;
}

export interface SignedUrlParams {
  bucket?: string;
  path: string;
  expiresInSeconds?: number;
}

export class StorageService {
  private static defaultBucket = env.SUPABASE_ADMISSION_DOCUMENTS_BUCKET || 'admission-documents';

  /**
   * Upload binary file buffer to private Supabase Storage bucket
   */
  static async uploadFile({ bucket, path, buffer, mimeType }: StorageUploadParams) {
    const targetBucket = bucket || this.defaultBucket;
    try {
      const { data, error } = await supabase.storage.from(targetBucket).upload(path, buffer, {
        contentType: mimeType,
        upsert: true,
      });

      if (error) {
        logger.error(`[StorageService] Upload failed for path ${path}`, {
          error: error.message,
          bucket: targetBucket,
        });
        throw new Error(`Storage upload failed: ${error.message}`);
      }

      logger.info(`[StorageService] Binary uploaded successfully: ${path}`, {
        bucket: targetBucket,
        path,
      });
      return { path: data?.path || path, fullPath: data?.fullPath || `${targetBucket}/${path}` };
    } catch (err: any) {
      logger.error(`[StorageService] Exception during file upload to ${path}`, {
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Generate short-lived signed download URL for private storage object
   */
  static async getSignedUrl({ bucket, path, expiresInSeconds = 3600 }: SignedUrlParams) {
    const targetBucket = bucket || this.defaultBucket;
    if (!path || typeof path !== 'string' || !path.trim()) {
      throw new Error('Invalid storage path provided for signed URL generation');
    }

    // Direct HTTP(S) URLs require no storage signing
    if (path.startsWith('http://') || path.startsWith('https://')) {
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
      return { signedUrl: path, expiresAt };
    }

    // Normalize path: strip leading slashes and redundant bucket prefix
    let cleanPath = path.trim().replace(/^[/\\]+/, '');
    if (cleanPath.startsWith(targetBucket + '/')) {
      cleanPath = cleanPath.substring(targetBucket.length + 1);
    }

    try {
      let { data, error } = await supabase.storage
        .from(targetBucket)
        .createSignedUrl(cleanPath, expiresInSeconds);

      // Auto-create bucket if missing
      if (
        error &&
        (error.message?.includes('Bucket not found') ||
          (error as any).statusCode === 404 ||
          (error as any).statusCode === '404')
      ) {
        try {
          await supabase.storage.createBucket(targetBucket, { public: false });
          const retry = await supabase.storage
            .from(targetBucket)
            .createSignedUrl(cleanPath, expiresInSeconds);
          data = retry.data;
          error = retry.error;
        } catch (bErr: any) {
          logger.warn(`[StorageService] Failed auto-creating bucket ${targetBucket}`, {
            error: bErr?.message,
          });
        }
      }

      if (error || !data?.signedUrl) {
        logger.error(`[StorageService] Signed URL generation failed for ${cleanPath}`, {
          error: error?.message,
          bucket: targetBucket,
        });
        throw new Error(`Failed to generate signed URL: ${error?.message || 'Unknown storage error'}`);
      }

      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
      return { signedUrl: data.signedUrl, expiresAt };
    } catch (err: any) {
      logger.error(`[StorageService] Exception generating signed URL for ${cleanPath}`, {
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Delete object from private storage bucket
   */
  static async deleteFile(path: string, bucket?: string) {
    const targetBucket = bucket || this.defaultBucket;
    try {
      const { data, error } = await supabase.storage.from(targetBucket).remove([path]);
      if (error) {
        logger.warn(`[StorageService] Failed to delete object ${path} from storage`, {
          error: error.message,
        });
      } else {
        logger.info(`[StorageService] Object deleted from storage: ${path}`, {
          bucket: targetBucket,
        });
      }
      return data;
    } catch (err: any) {
      logger.warn(`[StorageService] Error removing storage object ${path}`, { error: err.message });
    }
  }
}
