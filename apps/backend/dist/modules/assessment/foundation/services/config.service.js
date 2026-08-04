"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = exports.cacheProvider = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const foundation_repository_1 = require("../repositories/foundation.repository");
const config_dto_1 = require("../dto/config.dto");
const AuditService_1 = require("../../../admission/services/AuditService");
// Simulating Redis caching via local in-memory store with TTL
class InMemoryCache {
    constructor() {
        this.store = new Map();
    }
    get(key) {
        const item = this.store.get(key);
        if (!item)
            return null;
        if (Date.now() > item.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return item.value;
    }
    set(key, value, ttlMs) {
        this.store.set(key, {
            value,
            expiresAt: Date.now() + ttlMs
        });
    }
    delete(key) {
        this.store.delete(key);
    }
}
exports.cacheProvider = new InMemoryCache();
const CACHE_TTL_24H = 24 * 60 * 60 * 1000;
class ConfigService extends BaseService_1.BaseService {
    constructor() {
        super();
        this.repo = new foundation_repository_1.FoundationRepository();
        this.auditService = new AuditService_1.AuditService();
    }
    getCacheKey(schoolId) {
        return `school_config:${schoolId}`;
    }
    /**
     * Retrieves school configuration, checking memory cache first.
     */
    async getConfig(schoolId, correlationId) {
        const cacheKey = this.getCacheKey(schoolId);
        const cached = exports.cacheProvider.get(cacheKey);
        if (cached) {
            this.logInfo(`Cache hit for school configuration: ${schoolId}`, correlationId);
            return cached;
        }
        this.logInfo(`Cache miss. Fetching school configuration from database: ${schoolId}`, correlationId);
        const config = await this.repo.findConfigBySchool(schoolId);
        exports.cacheProvider.set(cacheKey, config, CACHE_TTL_24H);
        return config;
    }
    /**
     * Updates school configuration, invalidating cache and logging audit trail.
     */
    async updateConfig(schoolId, userId, payload, correlationId) {
        // Validate payload using Zod DTO
        const validated = this.validate(config_dto_1.updateAssessmentConfigSchema, payload);
        // Fetch current state for audit comparison
        const beforeState = await this.getConfig(schoolId, correlationId);
        // Update in database
        const updatedConfig = await this.repo.updateConfig(schoolId, validated);
        // Invalidate Cache (Invalidate after update)
        const cacheKey = this.getCacheKey(schoolId);
        exports.cacheProvider.delete(cacheKey);
        this.logInfo(`Invalidated config cache for school: ${schoolId}`, correlationId);
        // Log Audit Trail
        await this.auditService.logAudit({
            userId,
            action: 'ASSESSMENT_CONFIG_UPDATE',
            entityName: 'assessment_configurations',
            entityId: updatedConfig.id,
            beforeState,
            afterState: updatedConfig,
            correlationId
        });
        return updatedConfig;
    }
}
exports.ConfigService = ConfigService;
