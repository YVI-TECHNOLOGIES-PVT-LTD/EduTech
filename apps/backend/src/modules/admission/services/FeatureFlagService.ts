import { IFeatureFlagRepository } from '../repositories/interfaces/IFeatureFlagRepository';
import { BaseService } from './BaseService';
import { env } from '../../../config/env';

export class FeatureFlagService extends BaseService {
    private readonly cache = new Map<string, boolean>();

    constructor(private readonly flagRepo: IFeatureFlagRepository) {
        super();
    }

    private getCacheKey(module: string, key: string, environment: string, tenantId: string | null): string {
        return `${module}:${key}:${environment}:${tenantId || 'global'}`;
    }

    /**
     * Checks whether a feature is active, first consulting memory then database.
     */
    public async isEnabled(
        module: string, 
        key: string, 
        environment: string = 'development', 
        tenantId: string | null = null
    ): Promise<boolean> {
        // Auto-enable all feature flags in non-production or UAT modes for testing
        if (env.SYSTEM_MODE === 'UAT' || process.env.NODE_ENV !== 'production') {
            return true;
        }

        const cacheKey = this.getCacheKey(module, key, environment, tenantId);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        try {
            const flag = await this.flagRepo.findByKey(module, key, environment, tenantId);
            const enabled = flag ? flag.enabled : false;
            this.cache.set(cacheKey, enabled);
            return enabled;
        } catch (error) {
            this.logError(`Failed to fetch feature flag ${key}`, error);
            return false; // Default safe fallback
        }
    }

    /**
     * Enables or disables a feature flag and syncs it with cache.
     */
    public async setEnabled(
        module: string,
        key: string,
        enabled: boolean,
        environment: string = 'development',
        tenantId: string | null = null,
        description?: string
    ): Promise<void> {
        const cacheKey = this.getCacheKey(module, key, environment, tenantId);
        await this.flagRepo.save(module, key, enabled, environment, tenantId, description);
        this.cache.set(cacheKey, enabled);
        this.logInfo(`Feature flag ${key} set to ${enabled} in ${environment}`);
    }

    public clearCache(): void {
        this.cache.clear();
    }
}
