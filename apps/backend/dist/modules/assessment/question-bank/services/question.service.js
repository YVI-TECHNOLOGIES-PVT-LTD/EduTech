"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const question_repository_1 = require("../repositories/question.repository");
const QuestionOptionRepository_1 = require("../repositories/QuestionOptionRepository");
const QuestionFolderRepository_1 = require("../repositories/QuestionFolderRepository");
const QuestionValidator_1 = require("../validators/QuestionValidator");
const AuditService_1 = require("../../../admission/services/AuditService");
const event_bus_service_1 = require("../../../../workflows/event-bus.service");
const NotFoundError_1 = require("../../../admission/errors/NotFoundError");
class QuestionService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new question_repository_1.QuestionRepository();
        this.optionRepo = new QuestionOptionRepository_1.QuestionOptionRepository();
        this.folderRepo = new QuestionFolderRepository_1.QuestionFolderRepository();
        this.audit = new AuditService_1.AuditService();
    }
    // ==========================================
    // FOLDERS DELEGATION
    // ==========================================
    async listFolders(schoolId, correlationId) {
        return this.folderRepo.findBySchool(schoolId);
    }
    async createFolder(schoolId, userId, payload, correlationId) {
        const validated = QuestionValidator_1.QuestionValidator.validateFolder(payload);
        const folder = await this.folderRepo.create(schoolId, validated);
        await this.audit.logAudit({
            userId,
            action: 'ASSESSMENT_FOLDER_CREATE',
            entityName: 'assessment_folders',
            entityId: folder.id,
            afterState: folder,
            correlationId
        });
        await event_bus_service_1.EventBus.publish('FolderCreated', { folderId: folder.id, schoolId, userId });
        return folder;
    }
    async updateFolder(id, schoolId, userId, payload, correlationId) {
        const validated = QuestionValidator_1.QuestionValidator.validateFolder(payload);
        const beforeState = await this.folderRepo.findById(id, schoolId);
        if (!beforeState)
            throw new NotFoundError_1.NotFoundError(`Folder not found with ID: ${id}`);
        const updated = await this.folderRepo.update(id, schoolId, validated);
        await this.audit.logAudit({
            userId,
            action: 'ASSESSMENT_FOLDER_UPDATE',
            entityName: 'assessment_folders',
            entityId: id,
            beforeState,
            afterState: updated,
            correlationId
        });
        return updated;
    }
    async deleteFolder(id, schoolId, userId, correlationId) {
        const beforeState = await this.folderRepo.findById(id, schoolId);
        if (!beforeState)
            throw new NotFoundError_1.NotFoundError(`Folder not found with ID: ${id}`);
        await this.folderRepo.softDelete(id, schoolId, userId);
        await this.audit.logAudit({
            userId,
            action: 'ASSESSMENT_FOLDER_DELETE',
            entityName: 'assessment_folders',
            entityId: id,
            beforeState,
            afterState: { ...beforeState, is_deleted: true },
            correlationId
        });
    }
    // ==========================================
    // QUESTIONS CRUD
    // ==========================================
    async listQuestions(schoolId, filters, correlationId) {
        return this.repo.listQuestions(schoolId, filters);
    }
    async getQuestionById(id, schoolId, correlationId) {
        const question = await this.repo.findQuestionById(id, schoolId);
        if (!question)
            throw new NotFoundError_1.NotFoundError(`Question not found with ID: ${id}`);
        return question;
    }
    async createQuestion(schoolId, userId, payload, correlationId) {
        const validated = QuestionValidator_1.QuestionValidator.validateCreate(payload);
        // Deduplication warning check
        const isDuplicate = await this.repo.duplicateCheck(schoolId, validated.subject_id, validated.question_text);
        if (isDuplicate) {
            this.logInfo(`Duplicate warning: matching question found for subject: ${validated.subject_id}`, correlationId);
        }
        const question = await this.repo.createQuestion(schoolId, {
            ...validated,
            version: 1,
            status: 'DRAFT',
            created_by: userId
        });
        await this.audit.logAudit({
            userId,
            action: 'ASSESSMENT_QUESTION_CREATE',
            entityName: 'assessment_question_bank',
            entityId: question.id,
            afterState: question,
            correlationId
        });
        await event_bus_service_1.EventBus.publish('QuestionCreated', { questionId: question.id, schoolId, userId });
        return question;
    }
    async updateQuestion(id, schoolId, userId, payload, correlationId) {
        const validated = QuestionValidator_1.QuestionValidator.validateUpdate(payload);
        const current = await this.getQuestionById(id, schoolId, correlationId);
        // Fork if approved or published
        if (current.status === 'APPROVED' || current.status === 'PUBLISHED') {
            this.logInfo(`Forking new draft version for question: ${id}`, correlationId);
            const forkedPayload = {
                ...current,
                ...validated,
                version: current.version + 1,
                status: 'DRAFT',
                parent_id: current.parent_id || current.id,
                options: validated.options || current.options
            };
            delete forkedPayload.id;
            delete forkedPayload.created_at;
            delete forkedPayload.updated_at;
            const forked = await this.repo.createQuestion(schoolId, forkedPayload);
            await this.audit.logAudit({
                userId,
                action: 'ASSESSMENT_QUESTION_FORK',
                entityName: 'assessment_question_bank',
                entityId: forked.id,
                beforeState: current,
                afterState: forked,
                correlationId
            });
            await event_bus_service_1.EventBus.publish('QuestionVersionCreated', { questionId: forked.id, version: forked.version, schoolId, userId });
            return forked;
        }
        // Standard update
        const updated = await this.repo.updateQuestion(id, schoolId, validated);
        await this.audit.logAudit({
            userId,
            action: 'ASSESSMENT_QUESTION_UPDATE',
            entityName: 'assessment_question_bank',
            entityId: id,
            beforeState: current,
            afterState: updated,
            correlationId
        });
        await event_bus_service_1.EventBus.publish('QuestionUpdated', { questionId: id, schoolId, userId });
        return updated;
    }
    async deleteQuestion(id, schoolId, userId, correlationId) {
        const beforeState = await this.getQuestionById(id, schoolId, correlationId);
        await this.repo.deleteQuestion(id, schoolId, userId);
        await this.audit.logAudit({
            userId,
            action: 'ASSESSMENT_QUESTION_DELETE',
            entityName: 'assessment_question_bank',
            entityId: id,
            beforeState,
            afterState: { ...beforeState, is_deleted: true },
            correlationId
        });
        await event_bus_service_1.EventBus.publish('QuestionDeleted', { questionId: id, schoolId, userId });
    }
}
exports.QuestionService = QuestionService;
exports.default = QuestionService;
