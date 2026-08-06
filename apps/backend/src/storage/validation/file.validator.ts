import { StorageFilePayload } from '../contracts/storage.contracts';
import { StoragePolicy } from '../policies/storage.policies';

export class FileValidator {
  public static validate(payload: StorageFilePayload, policy?: StoragePolicy): void {
    const maxSize = policy?.maxSizeBytes || 10 * 1024 * 1024;
    const allowedMime = policy?.allowedMimeTypes || ['image/jpeg', 'image/png', 'application/pdf'];

    if (payload.size > maxSize) {
      throw new Error(`File size ${payload.size} bytes exceeds maximum allowed limit of ${maxSize} bytes`);
    }

    if (!allowedMime.includes(payload.mimetype.toLowerCase())) {
      throw new Error(`MIME type '${payload.mimetype}' is not permitted. Allowed: ${allowedMime.join(', ')}`);
    }
  }
}
