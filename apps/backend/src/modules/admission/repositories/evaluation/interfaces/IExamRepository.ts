import { ExamTemplate } from '../../../domain/evaluation/ExamTemplate';
import { ExamSchedule } from '../../../domain/evaluation/ExamSchedule';
import { ExamResult } from '../../../domain/evaluation/ExamResult';
import { HallTicket } from '../../../domain/evaluation/HallTicket';

export interface IExamRepository {
    findTemplateById(id: string): Promise<ExamTemplate | null>;
    findTemplateByGrade(grade: string): Promise<ExamTemplate | null>;
    saveTemplate(template: ExamTemplate): Promise<void>;
    
    findScheduleById(id: string): Promise<ExamSchedule | null>;
    saveSchedule(schedule: ExamSchedule): Promise<void>;
    
    findCandidate(sessionId: string, applicationId: string): Promise<any | null>;
    saveCandidate(candidate: any): Promise<void>;
    
    findSubjectsByTemplateId(templateId: string): Promise<any[]>;
    saveResult(result: ExamResult): Promise<void>;
    findResultsByCandidateId(candidateId: string): Promise<ExamResult[]>;
    
    saveHallTicket(ticket: HallTicket): Promise<void>;
    findHallTicketByApplicationId(applicationId: string): Promise<HallTicket | null>;
    
    // Assessment Engine
    findPolicyByScheduleId(scheduleId: string): Promise<any | null>;
    findSessionById(id: string): Promise<any | null>;
    findSessionByCandidateId(candidateId: string): Promise<any | null>;
    saveSession(session: any): Promise<void>;
    findAttemptById(id: string): Promise<any | null>;
    findAttemptBySessionId(sessionId: string): Promise<any | null>;
    saveAttempt(attempt: any): Promise<void>;
    createSnapshot(templateId: string, schoolId: string): Promise<string>;
    findSnapshotQuestions(snapshotId: string): Promise<any[]>;
    saveResponses(attemptId: string, responses: any[]): Promise<void>;
    saveEvent(sessionId: string, eventType: string, details: any): Promise<void>;
    saveOutbox(schoolId: string, eventType: string, payload: any): Promise<void>;
}
