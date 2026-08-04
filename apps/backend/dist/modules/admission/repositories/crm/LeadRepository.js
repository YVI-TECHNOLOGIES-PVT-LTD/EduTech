"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const AdmissionLead_1 = require("../../domain/AdmissionLead");
const BaseRepository_1 = require("../BaseRepository");
class LeadRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('admission_leads');
    }
    toDomain(row) {
        return new AdmissionLead_1.AdmissionLead(row.id, row.enquiry_id, row.counselor_id, row.status, row.lost_reason, new Date(row.created_at), new Date(row.updated_at), row.deleted_at ? new Date(row.deleted_at) : null);
    }
    toPersistence(domain) {
        return {
            id: domain.id,
            enquiry_id: domain.enquiryId,
            counselor_id: domain.counselorId,
            status: domain.status,
            lost_reason: domain.lostReason,
            created_at: domain.createdAt.toISOString(),
            updated_at: domain.updatedAt.toISOString(),
            deleted_at: domain.deletedAt ? domain.deletedAt.toISOString() : null
        };
    }
    async findById(id) {
        const { data, error } = await this.activeQuery.eq('id', id).maybeSingle();
        if (error)
            throw error;
        return data ? this.toDomain(data) : null;
    }
    /**
     * Finds a lead by its source enquiry_id (FK). Used to check if an enquiry
     * was already auto-converted to a lead during counselor assignment.
     */
    async findByEnquiryId(enquiryId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .is('deleted_at', null)
            .eq('enquiry_id', enquiryId)
            .maybeSingle();
        if (error)
            throw error;
        return data ? this.toDomain(data) : null;
    }
    async findByEnquiryIds(enquiryIds) {
        if (!enquiryIds.length)
            return new Map();
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .is('deleted_at', null)
            .in('enquiry_id', enquiryIds);
        if (error)
            throw error;
        return new Map((data ?? []).map(row => [row.enquiry_id, this.toDomain(row)]));
    }
    async save(lead) {
        const payload = this.toPersistence(lead);
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .upsert(payload)
            .select()
            .single();
        if (error)
            throw error;
        return this.toDomain(data);
    }
    /**
     * Saves a lead while asserting optimistic locking (updates must verify the updated_at timestamp match).
     */
    async saveWithOptimisticLock(lead, expectedUpdatedAt) {
        const payload = this.toPersistence(lead);
        payload.updated_at = new Date().toISOString(); // Set new update time
        const dateMs = expectedUpdatedAt.getTime();
        const minDate = new Date(dateMs - 10).toISOString();
        const maxDate = new Date(dateMs + 10).toISOString();
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .update(payload)
            .eq('id', lead.id)
            .gte('updated_at', minDate)
            .lte('updated_at', maxDate)
            .select()
            .maybeSingle();
        if (error)
            throw error;
        if (!data) {
            throw new Error('OPTIMISTIC_LOCK_FAILED');
        }
        return this.toDomain(data);
    }
    async findAll(filters, page = 1, limit = 10, sortColumn, sortOrder) {
        const baseQuery = supabase_1.supabase
            .from(this.tableName)
            .select('*', { count: 'exact' })
            .is('deleted_at', null);
        const filterMap = {};
        if (filters.counselorId)
            filterMap.counselor_id = filters.counselorId;
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
    async softDelete(id) {
        await this.performSoftDelete(id);
    }
    async logFollowup(leadId, followupData) {
        const { data, error } = await supabase_1.supabase
            .from('admission_followups')
            .insert({
            lead_id: leadId,
            scheduled_date: followupData.scheduled_date.toISOString(),
            notes: followupData.notes || null,
            created_by: followupData.created_by,
            status: followupData.status || 'scheduled'
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async getFollowups(leadId) {
        const { data, error } = await supabase_1.supabase
            .from('admission_followups')
            .select('*')
            .eq('lead_id', leadId)
            .order('scheduled_date', { ascending: false });
        if (error)
            throw error;
        return data || [];
    }
}
exports.LeadRepository = LeadRepository;
