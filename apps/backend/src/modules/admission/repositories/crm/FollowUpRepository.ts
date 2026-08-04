import { supabase } from '../../../../config/supabase';
import { AdmissionFollowup, FollowupStatus } from '../../domain/AdmissionFollowup';
import { IFollowUpRepository } from '../interfaces/IFollowUpRepository';
import { BaseRepository } from '../BaseRepository';

export class FollowUpRepository extends BaseRepository<AdmissionFollowup> implements IFollowUpRepository {
    constructor() {
        super('admission_followups');
    }

    private toDomain(row: any): AdmissionFollowup {
        return new AdmissionFollowup(
            row.id,
            row.lead_id,
            new Date(row.scheduled_date),
            row.completed_date ? new Date(row.completed_date) : null,
            row.status as FollowupStatus,
            row.notes || null,
            row.created_by,
            new Date(row.created_at),
            new Date(row.updated_at)
        );
    }

    private toPersistence(domain: AdmissionFollowup): any {
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

    public async findById(id: string): Promise<AdmissionFollowup | null> {
        const { data, error } = await this.rawQuery.eq('id', id).maybeSingle();
        if (error) throw error;
        return data ? this.toDomain(data) : null;
    }

    public async save(followup: AdmissionFollowup): Promise<AdmissionFollowup> {
        const payload = this.toPersistence(followup);
        const { data, error } = await supabase
            .from(this.tableName)
            .upsert(payload)
            .select()
            .single();

        if (error) throw error;
        return this.toDomain(data);
    }

    public async findAll(
        filters: { leadId?: string; status?: string }, 
        page: number = 1, 
        limit: number = 10,
        sortColumn?: string,
        sortOrder?: 'asc' | 'desc'
    ): Promise<{ data: AdmissionFollowup[]; total: number }> {
        const baseQuery = supabase
            .from(this.tableName)
            .select('*', { count: 'exact' });

        const filterMap: Record<string, any> = {};
        if (filters.leadId) filterMap.lead_id = filters.leadId;
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
}
