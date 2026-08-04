"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COAttainmentService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const COAttainmentRepository_1 = require("../repositories/COAttainmentRepository");
class COAttainmentService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new COAttainmentRepository_1.COAttainmentRepository();
    }
    async calculateCoAttainment(schoolId, subjectId, coCode, correlationId) {
        this.logInfo(`Calculating Course Outcome attainment level for ${coCode}`, correlationId);
        // Simulated compliance target rates checks
        const actualPct = 78.50;
        const status = actualPct >= 70.00 ? 'MET' : 'NOT_MET';
        return this.repo.saveCoAttainment(schoolId, {
            subject_id: subjectId,
            co_code: coCode,
            attainment_target_pct: 70.00,
            actual_attainment_pct: actualPct,
            status
        });
    }
}
exports.COAttainmentService = COAttainmentService;
exports.default = COAttainmentService;
