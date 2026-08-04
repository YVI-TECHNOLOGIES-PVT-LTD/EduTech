"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamService = void 0;
const ExamTemplate_1 = require("../../domain/evaluation/ExamTemplate");
const ExamSchedule_1 = require("../../domain/evaluation/ExamSchedule");
const HallTicket_1 = require("../../domain/evaluation/HallTicket");
class ExamService {
    constructor(examRepo, appRepo, examValidator, auditService) {
        this.examRepo = examRepo;
        this.appRepo = appRepo;
        this.examValidator = examValidator;
        this.auditService = auditService;
    }
    async createTemplate(payload) {
        const template = new ExamTemplate_1.ExamTemplate(crypto.randomUUID(), payload.name, payload.grade, payload.duration, payload.total_marks, payload.passing_marks, new Date(), new Date());
        await this.examRepo.saveTemplate(template);
        return template;
    }
    async scheduleExam(schoolId, academicYearId, templateId, roomName, invigilatorName, examDate) {
        const schedule = new ExamSchedule_1.ExamSchedule(crypto.randomUUID(), templateId, schoolId, academicYearId, roomName, invigilatorName, examDate, 'SCHEDULED', new Date(), new Date());
        await this.examRepo.saveSchedule(schedule);
        return schedule;
    }
    async allocateCandidate(sessionId, applicationId, seatNumber, reportingTime, createdBy, correlationId) {
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
        const ticket = new HallTicket_1.HallTicket(crypto.randomUUID(), applicationId, sessionId, hallTicketNum, schedule.roomName, reportingTime, null, new Date());
        await this.examRepo.saveHallTicket(ticket);
        // Log timeline events
        await this.appRepo.logWorkflow(applicationId, 'EXAM_SCHEDULED', null, 'SUBMITTED', createdBy, `Entrance exam scheduled for room ${schedule.roomName} on ${schedule.examDate.toLocaleDateString()}. Hall Ticket generated: ${hallTicketNum}`);
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
exports.ExamService = ExamService;
