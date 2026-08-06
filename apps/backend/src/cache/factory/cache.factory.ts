import { ICacheFactory, ICacheProvider } from '../contracts/cache.contracts';
import {
  InMemoryCacheProvider,
  NoopCacheProvider,
  RedisCacheProvider,
} from '../providers/cache.providers';
import { configuration } from '../../config';

export class CacheFactory implements ICacheFactory {
  public createProvider(name?: string): ICacheProvider {
    const providerName = name || configuration?.cache?.provider || 'memory';

    switch (providerName.toLowerCase()) {
      case 'redis':
        return new RedisCacheProvider();
      case 'noop':
        return new NoopCacheProvider();
      case 'memory':
      default:
        return new InMemoryCacheProvider();
    }
  }
}
