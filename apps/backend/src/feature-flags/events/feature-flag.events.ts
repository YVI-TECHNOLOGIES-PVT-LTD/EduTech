import { loggerService } from '../../observability/logger.service';
import { MetricsRegistry } from '../../observability/metrics/metrics.engine';

export enum FeatureFlagEventType {
  EVALUATED = 'FlagEvaluated',
  OVERRIDDEN = 'FlagOverridden',
  ROLLOUT_TRIGGERED = 'RolloutTriggered',
}

export class FeatureFlagEvents {
  private static metrics = MetricsRegistry.getInstance();

  public static emit(
    type: FeatureFlagEventType,
    flagKey: string,
    result: boolean,
    meta?: Record<string, any>,
  ): void {
    this.metrics.incrementCounter(`feature_flag_${type.toLowerCase()}_total`);
    loggerService.debug(`🚩 [Feature Flag Event: ${type}] ${flagKey} = ${result}`, meta);
  }
}
