import { SecureStorageService } from '../core/storage/secure-store';

export class StorageHelper {
  static async get<T>(key: string): Promise<T | null> {
    return await SecureStorageService.getObject<T>(key);
  }

  static async set<T>(key: string, value: T): Promise<void> {
    await SecureStorageService.setObject<T>(key, value);
  }

  static async remove(key: string): Promise<void> {
    await SecureStorageService.removeItem(key);
  }
}
