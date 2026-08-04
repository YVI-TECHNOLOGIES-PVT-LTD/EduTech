"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceDashboardService = void 0;
class AttendanceDashboardService {
    constructor(reportRepo) {
        this.reportRepo = reportRepo;
    }
    async recordDashboardMetrics(schoolId, date, metrics) {
        await this.reportRepo.saveDashboardMetrics({
            id: crypto.randomUUID(),
            schoolId,
            date,
            ...metrics
        });
    }
}
exports.AttendanceDashboardService = AttendanceDashboardService;
