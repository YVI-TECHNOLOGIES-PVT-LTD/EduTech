import {
  IFeatureFlagProvider,
  FeatureFlagCapabilities,
  FeatureFlagDefinition,
} from '../contracts/feature-flag.contracts';
import { FeatureFlagRegistry } from '../registry/flag.registry';

export class MemoryFeatureFlagProvider implements IFeatureFlagProvider {
  public readonly name = 'memory';
  public readonly capabilities: FeatureFlagCapabilities = {
    supportsPercentageRollouts: true,
    supportsVariants: true,
    supportsScheduledRollouts: true,
    supportsTargetingRules: true,
  };

  private store = new Map<string, FeatureFlagDefinition>();

  constructor() {
    FeatureFlagRegistry.getAll().forEach((flag) => this.store.set(flag.key, flag));
  }

  public async getFlag(key: string): Promise<FeatureFlagDefinition | null> {
    return this.store.get(key) || null;
  }

  public async getAllFlags(): Promise<FeatureFlagDefinition[]> {
    return Array.from(this.store.values());
  }

  public async setFlag(definition: FeatureFlagDefinition): Promise<void> {
    this.store.set(definition.key, definition);
  }

  public async ping(): Promise<boolean> {
    return true;
  }
}

export class NoopFeatureFlagProvider implements IFeatureFlagProvider {
  public readonly name = 'noop';
  public readonly capabilities: FeatureFlagCapabilities = {
    supportsPercentageRollouts: false,
    supportsVariants: false,
    supportsScheduledRollouts: false,
    supportsTargetingRules: false,
  };

  public async getFlag(_key: string): Promise<FeatureFlagDefinition | null> {
    return null;
  }
  public async getAllFlags(): Promise<FeatureFlagDefinition[]> {
    return [];
  }
  public async setFlag(_definition: FeatureFlagDefinition): Promise<void> {}
  public async ping(): Promise<boolean> {
    return true;
  }
}

export class LocalFeatureFlagProvider extends MemoryFeatureFlagProvider {
  public override readonly name = 'local';
}

export class RedisFeatureFlagProvider extends MemoryFeatureFlagProvider {
  public override readonly name = 'redis';
}
