import { ReportRepository } from '../../repositories/attendance/ReportRepository';

export class AttendanceReportService {
    constructor(private readonly reportRepo: ReportRepository) {}

    public async generateReport(
        schoolId: string,
        academicYearId: string,
        reportType: string,
        parameters: any,
        userId: string | null
    ): Promise<string> {
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
