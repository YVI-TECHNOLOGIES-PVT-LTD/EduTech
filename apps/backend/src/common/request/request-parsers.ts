import { Request } from 'express';

export interface ParsedPagination {
  readonly page: number;
  readonly limit: number;
  readonly skip: number;
}

export interface ParsedSort {
  readonly field: string;
  readonly order: 'asc' | 'desc';
}

export interface ParsedFilter {
  readonly [key: string]: any;
}

export class PaginationParser {
  public static parse(req: Request, defaultPage = 1, defaultLimit = 25): ParsedPagination {
    const rawPage = parseInt(req.query.page as string, 10);
    const rawLimit = parseInt(req.query.limit as string, 10);

    const page = isNaN(rawPage) || rawPage < 1 ? defaultPage : rawPage;
    const limit = isNaN(rawLimit) || rawLimit < 1 ? defaultLimit : Math.min(rawLimit, 100);
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }
}

export class SortParser {
  public static parse(req: Request, defaultSort = 'createdAt:desc'): ParsedSort[] {
    const rawSort = (req.query.sort as string) || defaultSort;
    return rawSort.split(',').map((part) => {
      const trimmed = part.trim();
      if (trimmed.startsWith('-')) {
        return { field: trimmed.substring(1), order: 'desc' };
      }
      if (trimmed.includes(':')) {
        const [field, order] = trimmed.split(':');
        return { field, order: order.toLowerCase() === 'asc' ? 'asc' : 'desc' };
      }
      return { field: trimmed, order: 'asc' };
    });
  }
}

export class FilterParser {
  public static parse(req: Request): ParsedFilter {
    const filters: Record<string, any> = {};
    const rawFilter = req.query.filter;

    if (typeof rawFilter === 'string') {
      const parts = rawFilter.split(',');
      for (const part of parts) {
        const [key, val] = part.split(':');
        if (key && val !== undefined) {
          filters[key.trim()] = val.trim();
        }
      }
    } else if (typeof rawFilter === 'object' && rawFilter !== null) {
      Object.assign(filters, rawFilter);
    }

    return filters;
  }
}

export class SearchParser {
  public static parse(req: Request): string | undefined {
    const q = (req.query.q as string) || (req.query.search as string);
    return q ? q.trim() : undefined;
  }
}

export class FieldsParser {
  public static parse(req: Request): string[] | undefined {
    const rawFields = req.query.fields as string;
    if (!rawFields) return undefined;
    return rawFields
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);
  }
}

export class ExpandParser {
  public static parse(req: Request): string[] | undefined {
    const rawExpand = req.query.expand as string;
    if (!rawExpand) return undefined;
    return rawExpand
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
  }
}

export class RequestParser {
  public static parse(req: Request) {
    return {
      pagination: PaginationParser.parse(req),
      sort: SortParser.parse(req),
      filter: FilterParser.parse(req),
      search: SearchParser.parse(req),
      fields: FieldsParser.parse(req),
      expand: ExpandParser.parse(req),
    };
  }
}
