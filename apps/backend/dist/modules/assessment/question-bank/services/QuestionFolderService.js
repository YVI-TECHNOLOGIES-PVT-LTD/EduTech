"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionFolderService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const QuestionFolderRepository_1 = require("../repositories/QuestionFolderRepository");
const question_repository_1 = require("../repositories/question.repository");
const QuestionValidator_1 = require("../validators/QuestionValidator");
const AuditService_1 = require("../../../admission/services/AuditService");
const event_bus_service_1 = require("../../../../workflows/event-bus.service");
const NotFoundError_1 = require("../../../admission/errors/NotFoundError");
const supabase_1 = require("../../../../config/supabase");
class QuestionFolderService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.folderRepo = new QuestionFolderRepository_1.QuestionFolderRepository();
        this.questionRepo = new question_repository_1.QuestionRepository();
        this.audit = new AuditService_1.AuditService();
    }
    async getFolders(schoolId, correlationId) {
        return this.folderRepo.findBySchool(schoolId);
    }
    async getFolderById(id, schoolId, correlationId) {
        const folder = await this.folderRepo.findById(id, schoolId);
        if (!folder) {
            throw new NotFoundError_1.NotFoundError(`Folder not found with ID: ${id}`);
        }
        return folder;
    }
    async createFolder(schoolId, userId, payload, correlationId) {
        const validated = QuestionValidator_1.QuestionValidator.validateFolder(payload);
        const created = await this.folderRepo.create(schoolId, validated);
        await this.audit.logAudit({
            userId,
            action: 'ASSESSMENT_FOLDER_CREATE',
            entityName: 'assessment_folders',
            entityId: created.id,
            afterState: created,
            correlationId
        });
        await event_bus_service_1.EventBus.publish('FolderCreated', { folderId: created.id, schoolId, userId });
        return created;
    }
    async updateFolder(id, schoolId, userId, payload, correlationId) {
        await this.getFolderById(id, schoolId, correlationId);
        const validated = QuestionValidator_1.QuestionValidator.validateFolder(payload);
        const beforeState = await this.folderRepo.findById(id, schoolId);
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
        const beforeState = await this.getFolderById(id, schoolId, correlationId);
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
    async bulkMoveQuestions(schoolId, userId, payload, correlationId) {
        const validated = QuestionValidator_1.QuestionValidator.validateBulkMove(payload);
        this.logInfo(`Bulk moving questions: [${validated.questionIds.join(', ')}] to folder: ${validated.targetFolderId}`, correlationId);
        if (validated.targetFolderId) {
            await this.getFolderById(validated.targetFolderId, schoolId, correlationId);
        }
        const { error } = await supabase_1.supabase
            .from('assessment_question_bank')
            .update({ folder_id: validated.targetFolderId, updated_at: new Date().toISOString() })
            .in('id', validated.questionIds)
            .eq('school_id', schoolId);
        if (error)
            throw error;
        await this.audit.logAudit({
            userId,
            action: 'ASSESSMENT_QUESTIONS_BULK_MOVE',
            entityName: 'assessment_question_bank',
            entityId: schoolId,
            afterState: { questionIds: validated.questionIds, targetFolderId: validated.targetFolderId },
            correlationId
        });
        for (const qId of validated.questionIds) {
            await event_bus_service_1.EventBus.publish('QuestionMoved', { questionId: qId, targetFolderId: validated.targetFolderId, schoolId, userId });
        }
    }
    async bulkCopyQuestions(schoolId, userId, payload, correlationId) {
        const validated = QuestionValidator_1.QuestionValidator.validateBulkCopy(payload);
        this.logInfo(`Bulk copying questions: [${validated.questionIds.join(', ')}] to folder: ${validated.targetFolderId}`, correlationId);
        if (validated.targetFolderId) {
            await this.getFolderById(validated.targetFolderId, schoolId, correlationId);
        }
        for (const qId of validated.questionIds) {
            const original = await this.questionRepo.findQuestionById(qId, schoolId);
            if (!original)
                continue;
            const copyPayload = {
                ...original,
                id: undefined,
                folder_id: validated.targetFolderId,
                version: 1,
                status: 'DRAFT',
                created_at: undefined,
                updated_at: undefined,
                is_deleted: false,
                options: original.options?.map((o) => ({
                    option_text: o.option_text,
                    is_correct: o.is_correct
                })) || []
            };
            const copied = await this.questionRepo.createQuestion(schoolId, copyPayload);
            await event_bus_service_1.EventBus.publish('QuestionCreated', { questionId: copied.id, schoolId, userId });
        }
    }
    async getStatistics(schoolId, correlationId) {
        const data = await this.folderRepo.getFolderStats(schoolId);
        // Summarize stats
        const total = data.length;
        const draft = data.filter(q => q.status === 'DRAFT').length;
        const underReview = data.filter(q => q.status === 'UNDER_REVIEW').length;
        const approved = data.filter(q => q.status === 'APPROVED').length;
        const published = data.filter(q => q.status === 'PUBLISHED').length;
        const archived = data.filter(q => q.status === 'ARCHIVED').length;
        const difficulty = {
            EASY: data.filter(q => q.difficulty === 'EASY').length,
            MEDIUM: data.filter(q => q.difficulty === 'MEDIUM').length,
            HARD: data.filter(q => q.difficulty === 'HARD').length,
        };
        return {
            totalQuestions: total,
            statusCounts: {
                DRAFT: draft,
                UNDER_REVIEW: underReview,
                APPROVED: approved,
                PUBLISHED: published,
                ARCHIVED: archived
            },
            difficultyDistribution: difficulty
        };
    }
}
exports.QuestionFolderService = QuestionFolderService;
exports.default = QuestionFolderService;
