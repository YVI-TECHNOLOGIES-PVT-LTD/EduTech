export interface TenantInfo {
  tenantId: string;
  workspaceId: string;
  schoolId: string;
  academicYearId: string;
  schoolName: string;
  schoolLogo?: string;
  currency: string;
  timezone: string;
}

export interface WorkspaceOption {
  id: string;
  name: string;
  code: string;
  logoUrl?: string;
  schoolId: string;
  academicYearId: string;
}
