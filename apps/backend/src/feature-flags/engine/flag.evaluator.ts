import { FeatureFlagDefinition, EvaluationContext } from '../contracts/feature-flag.contracts';
import {
  UserRule,
  TenantRule,
  RoleRule,
  PercentageRule,
  EnvironmentRule,
} from '../rules/flag.rules';

export class FlagEvaluator {
  private static rules = [
    new EnvironmentRule(),
    new UserRule(),
    new TenantRule(),
    new RoleRule(),
    new PercentageRule(),
  ];

  public static evaluate(flag: FeatureFlagDefinition, context: EvaluationContext): boolean {
    if (!flag.isEnabled) return false;

    for (const rule of this.rules) {
      const result = rule.evaluate(flag, context);
      if (result !== null) {
        return result;
      }
    }

    return flag.isEnabled;
  }
}
