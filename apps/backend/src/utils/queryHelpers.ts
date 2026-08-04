
export interface PaginationParams {
    page?: number;
    limit?: number;
    search?: string;
    filters?: Record<string, any>; // Key-value pairs for exact matches or custom logic
}

export interface PaginatedResult<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export const getPaginationRange = (page: number = 1, limit: number = 10) => {
    // Ensure positive integers
    const p = Math.max(1, Number(page) || 1);
    const l = Math.max(1, Number(limit) || 10);

    const from = (p - 1) * l;
    const to = from + l - 1;

    return { from, to, page: p, limit: l };
};

export const applySearch = (query: any, search: string | undefined, columns: string[]) => {
    if (!search || columns.length === 0) return query;
    const term = search.trim();
    if (!term) return query;

    // Construct OR clause: "col1.ilike.%term%,col2.ilike.%term%"
    const orClause = columns.map(col => `${col}.ilike.%${term}%`).join(',');
    return query.or(orClause);
};

export const createPaginatedResult = <T>(
    data: T[],
    count: number | null,
    page: number,
    limit: number
): PaginatedResult<T> => {
    const total = count || 0;
    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};
