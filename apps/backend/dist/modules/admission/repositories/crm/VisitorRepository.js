"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitorRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const AdmissionVisitor_1 = require("../../domain/AdmissionVisitor");
const BaseRepository_1 = require("../BaseRepository");
class VisitorRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('admission_visitors');
    }
    toDomain(row) {
        return new AdmissionVisitor_1.AdmissionVisitor(row.id, row.school_id, row.visitor_name, row.phone, row.purpose, new Date(row.time_in), row.time_out ? new Date(row.time_out) : null, row.lead_id, row.created_by, new Date(row.created_at), row.counselor_id || null, row.remarks || null, row.visit_type || null, row.visit_outcome || null);
    }
    toPersistence(domain) {
        return {
            id: domain.id,
            school_id: domain.schoolId,
            visitor_name: domain.visitorName,
            phone: domain.phone,
            purpose: domain.purpose,
            time_in: domain.timeIn.toISOString(),
            time_out: domain.timeOut ? domain.timeOut.toISOString() : null,
            lead_id: domain.leadId,
            created_by: domain.createdBy,
            created_at: domain.createdAt.toISOString(),
            counselor_id: domain.counselorId,
            remarks: domain.remarks,
            visit_type: domain.visitType,
            visit_outcome: domain.visitOutcome
        };
    }
    async findById(id) {
        const { data, error } = await this.rawQuery.eq('id', id).maybeSingle();
        if (error)
            throw error;
        return data ? this.toDomain(data) : null;
    }
    async save(visitor) {
        const payload = this.toPersistence(visitor);
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .upsert(payload)
            .select()
            .single();
        if (error)
            throw error;
        return this.toDomain(data);
    }
    async findAll(schoolId, page = 1, limit = 10, filters, search, sortColumn, sortOrder) {
        const baseQuery = supabase_1.supabase
            .from(this.tableName)
            .select('*', { count: 'exact' })
            .eq('school_id', schoolId);
        const buildParams = {
            search,
            searchFields: ['visitor_name', 'phone', 'purpose'],
            filter: filters,
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
exports.VisitorRepository = VisitorRepository;
