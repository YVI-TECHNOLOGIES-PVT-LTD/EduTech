import { supabase } from '../../../../config/supabase';
import { AdmissionLead, LeadStatus } from '../../domain/AdmissionLead';
import { ILeadRepository } from '../interfaces/ILeadRepository';
import { BaseRepository } from '../BaseRepository';

export class LeadRepository extends BaseRepository<AdmissionLead> implements ILeadRepository {
    constructor() {
        super('admission_leads');
    }

    private toDomain(row: any): AdmissionLead {
        return new AdmissionLead(
            row.id,
            row.enquiry_id,
            row.counselor_id,
            row.status as LeadStatus,
            row.lost_reason,
            new Date(row.created_at),
            new Date(row.updated_at),
            row.deleted_at ? new Date(row.deleted_at) : null
        );
    }

    private toPersistence(domain: AdmissionLead): any {
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

    public async findById(id: string): Promise<AdmissionLead | null> {
        const { data, error } = await this.activeQuery.eq('id', id).maybeSingle();
        if (error) throw error;
        return data ? this.toDomain(data) : null;
    }

    /**
     * Finds a lead by its source enquiry_id (FK). Used to check if an enquiry
     * was already auto-converted to a lead during counselor assignment.
     */
    public async findByEnquiryId(enquiryId: string): Promise<AdmissionLead | null> {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .is('deleted_at', null)
            .eq('enquiry_id', enquiryId)
            .maybeSingle();
        if (error) throw error;
        return data ? this.toDomain(data) : null;
    }

    public async findByEnquiryIds(enquiryIds: string[]): Promise<Map<string, AdmissionLead>> {
        if (!enquiryIds.length) return new Map();
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .is('deleted_at', null)
            .in('enquiry_id', enquiryIds);
        if (error) throw error;
        return new Map((data ?? []).map(row => [row.enquiry_id, this.toDomain(row)]));
    }

    public async save(lead: AdmissionLead): Promise<AdmissionLead> {
        const payload = this.toPersistence(lead);
        const { data, error } = await supabase
            .from(this.tableName)
            .upsert(payload)
            .select()
            .single();

        if (error) throw error;
        return this.toDomain(data);
    }

    /**
     * Saves a lead while asserting optimistic locking (updates must verify the updated_at timestamp match).
     */
    public async saveWithOptimisticLock(lead: AdmissionLead, expectedUpdatedAt: Date): Promise<AdmissionLead> {
        const payload = this.toPersistence(lead);
        payload.updated_at = new Date().toISOString(); // Set new update time

        const dateMs = expectedUpdatedAt.getTime();
        const minDate = new Date(dateMs - 10).toISOString();
        const maxDate = new Date(dateMs + 10).toISOString();

        const { data, error } = await supabase
            .from(this.tableName)
            .update(payload)
            .eq('id', lead.id)
            .gte('updated_at', minDate)
            .lte('updated_at', maxDate)
            .select()
            .maybeSingle();

        if (error) throw error;
        if (!data) {
            throw new Error('OPTIMISTIC_LOCK_FAILED');
        }
        return this.toDomain(data);
    }

    public async findAll(
        filters: { counselorId?: string; status?: string }, 
        page: number = 1, 
        limit: number = 10,
        sortColumn?: string,
        sortOrder?: 'asc' | 'desc'
    ): Promise<{ data: AdmissionLead[]; total: number }> {
        const baseQuery = supabase
            .from(this.tableName)
            .select('*', { count: 'exact' })
            .is('deleted_at', null);

        const filterMap: Record<string, any> = {};
        if (filters.counselorId) filterMap.counselor_id = filters.counselorId;
        if (filters.status) filterMap.status = filters.status;

        const buildParams = {
            filter: filterMap,
            page,
            limit,
            sortColumn,
            sortOrder
        };

        const query = this.buildQuery(baseQuery, buildParams);
        const { data, count, error } = await query;

        if (error) throw error;
        return {
            data: (data || []).map((row: any) => this.toDomain(row)),
            total: count || 0
        };
    }

    public async softDelete(id: string): Promise<void> {
        await this.performSoftDelete(id);
    }

    public async logFollowup(
        leadId: string, 
        followupData: { scheduled_date: Date; notes?: string | null; created_by: string; status?: string }
    ): Promise<any> {
        const { data, error } = await supabase
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

        if (error) throw error;
        return data;
    }

    public async getFollowups(leadId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('admission_followups')
            .select('*')
            .eq('lead_id', leadId)
            .order('scheduled_date', { ascending: false });

        if (error) throw error;
        return data || [];
    }
}
