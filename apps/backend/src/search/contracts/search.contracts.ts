export interface SearchCapabilities {
  readonly supportsFullText: boolean;
  readonly supportsFacets: boolean;
  readonly supportsHighlighting: boolean;
  readonly supportsFuzzy: boolean;
  readonly supportsSuggestions: boolean;
  readonly supportsBulkIndexing: boolean;
}

export interface IndexableDocument {
  id: string;
  index: string;
  tenantId?: string;
  title: string;
  content: string;
  category?: string;
  status?: string;
  tags?: string[];
  attributes?: Record<string, any>;
  createdAt?: Date;
}

export interface SearchQueryPayload {
  index: string;
  query: string;
  tenantId?: string;
  userId?: string;
  role?: string;
  filters?: Record<string, any>;
  facets?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FacetResult {
  field: string;
  counts: { value: string; count: number }[];
}

export interface SearchHit<T = IndexableDocument> {
  document: T;
  score: number;
  highlights?: Record<string, string[]>;
}

export interface SearchResult<T = IndexableDocument> {
  hits: SearchHit<T>[];
  totalHits: number;
  page: number;
  limit: number;
  totalPages: number;
  facets?: FacetResult[];
  suggestions?: string[];
  durationMs: number;
}

export interface ISearchProvider {
  readonly name: string;
  readonly capabilities: SearchCapabilities;
  search<T = IndexableDocument>(payload: SearchQueryPayload): Promise<SearchResult<T>>;
  indexDocument(doc: IndexableDocument): Promise<void>;
  bulkIndex(docs: IndexableDocument[]): Promise<void>;
  deleteDocument(index: string, id: string): Promise<void>;
  clearIndex(index: string): Promise<void>;
  ping(): Promise<boolean>;
}
