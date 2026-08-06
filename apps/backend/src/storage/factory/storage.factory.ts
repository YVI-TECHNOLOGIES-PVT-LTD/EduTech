import { IStorageProvider } from '../contracts/storage.contracts';
import { LocalStorageProvider, MemoryStorageProvider, NoopStorageProvider, S3StorageProvider } from '../providers/storage.providers';
import { configuration } from '../../config';

export class StorageFactory {
  public createProvider(name?: string): IStorageProvider {
    const providerName = name || (configuration as any)?.storage?.provider || 'local';

    switch (providerName.toLowerCase()) {
      case 's3':
        return new S3StorageProvider();
      case 'memory':
        return new MemoryStorageProvider();
      case 'noop':
        return new NoopStorageProvider();
      case 'local':
      default:
        return new LocalStorageProvider();
    }
  }
}
