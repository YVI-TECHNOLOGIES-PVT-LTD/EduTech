"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendancePolicyEngine = void 0;
const BaseService_1 = require("../../admission/services/BaseService");
const AttendancePolicyRepository_1 = require("../repositories/AttendancePolicyRepository");
class AttendancePolicyEngine extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new AttendancePolicyRepository_1.AttendancePolicyRepository();
    }
    async evaluatePolicyRules(schoolId, attendancePct, correlationId) {
        this.logInfo(`Running attendance policy verification checks against threshold rules`, correlationId);
        const policy = await this.repo.getPolicy(schoolId);
        const minAllowed = policy ? Number(policy.minimum_percentage) : 75.00;
        return attendancePct >= minAllowed;
    }
}
exports.AttendancePolicyEngine = AttendancePolicyEngine;
exports.default = AttendancePolicyEngine;
