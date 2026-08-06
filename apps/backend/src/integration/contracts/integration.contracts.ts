export interface ConnectorCapabilities {
  readonly supportsStreaming: boolean;
  readonly supportsBatch: boolean;
  readonly supportsWebhook: boolean;
  readonly supportsRetry: boolean;
  readonly supportsOAuth: boolean;
  readonly supportsPagination: boolean;
  readonly supportsIdempotency: boolean;
}

export type AuthStrategyType = 'bearer' | 'api-key' | 'oauth2' | 'basic' | 'hmac' | 'none';

export interface IntegrationPayload<T = any> {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  params?: Record<string, any>;
  body?: T;
  authStrategy?: AuthStrategyType;
  authCredentials?: Record<string, string>;
  idempotencyKey?: string;
  timeoutMs?: number;
}

export interface IntegrationResponse<T = any> {
  statusCode: number;
  data: T;
  headers: Record<string, string>;
  durationMs: number;
  connector: string;
  success: boolean;
}

export interface IConnector {
  readonly name: string;
  readonly capabilities: ConnectorCapabilities;
  execute<T = any>(payload: IntegrationPayload): Promise<IntegrationResponse<T>>;
  ping(): Promise<boolean>;
}
