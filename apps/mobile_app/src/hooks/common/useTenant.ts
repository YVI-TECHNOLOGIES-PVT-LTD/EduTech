import { useTenantStore } from '../../stores/tenant.store';
import { TenantService } from '../../core/tenant/tenant.service';

export const useTenant = () => {
  const tenantInfo = useTenantStore((state) => state.tenantInfo);
  const workspaces = useTenantStore((state) => state.workspaces);
  const selectedWorkspace = useTenantStore((state) => state.selectedWorkspace);

  return {
    tenantInfo,
    workspaces,
    selectedWorkspace,
    selectWorkspace: TenantService.selectWorkspace,
  };
};
