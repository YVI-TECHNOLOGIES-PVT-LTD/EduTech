import { IFeatureFlagProvider } from '../contracts/feature-flag.contracts';
import {
  LocalFeatureFlagProvider,
  MemoryFeatureFlagProvider,
  RedisFeatureFlagProvider,
  NoopFeatureFlagProvider,
} from '../providers/flag.providers';
import { configuration } from '../../config';

export class FeatureFlagFactory {
  public createProvider(name?: string): IFeatureFlagProvider {
    const providerName = name || (configuration as any)?.featureFlag?.provider || 'local';

    switch (providerName.toLowerCase()) {
      case 'redis':
        return new RedisFeatureFlagProvider();
      case 'memory':
        return new MemoryFeatureFlagProvider();
      case 'noop':
        return new NoopFeatureFlagProvider();
      case 'local':
      default:
        return new LocalFeatureFlagProvider();
    }
  }
}
