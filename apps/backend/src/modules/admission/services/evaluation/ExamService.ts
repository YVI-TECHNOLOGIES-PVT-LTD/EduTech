import { ExamRepository } from '../../repositories/evaluation/ExamRepository';
import { ApplicationRepository } from '../../repositories/application/ApplicationRepository';
import { ExamTemplate } from '../../domain/evaluation/ExamTemplate';
import { ExamSchedule } from '../../domain/evaluation/ExamSchedule';
import { HallTicket } from '../../domain/evaluation/HallTicket';
import { ExamValidator } from './validators/ExamValidator';
import { AuditService } from '../AuditService';

export class ExamService {
    constructor(
        private readonly examRepo: ExamRepository,
        private readonly appRepo: ApplicationRepository,
        private readonly examValidator: ExamValidator,
        private readonly auditService: AuditService
    ) {}

    public async createTemplate(payload: {
        name: string;
        grade: string;
        duration: number;
        total_marks: number;
        passing_marks: number;
    }): Promise<ExamTemplate> {
        const template = new ExamTemplate(
            crypto.randomUUID(),
            payload.name,
            payload.grade,
            payload.duration,
            payload.total_marks,
            payload.passing_marks,
            new Date(),
            new Date()
        );
        await this.examRepo.saveTemplate(template);
        return template;
    }

    public async scheduleExam(
        schoolId: string,
        academicYearId: string,
        templateId: string,
        roomName: string,
        invigilatorName: string,
        examDate: Date
    ): Promise<ExamSchedule> {
        const schedule = new ExamSchedule(
            crypto.randomUUID(),
            templateId,
            schoolId,
            academicYearId,
            roomName,
            invigilatorName,
            examDate,
            'SCHEDULED',
            new Date(),
            new Date()
        );
        await this.examRepo.saveSchedule(schedule);
        return schedule;
    }

    public async allocateCandidate(
        sessionId: string,
        applicationId: string,
        seatNumber: string,
        reportingTime: Date,
        createdBy: string | null,
        correlationId?: string
    ): Promise<any> {
        // Run eligibility validators pipeline
        await this.examValidator.validate(applicationId);

        // Assert session schedule exists
        const schedule = await this.examRepo.findScheduleById(sessionId);
        if (!schedule) {
            throw new Error(`Exam session schedule with ID ${sessionId} not found`);
        }

        // Generate hall ticket number
        const hallTicketNum = `HT-${sessionId.substring(0, 4).toUpperCase()}-${applicationId.substring(0, 6).toUpperCase()}`;

        // Create seat allocation candidate
        const candidate = {
            id: crypto.randomUUID(),
            session_id: sessionId,
            application_id: applicationId,
            hall_ticket_number: hallTicketNum,
            seat_number: seatNumber,
            attendance_status: 'PENDING',
            remarks: null
        };
        await this.examRepo.saveCandidate(candidate);

        // Generate and register Hall Ticket
        const ticket = new HallTicket(
            crypto.randomUUID(),
            applicationId,
            sessionId,
            hallTicketNum,
            schedule.roomName,
            reportingTime,
            null,
            new Date()
        );
        await this.examRepo.saveHallTicket(ticket);

        // Log timeline events
        await this.appRepo.logWorkflow(
            applicationId,
            'EXAM_SCHEDULED',
            null,
            'SUBMITTED',
            createdBy,
            `Entrance exam scheduled for room ${schedule.roomName} on ${schedule.examDate.toLocaleDateString()}. Hall Ticket generated: ${hallTicketNum}`
        );

        // Audit upload log
        await this.auditService.logAudit({
            action: 'CANDIDATE_EXAM_ALLOCATED',
            entityName: 'admission_exam_session_candidates',
            entityId: candidate.id,
            afterState: { hallTicketNum, seatNumber },
            userId: createdBy,
            correlationId
        });

        return { candidate, ticket };
    }
}
