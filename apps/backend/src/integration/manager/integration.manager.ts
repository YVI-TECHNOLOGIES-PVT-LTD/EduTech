import {
  IConnector,
  IntegrationPayload,
  IntegrationResponse,
} from '../contracts/integration.contracts';
import { IntegrationFactory } from '../factory/integration.factory';
import { CircuitBreaker } from '../resilience/circuit.breaker';
import { WebhookEngine } from '../webhooks/webhook.engine';
import { queueManager } from '../../queue/manager/queue.manager';

export class IntegrationManager {
  private static instance: IntegrationManager;
  private factory = new IntegrationFactory();
  private circuitBreaker = new CircuitBreaker();

  public static getInstance(): IntegrationManager {
    if (!IntegrationManager.instance) {
      IntegrationManager.instance = new IntegrationManager();
    }
    return IntegrationManager.instance;
  }

  public async execute<T = any>(
    payload: IntegrationPayload,
    connectorName?: string,
  ): Promise<IntegrationResponse<T>> {
    if (!this.circuitBreaker.canExecute()) {
      throw new Error('Circuit Breaker is OPEN. Integration call rejected.');
    }

    try {
      const connector = this.factory.createConnector(connectorName);
      const response = await connector.execute<T>(payload);
      this.circuitBreaker.onSuccess();
      return response;
    } catch (err: any) {
      this.circuitBreaker.onFailure();
      throw err;
    }
  }

  public async executeAsync<T = any>(
    payload: IntegrationPayload,
    connectorName?: string,
  ): Promise<void> {
    await queueManager.enqueue('integration:dispatch', 'execute_integration', {
      payload,
      connectorName,
    });
  }

  public verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
    nonce?: string,
  ): boolean {
    return WebhookEngine.processInbound(payload, signature, secret, nonce);
  }
}

export const integrationManager = IntegrationManager.getInstance();
