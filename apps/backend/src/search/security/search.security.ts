import { SearchQueryPayload } from '../contracts/search.contracts';

export class SearchSecurity {
  public static applyAuthorizationFilter(payload: SearchQueryPayload): SearchQueryPayload {
    const securedFilters = { ...payload.filters };

    // Enforce Tenant isolation at search query level
    if (payload.tenantId) {
      securedFilters.tenantId = payload.tenantId;
    }

    return {
      ...payload,
      filters: securedFilters,
    };
  }
}
