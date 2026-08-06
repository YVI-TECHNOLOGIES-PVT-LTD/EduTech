import { ISearchProvider, SearchQueryPayload, SearchResult, IndexableDocument } from '../contracts/search.contracts';
import { SearchFactory } from '../factory/search.factory';
import { SearchSecurity } from '../security/search.security';
import { cacheManager } from '../../cache/manager/cache.manager';
import { queueManager } from '../../queue/manager/queue.manager';
import { SearchAuditLogger } from '../audit/search.audit';
import { SearchEvents, SearchEventType } from '../events/search.events';

export class SearchManager {
  private static instance: SearchManager;
  private provider: ISearchProvider;

  private constructor() {
    const factory = new SearchFactory();
    this.provider = factory.createProvider();
  }

  public static getInstance(): SearchManager {
    if (!SearchManager.instance) {
      SearchManager.instance = new SearchManager();
    }
    return SearchManager.instance;
  }

  public async search<T = IndexableDocument>(payload: SearchQueryPayload): Promise<SearchResult<T>> {
    // 1. Enforce Authorization Security Filtering
    const securedPayload = SearchSecurity.applyAuthorizationFilter(payload);

    // 2. Cache Lookup (reusing Phase 2.8 CacheManager)
    const cacheKey = `search:${securedPayload.index}:${securedPayload.query}:${securedPayload.tenantId || 'global'}:${securedPayload.page || 1}`;
    const cached = await cacheManager.get<SearchResult<T>>(cacheKey);
    if (cached) {
      return cached;
    }

    // 3. Provider Search Execution
    const result = await this.provider.search<T>(securedPayload);

    // 4. Cache Result (60s TTL)
    await cacheManager.set(cacheKey, result, { ttlSeconds: 60 });

    // 5. Audit & Events
    SearchAuditLogger.log({
      user: securedPayload.userId,
      query: securedPayload.query,
      index: securedPayload.index,
      filters: securedPayload.filters,
      durationMs: result.durationMs,
      resultCount: result.totalHits,
    });
    SearchEvents.emit(SearchEventType.QUERY_EXECUTED, securedPayload.index, { query: securedPayload.query });

    return result;
  }

  public async indexDocument(doc: IndexableDocument): Promise<void> {
    await this.provider.indexDocument(doc);
    SearchEvents.emit(SearchEventType.DOCUMENT_INDEXED, doc.index, { docId: doc.id });
  }

  public async indexDocumentAsync(doc: IndexableDocument): Promise<void> {
    await queueManager.enqueue('search:index', 'index_document', doc);
  }

  public async bulkIndex(docs: IndexableDocument[]): Promise<void> {
    await this.provider.bulkIndex(docs);
  }

  public async deleteDocument(index: string, id: string): Promise<void> {
    await this.provider.deleteDocument(index, id);
  }
}

export const searchManager = SearchManager.getInstance();
