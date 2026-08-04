import { logger } from '../utils/logger';

export type VersionedDomainEventName =
  | 'AdmissionCreated.v1'
  | 'StudentEnrolled.v1'
  | 'FeePaid.v1'
  | 'AttendanceMarked.v1'
  | 'UserCreated.v1'
  | 'NotificationRequested.v1';

export interface DomainEventEnvelope<T = any> {
  eventId: string;
  eventName: VersionedDomainEventName;
  version: 'v1';
  timestamp: string;
  payload: T;
}

type EventHandler<T = any> = (event: DomainEventEnvelope<T>) => Promise<void> | void;

export class EventBusService {
  private static instance: EventBusService;
  private listeners: Map<VersionedDomainEventName, EventHandler[]> = new Map();

  private constructor() {
    logger.info('[EventBus] Initialized Versioned Domain Event Bus');
  }

  public static getInstance(): EventBusService {
    if (!EventBusService.instance) {
      EventBusService.instance = new EventBusService();
    }
    return EventBusService.instance;
  }

  subscribe<T>(eventName: VersionedDomainEventName, handler: EventHandler<T>): void {
    const handlers = this.listeners.get(eventName) || [];
    handlers.push(handler);
    this.listeners.set(eventName, handlers);
  }

  async publish<T>(eventName: VersionedDomainEventName, payload: T): Promise<DomainEventEnvelope<T>> {
    const eventEnvelope: DomainEventEnvelope<T> = {
      eventId: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      eventName,
      version: 'v1',
      timestamp: new Date().toISOString(),
      payload,
    };

    logger.info(`[EventBus PUBLISH] Event ${eventName} (ID: ${eventEnvelope.eventId})`);

    const handlers = this.listeners.get(eventName) || [];
    for (const handler of handlers) {
      try {
        await handler(eventEnvelope);
      } catch (err: any) {
        logger.error(`[EventBus Error] Listener failed for ${eventName}:`, err);
      }
    }

    return eventEnvelope;
  }
}

export const eventBus = EventBusService.getInstance();
