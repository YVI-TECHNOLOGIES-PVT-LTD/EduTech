"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentAttemptService = void 0;
const BaseService_1 = require("../BaseService");
const crypto = __importStar(require("crypto"));
class AssessmentAttemptService extends BaseService_1.BaseService {
    constructor(examRepo) {
        super();
        this.examRepo = examRepo;
    }
    async startAttempt(sessionId, schoolId) {
        // Find session
        const session = await this.examRepo.findSessionById(sessionId);
        if (!session) {
            throw new Error('Session not found.');
        }
        // Check if active attempt already exists
        let attempt = await this.examRepo.findAttemptBySessionId(sessionId);
        if (attempt) {
            if (attempt.status === 'SUBMITTED' || attempt.status === 'EXPIRED') {
                throw new Error('Assessment has already been completed.');
            }
            return attempt;
        }
        // Fetch candidate allocation metadata
        const candidate = await this.examRepo.findCandidateById(session.candidate_allocation_id);
        if (!candidate) {
            throw new Error('Candidate allocation not found.');
        }
        // Fetch exam schedule
        const schedule = await this.examRepo.findScheduleById(candidate.session_id);
        if (!schedule) {
            throw new Error('Exam schedule not found.');
        }
        // Create immutable snapshot of the assessment template
        const snapshotId = await this.examRepo.createSnapshot(schedule.templateId, schoolId);
        // Initialize attempt
        attempt = {
            id: crypto.randomUUID(),
            school_id: schoolId,
            session_id: sessionId,
            snapshot_id: snapshotId,
            start_time: new Date(),
            status: 'STARTED',
            evaluation_status: 'DRAFT'
        };
        await this.examRepo.saveAttempt(attempt);
        return attempt;
    }
    async loadQuestions(attemptId) {
        const attempt = await this.examRepo.findAttemptById(attemptId);
        if (!attempt) {
            throw new Error('Attempt not found.');
        }
        if (attempt.status === 'SUBMITTED' || attempt.status === 'EXPIRED') {
            throw new Error('Assessment already submitted.');
        }
        // Load snapshot questions (correct flags omitted in Repo layer)
        return this.examRepo.findSnapshotQuestions(attempt.snapshot_id);
    }
    async saveResponses(attemptId, responses) {
        const attempt = await this.examRepo.findAttemptById(attemptId);
        if (!attempt) {
            throw new Error('Attempt not found.');
        }
        if (attempt.status === 'SUBMITTED' || attempt.status === 'EXPIRED') {
            throw new Error('Cannot write answers to a submitted assessment.');
        }
        await this.examRepo.saveResponses(attemptId, responses);
    }
    async logTelemetryEvent(sessionId, eventType, details) {
        await this.examRepo.saveEvent(sessionId, eventType, details);
    }
}
exports.AssessmentAttemptService = AssessmentAttemptService;
