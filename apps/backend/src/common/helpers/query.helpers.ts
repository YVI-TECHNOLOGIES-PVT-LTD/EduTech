export interface PaginationOptions {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export class PaginationHelper {
  public static parse(
    query: Record<string, any>,
    defaultPageSize = 20,
    maxPageSize = 100,
  ): PaginationOptions {
    const page = Math.max(1, parseInt(String(query.page || 1), 10));
    const rawPageSize = parseInt(String(query.pageSize || defaultPageSize), 10);
    const pageSize = Math.min(Math.max(1, rawPageSize), maxPageSize);
    const skip = (page - 1) * pageSize;

    return {
      page,
      pageSize,
      skip,
      take: pageSize,
    };
  }
}

export class FilterHelper {
  public static parseEquals(
    query: Record<string, any>,
    allowedKeys: string[],
  ): Record<string, any> {
    const filter: Record<string, any> = {};
    for (const key of allowedKeys) {
      if (query[key] !== undefined && query[key] !== null && query[key] !== '') {
        filter[key] = query[key];
      }
    }
    return filter;
  }
}

export class SortHelper {
  public static parse(
    sortString?: string,
    allowedFields: string[] = [],
  ): Array<{ field: string; direction: 'asc' | 'desc' }> {
    if (!sortString) return [];

    return sortString
      .split(',')
      .map((part) => {
        const isDesc = part.startsWith('-');
        const field = isDesc ? part.substring(1) : part;

        if (allowedFields.length > 0 && !allowedFields.includes(field)) {
          return null;
        }
        return {
          field,
          direction: isDesc ? ('desc' as const) : ('asc' as const),
        };
      })
      .filter(Boolean) as Array<{ field: string; direction: 'asc' | 'desc' }>;
  }
}

export class SearchHelper {
  public static buildContains(
    searchTerm?: string,
    fields: string[] = [],
  ): Record<string, any>[] | null {
    if (!searchTerm || fields.length === 0) return null;
    const term = searchTerm.trim();
    if (!term) return null;

    return fields.map((field) => ({
      [field]: { contains: term, mode: 'insensitive' },
    }));
  }
}
