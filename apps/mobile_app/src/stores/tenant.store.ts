import { create } from 'zustand';
import { WorkspaceOption, TenantInfo } from '../types/tenant.types';

interface TenantState {
  tenantInfo: TenantInfo | null;
  workspaces: WorkspaceOption[];
  selectedWorkspace: WorkspaceOption | null;
  setTenantInfo: (info: TenantInfo | null) => void;
  setWorkspaces: (workspaces: WorkspaceOption[]) => void;
  setSelectedWorkspace: (workspace: WorkspaceOption | null) => void;
  clearTenant: () => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  tenantInfo: null,
  workspaces: [],
  selectedWorkspace: null,
  setTenantInfo: (info) => set({ tenantInfo: info }),
  setWorkspaces: (workspaces) => set({ workspaces }),
  setSelectedWorkspace: (workspace) =>
    set({
      selectedWorkspace: workspace,
      tenantInfo: workspace
        ? {
            tenantId: workspace.id,
            workspaceId: workspace.id,
            schoolId: workspace.schoolId,
            academicYearId: workspace.academicYearId,
            schoolName: workspace.name,
            currency: 'USD',
            timezone: 'UTC',
          }
        : null,
    }),
  clearTenant: () =>
    set({
      tenantInfo: null,
      workspaces: [],
      selectedWorkspace: null,
    }),
}));
