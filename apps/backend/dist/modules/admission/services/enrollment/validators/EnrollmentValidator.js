"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnrollmentValidator = void 0;
const BusinessRuleError_1 = require("../../../errors/BusinessRuleError");
class EnrollmentValidator {
    constructor(appRepo) {
        this.appRepo = appRepo;
    }
    async validate(applicationId) {
        const app = await this.appRepo.findById(applicationId);
        if (!app) {
            throw new Error(`Application with ID ${applicationId} not found`);
        }
        if (app.deletedAt) {
            throw new BusinessRuleError_1.BusinessRuleError('Application has been soft-deleted and cannot be enrolled');
        }
        const enrollableStatuses = new Set(['OFFERED', 'FEE_VERIFIED', 'FEE_PENDING', 'ENROLLED']);
        if (!enrollableStatuses.has(app.status)) {
            throw new BusinessRuleError_1.BusinessRuleError(`Application workflow status is ${app.status}. Must be approved with fees settled before enrollment.`);
        }
    }
}
exports.EnrollmentValidator = EnrollmentValidator;
