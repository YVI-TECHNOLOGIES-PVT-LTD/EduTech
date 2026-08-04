export interface EnrichedUser {
    id: string;
    email: string;
    school_id: string;
    roles: string[];
    permissions: string[];
    full_name?: string;
    phone_number?: string;
    login_status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';
    login_decision_reason?: string;
    enabledFeatures?: {
        dashboard: boolean;
        finance: boolean;
        entrance_exam: boolean;
        hostel: boolean;
    };
}
