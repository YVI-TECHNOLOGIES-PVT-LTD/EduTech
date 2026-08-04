"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionAssetService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const QuestionAssetRepository_1 = require("../repositories/QuestionAssetRepository");
const QuestionValidator_1 = require("../validators/QuestionValidator");
const AuditService_1 = require("../../../admission/services/AuditService");
const event_bus_service_1 = require("../../../../workflows/event-bus.service");
class QuestionAssetService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.assetRepo = new QuestionAssetRepository_1.QuestionAssetRepository();
        this.audit = new AuditService_1.AuditService();
    }
    async uploadAsset(schoolId, userId, file, correlationId) {
        this.logInfo(`Registering asset attachment: ${file.file_name}`, correlationId);
        const validated = QuestionValidator_1.QuestionValidator.validateAsset(file);
        const asset = await this.assetRepo.registerAsset(schoolId, validated);
        await this.audit.logAudit({
            userId,
            action: 'ASSESSMENT_ASSET_UPLOAD',
            entityName: 'assessment_assets',
            entityId: asset.id,
            afterState: asset,
            correlationId
        });
        await event_bus_service_1.EventBus.publish('QuestionAssetUploaded', { assetId: asset.id, schoolId, userId });
        return asset;
    }
    async linkAsset(questionId, assetId, schoolId, userId, correlationId) {
        this.logInfo(`Linking asset: ${assetId} to question: ${questionId}`, correlationId);
        await this.assetRepo.linkAssetToQuestion(questionId, assetId);
    }
    async unlinkAsset(questionId, assetId, schoolId, userId, correlationId) {
        this.logInfo(`Unlinking asset: ${assetId} from question: ${questionId}`, correlationId);
        await this.assetRepo.unlinkAssetFromQuestion(questionId, assetId);
    }
    async getQuestionAssets(questionId, correlationId) {
        return this.assetRepo.findAssetsByQuestion(questionId);
    }
    async deleteAsset(assetId, schoolId, userId, correlationId) {
        this.logInfo(`Deleting asset registry: ${assetId}`, correlationId);
        await this.assetRepo.deleteAsset(assetId);
        await this.audit.logAudit({
            userId,
            action: 'ASSESSMENT_ASSET_DELETE',
            entityName: 'assessment_assets',
            entityId: assetId,
            afterState: { id: assetId, status: 'DELETED' },
            correlationId
        });
    }
}
exports.QuestionAssetService = QuestionAssetService;
exports.default = QuestionAssetService;
