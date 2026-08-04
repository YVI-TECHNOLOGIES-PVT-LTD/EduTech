"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowUpRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const AdmissionFollowup_1 = require("../../domain/AdmissionFollowup");
const BaseRepository_1 = require("../BaseRepository");
class FollowUpRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('admission_followups');
    }
    toDomain(row) {
        return new AdmissionFollowup_1.AdmissionFollowup(row.id, row.lead_id, new Date(row.scheduled_date), row.completed_date ? new Date(row.completed_date) : null, row.status, row.notes || null, row.created_by, new Date(row.created_at), new Date(row.updated_at));
    }
    toPersistence(domain) {
        return {
            id: domain.id,
            lead_id: domain.leadId,
            scheduled_date: domain.scheduledDate.toISOString(),
            completed_date: domain.completedDate ? domain.completedDate.toISOString() : null,
            status: domain.status,
            notes: domain.notes,
            created_by: domain.createdBy,
            created_at: domain.createdAt.toISOString(),
            updated_at: domain.updatedAt.toISOString()
        };
    }
    async findById(id) {
        const { data, error } = await this.rawQuery.eq('id', id).maybeSingle();
        if (error)
            throw error;
        return data ? this.toDomain(data) : null;
    }
    async save(followup) {
        const payload = this.toPersistence(followup);
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .upsert(payload)
            .select()
            .single();
        if (error)
            throw error;
        return this.toDomain(data);
    }
    async findAll(filters, page = 1, limit = 10, sortColumn, sortOrder) {
        const baseQuery = supabase_1.supabase
            .from(this.tableName)
            .select('*', { count: 'exact' });
        const filterMap = {};
        if (filters.leadId)
            filterMap.lead_id = filters.leadId;
        if (filters.status)
            filterMap.status = filters.status;
        const buildParams = {
            filter: filterMap,
            page,
            limit,
            sortColumn,
            sortOrder
        };
        const query = this.buildQuery(baseQuery, buildParams);
        const { data, count, error } = await query;
        if (error)
            throw error;
        return {
            data: (data || []).map((row) => this.toDomain(row)),
            total: count || 0
        };
    }
}
exports.FollowUpRepository = FollowUpRepository;
