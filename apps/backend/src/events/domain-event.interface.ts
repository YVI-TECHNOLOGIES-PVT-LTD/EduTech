export interface DomainEvent<T = any> {
  eventId: string;
  eventName: string;
  timestamp: string;
  tenantId?: string;
  payload: T;
}

export type EventHandler<T = any> = (event: DomainEvent<T>) => Promise<void> | void;

export interface IEventEmitter {
  emit<T = any>(event: DomainEvent<T>): void;
}

export interface IEventBus extends IEventEmitter {
  subscribe<T = any>(eventName: string, handler: EventHandler<T>): void;
  unsubscribe<T = any>(eventName: string, handler: EventHandler<T>): void;
}
