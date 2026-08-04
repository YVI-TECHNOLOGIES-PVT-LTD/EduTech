import { apiClient } from '../../../lib/api-client';
import { ApiRequestConfig } from '../../../lib/interceptors/error.interceptor';

export interface SchoolMaster {
    id: string;
    name: string;
    code: string;
}

export interface AcademicYearMaster {
    id: string;
    year_label: string;
    is_active: boolean;
    school_id: string;
}

export interface GradeMaster {
    id: string;
    name: string; // e.g. "Class 1", "Grade 1"
    school_id: string;
    academic_year_id: string;
    sections?: { id: string; name: string }[];
}

export interface TransportRouteMaster {
    id: string;
    name: string;
}

export interface FeeStructureMaster {
    id: string;
    name: string;
    code: string;
    amount?: number;
}

export interface OfferTemplateMaster {
    id: string;
    name: string;
}

export interface CounselorMaster {
    id: string;
    full_name: string;
    email: string;
}

export const MasterDataService = {
    getPublicConfig: async (schoolId?: string): Promise<any> => {
        const res = await apiClient.get<any>('/public/admission/config', {
            params: { school_id: schoolId },
            silent: true
        } as ApiRequestConfig);
        return res.data;
    },

    getSchools: async (): Promise<SchoolMaster[]> => {
        const res = await apiClient.get<SchoolMaster[]>('/schools', { silent: true } as ApiRequestConfig);
        return res.data || [];
    },

    getCurrentSchool: async (schoolId?: string): Promise<SchoolMaster | null> => {
        const res = await apiClient.get<SchoolMaster>('/schools/current', { silent: true } as ApiRequestConfig);
        return res.data || null;
    },

    getAcademicYears: async (schoolId?: string): Promise<AcademicYearMaster[]> => {
        const res = await apiClient.get<AcademicYearMaster[]>('/academic-years', { silent: true } as ApiRequestConfig);
        return res.data || [];
    },

    getCurrentAcademicYear: async (schoolId?: string): Promise<AcademicYearMaster | null> => {
        const res = await apiClient.get<AcademicYearMaster>('/academic-years/current', { silent: true } as ApiRequestConfig);
        return res.data || null;
    },

    getGrades: async (): Promise<GradeMaster[]> => {
        // Fetches from /academic/classes which lists classes with sections
        const res = await apiClient.get<GradeMaster[]>('/academic/classes', { silent: true } as ApiRequestConfig);
        return res.data || [];
    },

    getTransportRoutes: async (): Promise<TransportRouteMaster[]> => {
        const res = await apiClient.get<TransportRouteMaster[]>('/v1/admission/crm/transport-routes', { silent: true } as ApiRequestConfig);
        return res.data || [];
    },

    getFeeStructures: async (): Promise<FeeStructureMaster[]> => {
        const res = await apiClient.get<any[]>('/v1/admission/crm/fee-structures', { silent: true } as ApiRequestConfig);
        return res.data?.map(item => ({
            id: item.id,
            name: item.name,
            code: item.code || '',
            amount: item.amount ? Number(item.amount) : undefined
        })) || [];
    },

    getOfferTemplates: async (): Promise<OfferTemplateMaster[]> => {
        const res = await apiClient.get<OfferTemplateMaster[]>('/v1/admission/crm/offer-templates', { silent: true } as ApiRequestConfig);
        return res.data || [];
    },

    getCounselors: async (schoolId?: string): Promise<CounselorMaster[]> => {
        const res = await apiClient.get<CounselorMaster[]>('/v1/admission/crm/counselors', { silent: true } as ApiRequestConfig);
        return res.data || [];
    },

    // Standard static lists for ERP consistency (replacing inline UI arrays)
    getBoards: (): string[] => ['CBSE', 'ICSE', 'State Board', 'IGCSE', 'IB'],
    getQuotas: (): string[] => ['Regular', 'RTE', 'Management', 'Sibling', 'Scholarship'],
    getCategories: (): string[] => ['General', 'OBC', 'SC', 'ST', 'EWS'],
    getAdmissionSources: (): string[] => ['Website', 'Phone', 'Walk-in', 'Campaign', 'Referral'],
    getBloodGroups: (): string[] => ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
    getReligions: (): string[] => ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Others'],
    getOccupations: (): string[] => ['Salaried', 'Self-Employed', 'Business', 'Professional', 'Homemaker', 'Retired', 'Others'],
    getRelationships: (): string[] => ['Father', 'Mother', 'Guardian'],
    getCountries: (): string[] => ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'United Arab Emirates'],
    getStates: (): string[] => ['Telangana', 'Andhra Pradesh', 'Karnataka', 'Tamil Nadu', 'Maharashtra', 'Delhi'],
    getCities: (): string[] => ['Hyderabad', 'Bengaluru', 'Chennai', 'Mumbai', 'Delhi', 'Pune'],
    getHostelRoomTypes: (): string[] => ['Single (AC)', 'Single (Non-AC)', 'Shared (AC)', 'Shared (Non-AC)'],
};
