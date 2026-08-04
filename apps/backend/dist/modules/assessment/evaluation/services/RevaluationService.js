"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevaluationService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const RevaluationRepository_1 = require("../repositories/RevaluationRepository");
class RevaluationService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new RevaluationRepository_1.RevaluationRepository();
    }
    async applyForRevaluation(attemptId, studentId, reason, correlationId) {
        this.logInfo(`Initiating revaluation request for attempt: ${attemptId}`, correlationId);
        return this.repo.createRequest(attemptId, studentId, reason);
    }
    async approveRevaluation(requestId, remarks, correlationId) {
        this.logInfo(`Approving revaluation request: ${requestId}`, correlationId);
        return this.repo.updateStatus(requestId, 'APPROVED', remarks);
    }
}
exports.RevaluationService = RevaluationService;
exports.default = RevaluationService;
