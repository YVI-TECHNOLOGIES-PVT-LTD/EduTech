"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaginatedResult = exports.applySearch = exports.getPaginationRange = void 0;
const getPaginationRange = (page = 1, limit = 10) => {
    // Ensure positive integers
    const p = Math.max(1, Number(page) || 1);
    const l = Math.max(1, Number(limit) || 10);
    const from = (p - 1) * l;
    const to = from + l - 1;
    return { from, to, page: p, limit: l };
};
exports.getPaginationRange = getPaginationRange;
const applySearch = (query, search, columns) => {
    if (!search || columns.length === 0)
        return query;
    const term = search.trim();
    if (!term)
        return query;
    // Construct OR clause: "col1.ilike.%term%,col2.ilike.%term%"
    const orClause = columns.map(col => `${col}.ilike.%${term}%`).join(',');
    return query.or(orClause);
};
exports.applySearch = applySearch;
const createPaginatedResult = (data, count, page, limit) => {
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
exports.createPaginatedResult = createPaginatedResult;
