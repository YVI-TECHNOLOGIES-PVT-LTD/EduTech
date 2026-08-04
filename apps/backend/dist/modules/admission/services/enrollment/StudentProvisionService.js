"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentProvisionService = void 0;
class StudentProvisionService {
    constructor(provisionRepo, atomicRepo, appRepo, auditService) {
        this.provisionRepo = provisionRepo;
        this.atomicRepo = atomicRepo;
        this.appRepo = appRepo;
        this.auditService = auditService;
    }
    /**
     * Provisions the candidate into ERP student master in one atomic database transaction.
     */
    async provisionStudent(applicationId, admissionNumber, performedBy = null, correlationId) {
        const report = await this.provisionStudentWithReport(applicationId, admissionNumber, performedBy, correlationId);
        if (!report.success || !report.studentId) {
            throw new Error(report.error ?? 'ERP student provisioning failed');
        }
        return report.studentId;
    }
    async provisionStudentWithReport(applicationId, admissionNumber, performedBy = null, correlationId) {
        const app = await this.appRepo.findById(applicationId);
        if (!app) {
            return {
                applicationId,
                admissionNumber,
                studentId: null,
                success: false,
                steps: [],
                error: `Application with ID ${applicationId} not found`,
            };
        }
        const report = await this.atomicRepo.provisionAtomic(applicationId, admissionNumber, performedBy);
        await this.auditService.logAudit({
            action: report.success ? 'ERP_STUDENT_PROVISIONED' : 'ERP_STUDENT_PROVISION_FAILED',
            entityName: 'admission_applications',
            entityId: applicationId,
            afterState: {
                studentId: report.studentId,
                admissionNumber,
                steps: report.steps,
                success: report.success,
            },
            userId: performedBy,
            correlationId,
        });
        if (!report.success) {
            const failedJobs = await this.provisionRepo.findJobsByApplicationId(applicationId);
            for (const job of failedJobs) {
                if (job.status !== 'COMPLETED') {
                    job.fail(report.error ?? 'Atomic provisioning failed');
                    await this.provisionRepo.saveJob(job);
                }
            }
        }
        return report;
    }
}
exports.StudentProvisionService = StudentProvisionService;
