import { ISearchProvider } from '../contracts/search.contracts';
import { PostgresFullTextSearchProvider, ElasticsearchSearchProvider, MemorySearchProvider, NoopSearchProvider } from '../providers/search.providers';
import { configuration } from '../../config';

export class SearchFactory {
  public createProvider(name?: string): ISearchProvider {
    const providerName = name || (configuration as any)?.search?.provider || 'memory';

    switch (providerName.toLowerCase()) {
      case 'postgres':
        return new PostgresFullTextSearchProvider();
      case 'elasticsearch':
        return new ElasticsearchSearchProvider();
      case 'noop':
        return new NoopSearchProvider();
      case 'memory':
      default:
        return new MemorySearchProvider();
    }
  }
}
