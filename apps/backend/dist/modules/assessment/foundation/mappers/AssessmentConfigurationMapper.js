"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentConfigurationMapper = void 0;
class AssessmentConfigurationMapper {
    static toDTO(entity) {
        if (!entity)
            return null;
        return {
            id: entity.id,
            school_id: entity.school_id,
            max_upload_size_mb: entity.max_upload_size_mb,
            autosave_interval_secs: entity.autosave_interval_secs,
            default_heartbeat_secs: entity.default_heartbeat_secs,
            timezone: entity.timezone,
            grading_scale: entity.grading_scale || [],
            retention_telemetry_days: entity.retention_telemetry_days,
            retention_attempts_years: entity.retention_attempts_years,
            settings: entity.settings || {},
        };
    }
    static toEntity(dto) {
        if (!dto)
            return null;
        return {
            id: dto.id,
            school_id: dto.school_id,
            max_upload_size_mb: dto.max_upload_size_mb,
            autosave_interval_secs: dto.autosave_interval_secs,
            default_heartbeat_secs: dto.default_heartbeat_secs,
            timezone: dto.timezone,
            grading_scale: dto.grading_scale,
            retention_telemetry_days: dto.retention_telemetry_days,
            retention_attempts_years: dto.retention_attempts_years,
            settings: dto.settings,
        };
    }
}
exports.AssessmentConfigurationMapper = AssessmentConfigurationMapper;
