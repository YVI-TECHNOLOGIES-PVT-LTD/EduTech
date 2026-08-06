import { IConnector } from '../contracts/integration.contracts';

export class ConnectorRegistry {
  private static instance: ConnectorRegistry;
  private connectors = new Map<string, IConnector>();

  public static getInstance(): ConnectorRegistry {
    if (!ConnectorRegistry.instance) {
      ConnectorRegistry.instance = new ConnectorRegistry();
    }
    return ConnectorRegistry.instance;
  }

  public register(connector: IConnector): void {
    this.connectors.set(connector.name.toLowerCase(), connector);
  }

  public get(name: string): IConnector | undefined {
    return this.connectors.get(name.toLowerCase());
  }

  public list(): string[] {
    return Array.from(this.connectors.keys());
  }
}

export const connectorRegistry = ConnectorRegistry.getInstance();
