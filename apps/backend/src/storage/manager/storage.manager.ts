import { Readable } from 'stream';
import { IStorageProvider, StorageFilePayload, StoredFileResult } from '../contracts/storage.contracts';
import { StorageFactory } from '../factory/storage.factory';
import { FileValidator } from '../validation/file.validator';
import { StoragePolicy } from '../policies/storage.policies';

export class StorageManager {
  private static instance: StorageManager;
  private provider: IStorageProvider;

  private constructor() {
    const factory = new StorageFactory();
    this.provider = factory.createProvider();
  }

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  public async upload(key: string, payload: StorageFilePayload, policy?: StoragePolicy): Promise<StoredFileResult> {
    FileValidator.validate(payload, policy);
    return this.provider.upload(key, payload);
  }

  public async download(key: string): Promise<Buffer> {
    return this.provider.download(key);
  }

  public async downloadStream(key: string): Promise<Readable> {
    if (this.provider.downloadStream) {
      return this.provider.downloadStream(key);
    }
    const buffer = await this.provider.download(key);
    return Readable.from(buffer);
  }

  public async delete(key: string): Promise<void> {
    await this.provider.delete(key);
  }

  public async exists(key: string): Promise<boolean> {
    return this.provider.exists(key);
  }

  public async getSignedUrl(key: string, expiresInSeconds?: number): Promise<string> {
    return this.provider.getSignedUrl(key, expiresInSeconds);
  }
}

export const storageManager = StorageManager.getInstance();
