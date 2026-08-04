"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveLearningGapSchema = exports.saveRiskScoreSchema = exports.generateAccreditationSchema = exports.createSnapshotSchema = void 0;
const zod_1 = require("zod");
exports.createSnapshotSchema = zod_1.z.object({
    snapshot_type: zod_1.z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'SEMESTER', 'ACADEMIC_YEAR']),
    academic_year_id: zod_1.z.string().uuid(),
    payload: zod_1.z.record(zod_1.z.any()).default({})
});
exports.generateAccreditationSchema = zod_1.z.object({
    report_type: zod_1.z.enum(['NBA', 'NAAC', 'ABET', 'AACSB', 'NIRF']),
    attainment_metrics_json: zod_1.z.record(zod_1.z.any()).default({})
});
exports.saveRiskScoreSchema = zod_1.z.object({
    student_id: zod_1.z.string().uuid(),
    risk_level: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH']),
    risk_score: zod_1.z.number().min(0).max(1),
    factors: zod_1.z.array(zod_1.z.string()).default([])
});
exports.saveLearningGapSchema = zod_1.z.object({
    student_id: zod_1.z.string().uuid(),
    subject_id: zod_1.z.string().uuid(),
    gap_description: zod_1.z.string().min(1),
    remedial_class_recommended: zod_1.z.boolean().default(false)
});
