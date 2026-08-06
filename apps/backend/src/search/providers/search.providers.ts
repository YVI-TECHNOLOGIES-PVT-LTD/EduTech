import { ISearchProvider, SearchCapabilities, SearchQueryPayload, SearchResult, IndexableDocument } from '../contracts/search.contracts';
import { ScoreEngine } from '../ranking/score.engine';
import { AutocompleteEngine } from '../suggestions/autocomplete.engine';
import { DeliveryTracker } from '../../notification/tracking/delivery.tracker';

export class MemorySearchProvider implements ISearchProvider {
  constructor(public readonly name: string = 'memory') {}

  public readonly capabilities: SearchCapabilities = {
    supportsFullText: true,
    supportsFacets: true,
    supportsHighlighting: true,
    supportsFuzzy: true,
    supportsSuggestions: true,
    supportsBulkIndexing: true,
  };

  private documents = new Map<string, IndexableDocument[]>();

  public async search<T = IndexableDocument>(payload: SearchQueryPayload): Promise<SearchResult<T>> {
    const start = process.hrtime.bigint();
    const docs = this.documents.get(payload.index) || [];

    // Filter by tenantId if provided
    let filtered = docs;
    if (payload.filters?.tenantId) {
      filtered = filtered.filter((d) => d.tenantId === payload.filters?.tenantId);
    }

    // Score and rank documents
    const scored = filtered
      .map((doc) => ({
        document: doc as unknown as T,
        score: ScoreEngine.calculateRelevance(doc, payload.query),
      }))
      .filter((h) => h.score > 0)
      .sort((a, b) => b.score - a.score);

    const page = payload.page || 1;
    const limit = payload.limit || 20;
    const offset = (page - 1) * limit;
    const hits = scored.slice(offset, offset + limit);

    const suggestions = AutocompleteEngine.generateSuggestions(docs, payload.query);
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1000000;

    return {
      hits: hits as any,
      totalHits: scored.length,
      page,
      limit,
      totalPages: Math.ceil(scored.length / limit) || 1,
      suggestions,
      durationMs,
    };
  }

  public async indexDocument(doc: IndexableDocument): Promise<void> {
    const list = this.documents.get(doc.index) || [];
    const index = list.findIndex((d) => d.id === doc.id);
    if (index >= 0) list[index] = doc;
    else list.push(doc);
    this.documents.set(doc.index, list);
  }

  public async bulkIndex(docs: IndexableDocument[]): Promise<void> {
    for (const doc of docs) {
      await this.indexDocument(doc);
    }
  }

  public async deleteDocument(index: string, id: string): Promise<void> {
    const list = this.documents.get(index) || [];
    this.documents.set(index, list.filter((d) => d.id !== id));
  }

  public async clearIndex(index: string): Promise<void> {
    this.documents.delete(index);
  }

  public async ping(): Promise<boolean> { return true; }
}

export class NoopSearchProvider implements ISearchProvider {
  constructor(public readonly name: string = 'noop') {}

  public readonly capabilities: SearchCapabilities = {
    supportsFullText: false,
    supportsFacets: false,
    supportsHighlighting: false,
    supportsFuzzy: false,
    supportsSuggestions: false,
    supportsBulkIndexing: false,
  };

  public async search<T = IndexableDocument>(_payload: SearchQueryPayload): Promise<SearchResult<T>> {
    return { hits: [], totalHits: 0, page: 1, limit: 20, totalPages: 1, durationMs: 0 };
  }
  public async indexDocument(_doc: IndexableDocument): Promise<void> {}
  public async bulkIndex(_docs: IndexableDocument[]): Promise<void> {}
  public async deleteDocument(_index: string, _id: string): Promise<void> {}
  public async clearIndex(_index: string): Promise<void> {}
  public async ping(): Promise<boolean> { return true; }
}

export class PostgresFullTextSearchProvider extends MemorySearchProvider {
  constructor() {
    super('postgres');
  }
}

export class ElasticsearchSearchProvider extends MemorySearchProvider {
  constructor() {
    super('elasticsearch');
  }
}
