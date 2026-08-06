import {
  IConnector,
  ConnectorCapabilities,
  IntegrationPayload,
  IntegrationResponse,
} from '../contracts/integration.contracts';
import { AuthStrategies } from '../authentication/auth.strategies';
import { loggerService } from '../../observability/logger.service';
import { MetricsRegistry } from '../../observability/metrics/metrics.engine';

export class MemoryConnector implements IConnector {
  public readonly name = 'memory';
  public readonly capabilities: ConnectorCapabilities = {
    supportsStreaming: true,
    supportsBatch: true,
    supportsWebhook: true,
    supportsRetry: true,
    supportsOAuth: true,
    supportsPagination: true,
    supportsIdempotency: true,
  };

  private metrics = MetricsRegistry.getInstance();

  public async execute<T = any>(payload: IntegrationPayload): Promise<IntegrationResponse<T>> {
    const start = process.hrtime.bigint();
    const headers = AuthStrategies.apply(
      payload.authStrategy || 'none',
      payload.authCredentials,
      payload.headers,
    );

    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1000000;

    this.metrics.incrementCounter('integration_requests_total');
    loggerService.info(
      `🔗 [Integration Connector] Executed ${payload.method || 'GET'} ${payload.url}`,
    );

    return {
      statusCode: 200,
      data: (payload.body || { message: 'Mock response success' }) as T,
      headers,
      durationMs,
      connector: this.name,
      success: true,
    };
  }

  public async ping(): Promise<boolean> {
    return true;
  }
}

export class NoopConnector implements IConnector {
  public readonly name = 'noop';
  public readonly capabilities: ConnectorCapabilities = {
    supportsStreaming: false,
    supportsBatch: false,
    supportsWebhook: false,
    supportsRetry: false,
    supportsOAuth: false,
    supportsPagination: false,
    supportsIdempotency: false,
  };

  public async execute<T = any>(payload: IntegrationPayload): Promise<IntegrationResponse<T>> {
    return {
      statusCode: 200,
      data: {} as T,
      headers: {},
      durationMs: 0,
      connector: 'noop',
      success: true,
    };
  }

  public async ping(): Promise<boolean> {
    return true;
  }
}

export class HttpConnector extends MemoryConnector {
  public override readonly name = 'http';
}

export class GraphqlConnector extends MemoryConnector {
  public override readonly name = 'graphql';
}

export class WebhookConnector extends MemoryConnector {
  public override readonly name = 'webhook';
}
