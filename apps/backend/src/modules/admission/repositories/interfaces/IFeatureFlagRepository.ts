export interface IFeatureFlagRepository {
    findByKey(module: string, key: string, environment: string, tenantId: string | null): Promise<{ enabled: boolean; description?: string } | null>;
    save(module: string, key: string, enabled: boolean, environment: string, tenantId: string | null, description?: string): Promise<any>;
    findAll(environment: string, tenantId: string | null): Promise<any[]>;
}
