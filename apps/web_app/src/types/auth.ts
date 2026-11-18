export interface EnrichedUser {
  id: string;
  email: string;
  school_id: string;
  roles: string[];
  permissions: string[];
  full_name?: string;
  phone_number?: string;
  phone?: string;
  tenant_name?: string;
  org_name?: string;
  avatar_url?: string | null;
  avatarUrl?: string | null;
  profileImage?: { available: boolean; url: string | null };
  login_status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';
  login_decision_reason?: string;
  hasEnrolledStudent?: boolean;
  isPostAdmission?: boolean;
  enabledFeatures?: {
    dashboard: boolean;
    finance: boolean;
    entrance_exam: boolean;
    hostel: boolean;
  };
}
