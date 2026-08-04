import { useTenantStore } from '../../stores/tenant.store';
import { WorkspaceOption, TenantInfo } from '../../types/tenant.types';
import { SecureStorageService } from '../storage/secure-store';
import { STORAGE_KEYS } from '../../constants/storage-keys';

export class TenantService {
  static async selectWorkspace(workspace: WorkspaceOption): Promise<void> {
    useTenantStore.getState().setSelectedWorkspace(workspace);
    await SecureStorageService.setObject(STORAGE_KEYS.TENANT_DATA, workspace);
    await SecureStorageService.setItem(STORAGE_KEYS.WORKSPACE_ID, workspace.id);
    await SecureStorageService.setItem(STORAGE_KEYS.SCHOOL_ID, workspace.schoolId);
    await SecureStorageService.setItem(STORAGE_KEYS.ACADEMIC_YEAR_ID, workspace.academicYearId);
  }

  static async loadStoredTenant(): Promise<WorkspaceOption | null> {
    const workspace = await SecureStorageService.getObject<WorkspaceOption>(
      STORAGE_KEYS.TENANT_DATA,
    );
    if (workspace) {
      useTenantStore.getState().setSelectedWorkspace(workspace);
    }
    return workspace;
  }

  static getActiveTenantInfo(): TenantInfo | null {
    return useTenantStore.getState().tenantInfo;
  }
}
