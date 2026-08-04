import { AdmissionFollowup } from '../../domain/AdmissionFollowup';

export interface IFollowUpRepository {
    findById(id: string): Promise<AdmissionFollowup | null>;
    save(followup: AdmissionFollowup): Promise<AdmissionFollowup>;
    findAll(filters: { leadId?: string; status?: string }, page: number, limit: number): Promise<{ data: AdmissionFollowup[]; total: number }>;
}
