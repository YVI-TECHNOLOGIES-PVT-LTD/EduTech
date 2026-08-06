import crypto from 'crypto';
import {
  FeatureFlagDefinition,
  FeatureFlagVariant,
  EvaluationContext,
} from '../contracts/feature-flag.contracts';

export class VariantEngine {
  public static resolveVariant(
    flag: FeatureFlagDefinition,
    context: EvaluationContext,
  ): FeatureFlagVariant | null {
    if (!flag.variants || flag.variants.length === 0) return null;

    const seed = `${flag.key}:variant:${context.userId || context.tenantId || 'anon'}`;
    const hash = crypto.createHash('md5').update(seed).digest('hex');
    const numeric = parseInt(hash.substring(0, 8), 16);
    const bucket = (numeric % 100) + 1;

    let cumulative = 0;
    for (const variant of flag.variants) {
      cumulative += variant.weight;
      if (bucket <= cumulative) {
        return variant;
      }
    }

    return flag.variants[0];
  }
}
