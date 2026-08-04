"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationService = void 0;
class EvaluationService {
    constructor(evalRepo) {
        this.evalRepo = evalRepo;
    }
    async getSummary(applicationId) {
        return this.evalRepo.getEvaluationSummary(applicationId);
    }
}
exports.EvaluationService = EvaluationService;
