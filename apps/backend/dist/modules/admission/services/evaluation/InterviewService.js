"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewService = void 0;
const Interview_1 = require("../../domain/evaluation/Interview");
class InterviewService {
    constructor(interviewRepo, appRepo, interviewValidator, auditService, workflowOrchestrator) {
        this.interviewRepo = interviewRepo;
        this.appRepo = appRepo;
        this.interviewValidator = interviewValidator;
        this.auditService = auditService;
        this.workflowOrchestrator = workflowOrchestrator;
    }
    async scheduleInterview(applicationId, panelId, interviewDate, roomName, createdBy, correlationId) {
        // Assert candidate passed baseline and exam eligibility checks
        await this.interviewValidator.validate(applicationId);
        const panel = await this.interviewRepo.findPanelById(panelId);
        if (!panel) {
            throw new Error(`Interview Panel with ID ${panelId} not found`);
        }
        const interview = new Interview_1.Interview(crypto.randomUUID(), applicationId, panelId, interviewDate, roomName, 'SCHEDULED', null, new Date(), new Date());
        await this.interviewRepo.save(interview);
        // Timeline log
        await this.appRepo.logWorkflow(applicationId, 'INTERVIEW_SCHEDULED', null, 'SUBMITTED', createdBy, `Interview panel [${panel.panel_name}] scheduled in room ${roomName} on ${interviewDate.toLocaleDateString()}.`);
        // Audit Trail log
        await this.auditService.logAudit({
            action: 'INTERVIEW_SCHEDULED',
            entityName: 'admission_interviews',
            entityId: interview.id,
            afterState: { panelId, roomName, date: interviewDate.toISOString() },
            userId: createdBy,
            correlationId
        });
        if (this.workflowOrchestrator) {
            const application = await this.appRepo.findById(applicationId);
            const ctx = {
                userId: createdBy,
                role: 'EXAM_CELL',
                correlationId,
                notes: `Interview scheduled in ${roomName}`,
                schoolId: application?.schoolId,
                academicYearId: application?.academicYearId,
            };
            await this.workflowOrchestrator.publish('INTERVIEW_CREATED', applicationId, ctx);
        }
        return interview;
    }
}
exports.InterviewService = InterviewService;
