import { AdmissionEnquiry } from '../../domain/AdmissionEnquiry';

export interface IEnquiryRepository {
    findById(id: string): Promise<AdmissionEnquiry | null>;
    findByPhone(phone: string): Promise<AdmissionEnquiry | null>;
    save(enquiry: AdmissionEnquiry): Promise<AdmissionEnquiry>;
    findAll(schoolId: string, page: number, limit: number): Promise<{ data: AdmissionEnquiry[]; total: number }>;
    softDelete(id: string): Promise<void>;
}
