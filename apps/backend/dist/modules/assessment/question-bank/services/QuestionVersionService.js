"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionVersionService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const QuestionVersionRepository_1 = require("../repositories/QuestionVersionRepository");
const AuditService_1 = require("../../../admission/services/AuditService");
const event_bus_service_1 = require("../../../../workflows/event-bus.service");
class QuestionVersionService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.versionRepo = new QuestionVersionRepository_1.QuestionVersionRepository();
        this.audit = new AuditService_1.AuditService();
    }
    async getVersionsHistory(questionId, schoolId, correlationId) {
        this.logInfo(`Fetching version history timeline for question: ${questionId}`, correlationId);
        return this.versionRepo.findVersions(questionId, schoolId);
    }
    async restoreVersion(questionId, versionNumber, schoolId, userId, correlationId) {
        this.logInfo(`Restoring question: ${questionId} to past version: ${versionNumber}`, correlationId);
        const restored = await this.versionRepo.restoreVersion(questionId, versionNumber, schoolId, userId);
        await this.audit.logAudit({
            userId,
            action: 'ASSESSMENT_QUESTION_RESTORE',
            entityName: 'assessment_question_bank',
            entityId: questionId,
            afterState: restored,
            correlationId
        });
        await event_bus_service_1.EventBus.publish('QuestionVersionCreated', { questionId, version: restored.version, schoolId, userId });
        return restored;
    }
}
exports.QuestionVersionService = QuestionVersionService;
exports.default = QuestionVersionService;
