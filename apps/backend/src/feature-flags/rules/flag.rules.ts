import crypto from 'crypto';
import { FeatureFlagDefinition, EvaluationContext } from '../contracts/feature-flag.contracts';

export interface IRule {
  evaluate(flag: FeatureFlagDefinition, context: EvaluationContext): boolean | null;
}

export class TenantRule implements IRule {
  public evaluate(flag: FeatureFlagDefinition, context: EvaluationContext): boolean | null {
    if (!flag.tenants || flag.tenants.length === 0) return null;
    if (!context.tenantId) return false;
    return flag.tenants.includes(context.tenantId);
  }
}

export class RoleRule implements IRule {
  public evaluate(flag: FeatureFlagDefinition, context: EvaluationContext): boolean | null {
    if (!flag.roles || flag.roles.length === 0) return null;
    if (!context.role) return false;
    return flag.roles.includes(context.role);
  }
}

export class UserRule implements IRule {
  public evaluate(flag: FeatureFlagDefinition, context: EvaluationContext): boolean | null {
    if (!flag.users || flag.users.length === 0) return null;
    if (!context.userId) return false;
    return flag.users.includes(context.userId);
  }
}

export class PercentageRule implements IRule {
  public evaluate(flag: FeatureFlagDefinition, context: EvaluationContext): boolean | null {
    if (flag.percentage === undefined || flag.percentage === null) return null;
    if (flag.percentage <= 0) return false;
    if (flag.percentage >= 100) return true;

    const seed = `${flag.key}:${context.userId || context.tenantId || 'anon'}`;
    const hash = crypto.createHash('md5').update(seed).digest('hex');
    const numeric = parseInt(hash.substring(0, 8), 16);
    const bucket = (numeric % 100) + 1;

    return bucket <= flag.percentage;
  }
}

export class EnvironmentRule implements IRule {
  public evaluate(flag: FeatureFlagDefinition, context: EvaluationContext): boolean | null {
    const currentEnv = context.environment || process.env.NODE_ENV || 'development';
    if (flag.startAt && new Date() < new Date(flag.startAt)) return false;
    if (flag.endAt && new Date() > new Date(flag.endAt)) return false;
    return null;
  }
}
