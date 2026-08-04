"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnrollmentTimelineService = void 0;
class EnrollmentTimelineService {
    constructor(enrollRepo) {
        this.enrollRepo = enrollRepo;
    }
    async logAction(applicationId, action, details, performedBy) {
        await this.enrollRepo.logEnrollmentAction(applicationId, action, details, performedBy);
    }
}
exports.EnrollmentTimelineService = EnrollmentTimelineService;
