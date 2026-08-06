import {
  IFeatureFlagProvider,
  EvaluationContext,
  FeatureFlagVariant,
  FeatureFlagDefinition,
} from '../contracts/feature-flag.contracts';
import { FeatureFlagFactory } from '../factory/feature-flag.factory';
import { FlagEvaluator } from '../engine/flag.evaluator';
import { VariantEngine } from '../variants/variant.engine';
import { DependencyResolver } from '../dependencies/dependency.resolver';
import { cacheManager } from '../../cache/manager/cache.manager';
import { FeatureFlagEvents, FeatureFlagEventType } from '../events/feature-flag.events';
import { FeatureFlagAuditLogger } from '../audit/flag.audit';

export class FeatureFlagManager {
  private static instance: FeatureFlagManager;
  private provider: IFeatureFlagProvider;
  private overrides = new Map<string, boolean>();

  private constructor() {
    const factory = new FeatureFlagFactory();
    this.provider = factory.createProvider();
  }

  public static getInstance(): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      FeatureFlagManager.instance = new FeatureFlagManager();
    }
    return FeatureFlagManager.instance;
  }

  public async isEnabled(key: string, context: EvaluationContext = {}): Promise<boolean> {
    // 1. Local Override check
    if (this.overrides.has(key)) {
      return this.overrides.get(key)!;
    }

    // 2. Cache Lookup (sub-millisecond speed via Phase 2.8 CacheManager)
    const cacheKey = `flag:${key}:${context.tenantId || 'global'}:${context.userId || 'anon'}`;
    const cached = await cacheManager.get<boolean>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // 3. Provider & Evaluation Engine execution
    const flag = await this.provider.getFlag(key);
    if (!flag) {
      return false;
    }

    // 4. Dependency Resolution Check
    const depsOk = DependencyResolver.areDependenciesSatisfied(flag, (depKey) => flag.isEnabled);
    if (!depsOk) {
      return false;
    }

    const decision = FlagEvaluator.evaluate(flag, context);

    // 5. Store in Cache (5 minutes TTL)
    await cacheManager.set(cacheKey, decision, { ttlSeconds: 300 });

    FeatureFlagEvents.emit(FeatureFlagEventType.EVALUATED, key, decision, context);
    return decision;
  }

  public async getVariant(
    key: string,
    context: EvaluationContext = {},
  ): Promise<FeatureFlagVariant | null> {
    const flag = await this.provider.getFlag(key);
    if (!flag || !flag.isEnabled) return null;
    return VariantEngine.resolveVariant(flag, context);
  }

  public overrideFlag(key: string, value: boolean, who = 'system', reason?: string): void {
    const oldVal = this.overrides.get(key) ?? false;
    this.overrides.set(key, value);
    FeatureFlagAuditLogger.logChange({
      flagKey: key,
      who,
      when: new Date(),
      oldValue: oldVal,
      newValue: value,
      reason,
    });
  }

  public async getAllFlags(): Promise<FeatureFlagDefinition[]> {
    return this.provider.getAllFlags();
  }
}

export const featureFlagManager = FeatureFlagManager.getInstance();
