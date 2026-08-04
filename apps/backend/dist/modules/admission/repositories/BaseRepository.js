"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
const supabase_1 = require("../../../config/supabase");
class BaseRepository {
    constructor(tableName) {
        this.tableName = tableName;
    }
    /**
     * Obtains a standard query client filtered to exclude soft-deleted records.
     */
    get activeQuery() {
        return supabase_1.supabase.from(this.tableName).select('*').is('deleted_at', null);
    }
    /**
     * Obtains a standard query client without soft-delete filters.
     */
    get rawQuery() {
        return supabase_1.supabase.from(this.tableName).select('*');
    }
    /**
     * Executes a soft-delete update by setting the `deleted_at` timestamp.
     */
    async performSoftDelete(id) {
        const { error } = await supabase_1.supabase
            .from(this.tableName)
            .update({
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
            .eq('id', id);
        if (error)
            throw error;
    }
    /**
     * Builds a query dynamically with filtering, searching, sorting, and pagination.
     */
    buildQuery(queryBuilder, params) {
        let query = queryBuilder;
        // Apply equality filters
        if (params.filter) {
            Object.entries(params.filter).forEach(([key, val]) => {
                if (val !== undefined && val !== null) {
                    if (Array.isArray(val)) {
                        query = query.in(key, val);
                    }
                    else {
                        query = query.eq(key, val);
                    }
                }
            });
        }
        // Apply text search across multiple fields (ilike)
        if (params.search && params.searchFields && params.searchFields.length > 0) {
            const orConditions = params.searchFields
                .map(field => `${field}.ilike.%${params.search}%`)
                .join(',');
            query = query.or(orConditions);
        }
        // Apply sorting
        const sortCol = params.sortColumn || 'created_at';
        const sortOrd = params.sortOrder === 'asc' ? { ascending: true } : { ascending: false };
        query = query.order(sortCol, sortOrd);
        // Apply pagination
        if (params.page !== undefined && params.limit !== undefined) {
            const from = (params.page - 1) * params.limit;
            const to = from + params.limit - 1;
            query = query.range(from, to);
        }
        return query;
    }
}
exports.BaseRepository = BaseRepository;
