"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAssessmentConfigSchema = void 0;
const zod_1 = require("zod");
exports.updateAssessmentConfigSchema = zod_1.z.object({
    max_upload_size_mb: zod_1.z.number().int().min(1).max(100).optional(),
    autosave_interval_secs: zod_1.z.number().int().min(5).max(60).optional(),
    default_heartbeat_secs: zod_1.z.number().int().min(10).max(120).optional(),
    timezone: zod_1.z.string().min(1).optional(),
    grading_scale: zod_1.z.array(zod_1.z.any()).optional(),
    retention_telemetry_days: zod_1.z.number().int().min(30).optional(),
    retention_attempts_years: zod_1.z.number().int().min(1).optional()
});
