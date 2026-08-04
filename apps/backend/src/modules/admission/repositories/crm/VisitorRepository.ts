import { supabase } from '../../../../config/supabase';
import { AdmissionVisitor, VisitType } from '../../domain/AdmissionVisitor';
import { IVisitorRepository } from '../interfaces/IVisitorRepository';
import { BaseRepository } from '../BaseRepository';

export class VisitorRepository extends BaseRepository<AdmissionVisitor> implements IVisitorRepository {
    constructor() {
        super('admission_visitors');
    }

    private toDomain(row: any): AdmissionVisitor {
        return new AdmissionVisitor(
            row.id,
            row.school_id,
            row.visitor_name,
            row.phone,
            row.purpose,
            new Date(row.time_in),
            row.time_out ? new Date(row.time_out) : null,
            row.lead_id,
            row.created_by,
            new Date(row.created_at),
            row.counselor_id || null,
            row.remarks || null,
            row.visit_type as VisitType || null,
            row.visit_outcome || null
        );
    }

    private toPersistence(domain: AdmissionVisitor): any {
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

    public async findById(id: string): Promise<AdmissionVisitor | null> {
        const { data, error } = await this.rawQuery.eq('id', id).maybeSingle();
        if (error) throw error;
        return data ? this.toDomain(data) : null;
    }

    public async save(visitor: AdmissionVisitor): Promise<AdmissionVisitor> {
        const payload = this.toPersistence(visitor);
        const { data, error } = await supabase
            .from(this.tableName)
            .upsert(payload)
            .select()
            .single();

        if (error) throw error;
        return this.toDomain(data);
    }

    public async findAll(
        schoolId: string, 
        page: number = 1, 
        limit: number = 10,
        filters?: Record<string, any>,
        search?: string,
        sortColumn?: string,
        sortOrder?: 'asc' | 'desc'
    ): Promise<{ data: AdmissionVisitor[]; total: number }> {
        const baseQuery = supabase
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

        if (error) throw error;
        return {
            data: (data || []).map((row: any) => this.toDomain(row)),
            total: count || 0
        };
    }
}
