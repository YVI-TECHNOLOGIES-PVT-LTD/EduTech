import { IConnector } from '../contracts/integration.contracts';
import {
  HttpConnector,
  GraphqlConnector,
  WebhookConnector,
  MemoryConnector,
  NoopConnector,
} from '../connectors/integration.connectors';
import { connectorRegistry } from '../registry/connector.registry';
import { configuration } from '../../config';

export class IntegrationFactory {
  constructor() {
    // Pre-register default connectors
    connectorRegistry.register(new HttpConnector());
    connectorRegistry.register(new GraphqlConnector());
    connectorRegistry.register(new WebhookConnector());
    connectorRegistry.register(new MemoryConnector());
    connectorRegistry.register(new NoopConnector());
  }

  public createConnector(name?: string): IConnector {
    const connectorName = name || (configuration as any)?.integration?.defaultConnector || 'http';
    const found = connectorRegistry.get(connectorName);
    return found || new HttpConnector();
  }
}
