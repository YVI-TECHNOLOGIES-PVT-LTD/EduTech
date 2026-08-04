"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentConfigurationService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const AssessmentConfigurationRepository_1 = require("../repositories/AssessmentConfigurationRepository");
const AssessmentConfigurationValidator_1 = require("../validators/AssessmentConfigurationValidator");
const AssessmentConfigurationMapper_1 = require("../mappers/AssessmentConfigurationMapper");
const AuditService_1 = require("../../../admission/services/AuditService");
const event_bus_service_1 = require("../../../../workflows/event-bus.service");
const NotFoundError_1 = require("../../../admission/errors/NotFoundError");
const config_service_1 = require("./config.service");
const CACHE_TTL_24H = 24 * 60 * 60 * 1000;
class AssessmentConfigurationService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new AssessmentConfigurationRepository_1.AssessmentConfigurationRepository();
        this.audit = new AuditService_1.AuditService();
    }
    getCacheKey(schoolId) {
        return `school_config:${schoolId}`;
    }
    async listAllConfigs(schoolId, correlationId) {
        this.logInfo(`Listing all configurations for school: ${schoolId}`, correlationId);
        const configs = await this.repo.findAll(schoolId);
        return configs.map(c => AssessmentConfigurationMapper_1.AssessmentConfigurationMapper.toDTO(c));
    }
    async getConfigById(id, correlationId) {
        this.logInfo(`Fetching configuration by id: ${id}`, correlationId);
        const config = await this.repo.findById(id);
        if (!config) {
            throw new NotFoundError_1.NotFoundError(`Configuration not found with ID: ${id}`);
        }
        return AssessmentConfigurationMapper_1.AssessmentConfigurationMapper.toDTO(config);
    }
    async getConfigBySchool(schoolId, correlationId) {
        const cacheKey = this.getCacheKey(schoolId);
        const cached = config_service_1.cacheProvider.get(cacheKey);
        if (cached) {
            this.logInfo(`Cache hit for school configuration: ${schoolId}`, correlationId);
            return cached;
        }
        this.logInfo(`Cache miss. Fetching school configuration from database: ${schoolId}`, correlationId);
        const config = await this.repo.findConfigBySchool(schoolId);
        const dto = AssessmentConfigurationMapper_1.AssessmentConfigurationMapper.toDTO(config);
        config_service_1.cacheProvider.set(cacheKey, dto, CACHE_TTL_24H);
        return dto;
    }
    async createConfig(schoolId, userId, payload, correlationId) {
        const validated = AssessmentConfigurationValidator_1.AssessmentConfigurationValidator.validate({
            ...payload,
            school_id: schoolId
        });
        this.logInfo(`Creating new assessment configuration for school: ${schoolId}`, correlationId);
        const entity = AssessmentConfigurationMapper_1.AssessmentConfigurationMapper.toEntity(validated);
        const created = await this.repo.create(entity);
        const dto = AssessmentConfigurationMapper_1.AssessmentConfigurationMapper.toDTO(created);
        // Invalidate Cache
        config_service_1.cacheProvider.delete(this.getCacheKey(schoolId));
        // Audit Log
        await this.audit.logAudit({
            userId,
            action: 'ASSESSMENT_CONFIG_CREATE',
            entityName: 'assessment_configurations',
            entityId: dto.id,
            afterState: dto,
            correlationId
        });
        // Publish Event
        await event_bus_service_1.EventBus.publish('AssessmentConfigurationCreated', { configId: dto.id, schoolId, userId });
        return dto;
    }
    async updateConfig(id, schoolId, userId, payload, correlationId) {
        // Fetch existing configuration
        const beforeState = await this.getConfigById(id, correlationId);
        // Validate partial inputs
        const validated = AssessmentConfigurationValidator_1.AssessmentConfigurationValidator.validatePartial({
            ...payload,
            school_id: schoolId
        });
        this.logInfo(`Updating assessment configuration: ${id}`, correlationId);
        const entityUpdates = AssessmentConfigurationMapper_1.AssessmentConfigurationMapper.toEntity({
            ...beforeState,
            ...validated,
            id
        });
        const updated = await this.repo.update(id, entityUpdates);
        const dto = AssessmentConfigurationMapper_1.AssessmentConfigurationMapper.toDTO(updated);
        // Invalidate Cache
        config_service_1.cacheProvider.delete(this.getCacheKey(schoolId));
        // Audit Log
        await this.audit.logAudit({
            userId,
            action: 'ASSESSMENT_CONFIG_UPDATE',
            entityName: 'assessment_configurations',
            entityId: id,
            beforeState,
            afterState: dto,
            correlationId
        });
        // Publish Event
        await event_bus_service_1.EventBus.publish('AssessmentConfigurationUpdated', { configId: id, schoolId, userId });
        return dto;
    }
    async deleteConfig(id, schoolId, userId, correlationId) {
        this.logInfo(`Deleting configuration: ${id}`, correlationId);
        const beforeState = await this.getConfigById(id, correlationId);
        await this.repo.delete(id);
        // Invalidate Cache
        config_service_1.cacheProvider.delete(this.getCacheKey(schoolId));
        // Audit Log
        await this.audit.logAudit({
            userId,
            action: 'ASSESSMENT_CONFIG_DELETE',
            entityName: 'assessment_configurations',
            entityId: id,
            beforeState,
            afterState: { id, status: 'DELETED' },
            correlationId
        });
    }
    async cloneConfig(id, schoolId, userId, correlationId) {
        this.logInfo(`Cloning configuration: ${id}`, correlationId);
        const target = await this.getConfigById(id, correlationId);
        const clonedPayload = {
            ...target,
            id: undefined,
            settings: {
                ...target.settings,
                version: (target.settings.version || 1) + 1,
            }
        };
        return this.createConfig(schoolId, userId, clonedPayload, correlationId);
    }
    async resetConfig(id, schoolId, userId, correlationId) {
        this.logInfo(`Resetting configuration: ${id} to defaults`, correlationId);
        const beforeState = await this.getConfigById(id, correlationId);
        // Empty settings triggers fallback schema defaults defined in Zod schema
        const resetPayload = {
            school_id: schoolId,
            max_upload_size_mb: 10,
            autosave_interval_secs: 10,
            default_heartbeat_secs: 30,
            timezone: 'UTC',
            grading_scale: [],
            retention_telemetry_days: 90,
            retention_attempts_years: 7,
            settings: undefined // triggers Zod defaults
        };
        return this.updateConfig(id, schoolId, userId, resetPayload, correlationId);
    }
    validateConfig(payload) {
        return AssessmentConfigurationValidator_1.AssessmentConfigurationValidator.validate(payload);
    }
}
exports.AssessmentConfigurationService = AssessmentConfigurationService;
