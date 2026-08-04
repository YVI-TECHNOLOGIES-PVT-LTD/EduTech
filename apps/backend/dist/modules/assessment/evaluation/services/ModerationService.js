"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const ModerationRepository_1 = require("../repositories/ModerationRepository");
const EvaluationRepository_1 = require("../repositories/EvaluationRepository");
class ModerationService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new ModerationRepository_1.ModerationRepository();
        this.sessionRepo = new EvaluationRepository_1.EvaluationRepository();
    }
    async checkVarianceAndQueue(sessionId, schoolId, firstMarks, secondMarks, correlationId) {
        this.logInfo(`Checking score variance for session: ${sessionId}`, correlationId);
        const difference = Math.abs(firstMarks - secondMarks);
        const maxMarks = 100.00;
        const variancePct = (difference / maxMarks) * 100.00;
        // If variance exceeds 15%, queue for Head Examiner moderation override check
        if (variancePct > 15.00) {
            await this.repo.queueForModeration(sessionId, firstMarks, secondMarks, variancePct);
            await this.sessionRepo.updateSessionStatus(sessionId, 'UNDER_MODERATION');
        }
        else {
            // Under threshold, auto-finalize marks
            await this.sessionRepo.updateSessionStatus(sessionId, 'FINALIZED');
        }
    }
    async resolveModeration(queueId, moderatorId, moderatorMarks, status, correlationId) {
        this.logInfo(`Resolving moderation queue item: ${queueId}`, correlationId);
        const item = await this.repo.resolveModeration(queueId, moderatorId, moderatorMarks, status);
        if (status === 'RESOLVED') {
            await this.sessionRepo.updateSessionStatus(item.session_id, 'FINALIZED');
        }
        return item;
    }
}
exports.ModerationService = ModerationService;
exports.default = ModerationService;
