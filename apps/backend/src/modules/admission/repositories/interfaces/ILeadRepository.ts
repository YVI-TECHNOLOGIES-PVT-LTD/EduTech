import { AdmissionLead } from '../../domain/AdmissionLead';

export interface ILeadRepository {
    findById(id: string): Promise<AdmissionLead | null>;
    save(lead: AdmissionLead): Promise<AdmissionLead>;
    findAll(filters: { counselorId?: string; status?: string }, page: number, limit: number): Promise<{ data: AdmissionLead[]; total: number }>;
    softDelete(id: string): Promise<void>;
    logFollowup(leadId: string, followupData: { scheduled_date: Date; notes?: string | null; created_by: string; status?: string }): Promise<any>;
    getFollowups(leadId: string): Promise<any[]>;
}
