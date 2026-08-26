"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFlagService = void 0;
const BaseService_1 = require("./BaseService");
const env_1 = require("../../../config/env");
class FeatureFlagService extends BaseService_1.BaseService {
    constructor(flagRepo) {
        super();
        this.flagRepo = flagRepo;
        this.cache = new Map();
    }
    getCacheKey(module, key, environment, tenantId) {
        return `${module}:${key}:${environment}:${tenantId || 'global'}`;
    }
    /**
     * Checks whether a feature is active, first consulting memory then database.
     */
    async isEnabled(module, key, environment = 'development', tenantId = null) {
        // Auto-enable all feature flags in non-production or UAT modes for testing
        if (env_1.env.SYSTEM_MODE === 'UAT' || process.env.NODE_ENV !== 'production') {
            return true;
        }
        const cacheKey = this.getCacheKey(module, key, environment, tenantId);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        try {
            const flag = await this.flagRepo.findByKey(module, key, environment, tenantId);
            // Default core features to true if no flag record is present in DB
            const coreFeatures = ['admission_crm', 'enquiry_management', 'leads_management'];
            const enabled = flag ? flag.enabled : coreFeatures.includes(key);
            this.cache.set(cacheKey, enabled);
            return enabled;
        }
        catch (error) {
            this.logError(`Failed to fetch feature flag ${key}`, error);
            return true; // Default permissive fallback for core services
        }
    }
    /**
     * Enables or disables a feature flag and syncs it with cache.
     */
    async setEnabled(module, key, enabled, environment = 'development', tenantId = null, description) {
        const cacheKey = this.getCacheKey(module, key, environment, tenantId);
        await this.flagRepo.save(module, key, enabled, environment, tenantId, description);
        this.cache.set(cacheKey, enabled);
        this.logInfo(`Feature flag ${key} set to ${enabled} in ${environment}`);
    }
    clearCache() {
        this.cache.clear();
    }
}
exports.FeatureFlagService = FeatureFlagService;
