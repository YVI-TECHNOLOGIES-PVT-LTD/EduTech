"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionEngine = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const PromotionRepository_1 = require("../repositories/PromotionRepository");
class PromotionEngine extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new PromotionRepository_1.PromotionRepository();
    }
    async processStudentPromotion(studentId, academicYearId, gpa, backlogsCount, userId, correlationId) {
        this.logInfo(`Running promotion parameters checking for student: ${studentId}`, correlationId);
        let decision = 'PASS';
        let remarks = 'Promotion rules matched successfully. ';
        if (backlogsCount > 0 && backlogsCount <= 2) {
            decision = 'PROMOTED WITH BACKLOG';
            remarks += `Promoted to next grade with ${backlogsCount} backlog papers pending.`;
        }
        else if (backlogsCount > 2) {
            decision = 'REPEAT';
            remarks += `Repeat year requested due to ${backlogsCount} backlog papers.`;
        }
        else if (gpa < 5.00) {
            decision = 'COMPARTMENT';
            remarks += 'GPA falls below baseline threshold.';
        }
        return this.repo.savePromotionDecision(studentId, academicYearId, decision, remarks, userId);
    }
}
exports.PromotionEngine = PromotionEngine;
exports.default = PromotionEngine;
