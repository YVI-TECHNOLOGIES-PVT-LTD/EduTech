"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assessmentConfigurationSchema = void 0;
const zod_1 = require("zod");
exports.assessmentConfigurationSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    school_id: zod_1.z.string().uuid(),
    max_upload_size_mb: zod_1.z.number().int().min(1).max(100).default(10),
    autosave_interval_secs: zod_1.z.number().int().min(5).max(60).default(10),
    default_heartbeat_secs: zod_1.z.number().int().min(10).max(120).default(30),
    timezone: zod_1.z.string().default('UTC'),
    grading_scale: zod_1.z.array(zod_1.z.any()).default([]),
    retention_telemetry_days: zod_1.z.number().int().min(30).default(90),
    retention_attempts_years: zod_1.z.number().int().min(1).default(7),
    // Extended fields stored in the settings JSONB field
    settings: zod_1.z.object({
        assessmentTypes: zod_1.z.array(zod_1.z.string()).default(['QUIZ', 'EXAM', 'ASSIGNMENT']),
        durationMinutes: zod_1.z.number().int().min(0).default(60),
        passingMarks: zod_1.z.number().min(0).default(40),
        negativeMarking: zod_1.z.boolean().default(false),
        negativeMarkingValue: zod_1.z.number().min(0).default(0),
        autoSave: zod_1.z.boolean().default(true),
        shuffleQuestions: zod_1.z.boolean().default(false),
        shuffleOptions: zod_1.z.boolean().default(false),
        browserLock: zod_1.z.boolean().default(false),
        fullscreenEnforcement: zod_1.z.boolean().default(false),
        resumePolicy: zod_1.z.enum(['ALLOW_ANYTIME', 'ALLOW_WITH_PROCTOR_APPROVAL', 'DISALLOW']).default('ALLOW_ANYTIME'),
        attemptLimit: zod_1.z.number().int().min(1).default(1),
        proctoring: zod_1.z.object({
            enabled: zod_1.z.boolean().default(false),
            webcam: zod_1.z.boolean().default(false),
            microphone: zod_1.z.boolean().default(false),
            screenShare: zod_1.z.boolean().default(false),
            aiVerification: zod_1.z.boolean().default(false),
        }).default({
            enabled: false,
            webcam: false,
            microphone: false,
            screenShare: false,
            aiVerification: false,
        }),
        publishingRules: zod_1.z.object({
            autoPublish: zod_1.z.boolean().default(false),
            releaseGradesImmediately: zod_1.z.boolean().default(false),
        }).default({
            autoPublish: false,
            releaseGradesImmediately: false,
        }),
        notifications: zod_1.z.object({
            emailOnScheduled: zod_1.z.boolean().default(true),
            emailOnGraded: zod_1.z.boolean().default(true),
        }).default({
            emailOnScheduled: true,
            emailOnGraded: true,
        }),
        lateSubmission: zod_1.z.object({
            allowed: zod_1.z.boolean().default(true),
            gracePeriodMinutes: zod_1.z.number().int().min(0).default(15),
            penaltyPercentagePerMinute: zod_1.z.number().min(0).default(0),
        }).default({
            allowed: true,
            gracePeriodMinutes: 15,
            penaltyPercentagePerMinute: 0,
        }),
        evaluationType: zod_1.z.enum(['AUTO', 'MANUAL', 'HYBRID']).default('AUTO'),
        resultVisibility: zod_1.z.enum(['IMMEDIATE', 'AFTER_PUBLISH', 'HIDDEN']).default('AFTER_PUBLISH'),
        version: zod_1.z.number().int().min(1).default(1),
        status: zod_1.z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
    }).default({
        assessmentTypes: ['QUIZ', 'EXAM', 'ASSIGNMENT'],
        durationMinutes: 60,
        passingMarks: 40,
        negativeMarking: false,
        negativeMarkingValue: 0,
        autoSave: true,
        shuffleQuestions: false,
        shuffleOptions: false,
        browserLock: false,
        fullscreenEnforcement: false,
        resumePolicy: 'ALLOW_ANYTIME',
        attemptLimit: 1,
        proctoring: { enabled: false, webcam: false, microphone: false, screenShare: false, aiVerification: false },
        publishingRules: { autoPublish: false, releaseGradesImmediately: false },
        notifications: { emailOnScheduled: true, emailOnGraded: true },
        lateSubmission: { allowed: true, gracePeriodMinutes: 15, penaltyPercentagePerMinute: 0 },
        evaluationType: 'AUTO',
        resultVisibility: 'AFTER_PUBLISH',
        version: 1,
        status: 'ACTIVE'
    }),
});
