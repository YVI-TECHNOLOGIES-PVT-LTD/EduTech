import { IQueueProvider } from '../contracts/queue.contracts';
import {
  InMemoryQueueProvider,
  NoopQueueProvider,
  BullMQQueueProvider,
} from '../providers/queue.providers';
import { configuration } from '../../config';

export class QueueFactory {
  public createProvider(name?: string): IQueueProvider {
    const providerName = name || (configuration as any)?.queue?.provider || 'memory';

    switch (providerName.toLowerCase()) {
      case 'bullmq':
        return new BullMQQueueProvider();
      case 'noop':
        return new NoopQueueProvider();
      case 'memory':
      default:
        return new InMemoryQueueProvider();
    }
  }
}
