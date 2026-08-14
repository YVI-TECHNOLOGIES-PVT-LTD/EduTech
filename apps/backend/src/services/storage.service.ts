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
    try {
      const { data, error } = await supabase.storage
        .from(targetBucket)
        .createSignedUrl(path, expiresInSeconds);

      if (error || !data?.signedUrl) {
        logger.error(`[StorageService] Signed URL generation failed for ${path}`, {
          error: error?.message,
          bucket: targetBucket,
        });
        throw new Error(`Failed to generate signed URL: ${error?.message || 'Unknown error'}`);
      }

      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
      return { signedUrl: data.signedUrl, expiresAt };
    } catch (err: any) {
      logger.error(`[StorageService] Exception generating signed URL for ${path}`, {
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
