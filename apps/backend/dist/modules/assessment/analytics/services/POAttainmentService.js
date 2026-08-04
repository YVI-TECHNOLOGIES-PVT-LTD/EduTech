"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POAttainmentService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const POAttainmentRepository_1 = require("../repositories/POAttainmentRepository");
class POAttainmentService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new POAttainmentRepository_1.POAttainmentRepository();
    }
    async calculatePoAttainment(schoolId, poCode, correlationId) {
        this.logInfo(`Calculating Program Outcome attainment compliance for ${poCode}`, correlationId);
        return this.repo.savePoAttainment(schoolId, {
            po_code: poCode,
            attainment_score: 2.65,
            target_score: 3.00
        });
    }
}
exports.POAttainmentService = POAttainmentService;
exports.default = POAttainmentService;
