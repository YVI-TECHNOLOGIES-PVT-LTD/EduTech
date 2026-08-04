import { ExamRepository } from '../../repositories/evaluation/ExamRepository';
import { BaseService } from '../BaseService';
import * as crypto from 'crypto';

export class AssessmentAttemptService extends BaseService {
    constructor(private readonly examRepo: ExamRepository) {
        super();
    }

    public async startAttempt(sessionId: string, schoolId: string): Promise<any> {
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

    public async loadQuestions(attemptId: string): Promise<any[]> {
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

    public async saveResponses(attemptId: string, responses: any[]): Promise<void> {
        const attempt = await this.examRepo.findAttemptById(attemptId);
        if (!attempt) {
            throw new Error('Attempt not found.');
        }

        if (attempt.status === 'SUBMITTED' || attempt.status === 'EXPIRED') {
            throw new Error('Cannot write answers to a submitted assessment.');
        }

        await this.examRepo.saveResponses(attemptId, responses);
    }

    public async logTelemetryEvent(sessionId: string, eventType: string, details: any): Promise<void> {
        await this.examRepo.saveEvent(sessionId, eventType, details);
    }
}
