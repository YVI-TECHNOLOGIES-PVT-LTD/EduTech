"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceReportService = void 0;
class AttendanceReportService {
    constructor(reportRepo) {
        this.reportRepo = reportRepo;
    }
    async generateReport(schoolId, academicYearId, reportType, parameters, userId) {
        const fileUrl = `https://school-erp-storage.co/reports/attendance-${reportType.toLowerCase()}-${Date.now()}.pdf`;
        await this.reportRepo.saveReport({
            id: crypto.randomUUID(),
            school_id: schoolId,
            academic_year_id: academicYearId,
            report_type: reportType,
            parameters,
            file_url: fileUrl,
            generated_by: userId
        });
        return fileUrl;
    }
}
exports.AttendanceReportService = AttendanceReportService;
