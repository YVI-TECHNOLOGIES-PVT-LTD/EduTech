"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceEligibilityEngine = void 0;
const BaseService_1 = require("../../admission/services/BaseService");
const AttendanceEligibilityRepository_1 = require("../repositories/AttendanceEligibilityRepository");
const AttendancePolicyEngine_1 = require("./AttendancePolicyEngine");
class AttendanceEligibilityEngine extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new AttendanceEligibilityRepository_1.AttendanceEligibilityRepository();
        this.policyEngine = new AttendancePolicyEngine_1.AttendancePolicyEngine();
    }
    async checkStudentEligibility(schoolId, studentId, subjectId, percentage, correlationId) {
        this.logInfo(`Verifying exam eligibility totals for student: ${studentId}`, correlationId);
        const isEligible = await this.policyEngine.evaluatePolicyRules(schoolId, percentage);
        return this.repo.saveEligibility(studentId, subjectId, percentage, isEligible);
    }
}
exports.AttendanceEligibilityEngine = AttendanceEligibilityEngine;
exports.default = AttendanceEligibilityEngine;
