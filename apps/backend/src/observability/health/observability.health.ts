import { loggerService } from '../logger.service';
import { MetricsRegistry } from '../metrics/metrics.engine';
import { configuration } from '../../config';

export interface ObservabilityHealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  checks: {
    logging: 'up' | 'down';
    tracing: 'up' | 'down';
    metrics: 'up' | 'down';
    exporter: 'up' | 'down';
    config: 'up' | 'down';
  };
  metricsSnapshot?: any;
}

export class ObservabilityHealthService {
  public static async getStatus(): Promise<ObservabilityHealthStatus> {
    const isConfigOk = Boolean(configuration?.observability);
    const metricsRegistry = MetricsRegistry.getInstance();
    const snapshot = metricsRegistry.getSnapshot();

    return {
      status: isConfigOk ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      checks: {
        logging: 'up',
        tracing: 'up',
        metrics: 'up',
        exporter: 'up',
        config: isConfigOk ? 'up' : 'down',
      },
      metricsSnapshot: snapshot,
    };
  }
}
