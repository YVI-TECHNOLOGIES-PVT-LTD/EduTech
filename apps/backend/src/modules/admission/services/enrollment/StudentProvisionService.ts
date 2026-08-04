import { StudentProvisionRepository } from '../../repositories/enrollment/StudentProvisionRepository';
import { AtomicProvisionRepository } from '../../repositories/enrollment/AtomicProvisionRepository';
import { ApplicationRepository } from '../../repositories/application/ApplicationRepository';
import { AuditService } from '../AuditService';

export interface ProvisionStepReport {
    stepName: string;
    status: 'COMPLETED' | 'FAILED' | 'SKIPPED';
    message?: string;
}

export interface StudentProvisionReport {
    applicationId: string;
    admissionNumber: string;
    studentId: string | null;
    success: boolean;
    steps: ProvisionStepReport[];
    error?: string;
}

export class StudentProvisionService {
    constructor(
        private readonly provisionRepo: StudentProvisionRepository,
        private readonly atomicRepo: AtomicProvisionRepository,
        private readonly appRepo: ApplicationRepository,
        private readonly auditService: AuditService
    ) {}

    /**
     * Provisions the candidate into ERP student master in one atomic database transaction.
     */
    public async provisionStudent(
        applicationId: string,
        admissionNumber: string,
        performedBy: string | null = null,
        correlationId?: string
    ): Promise<string> {
        const report = await this.provisionStudentWithReport(
            applicationId,
            admissionNumber,
            performedBy,
            correlationId
        );
        if (!report.success || !report.studentId) {
            throw new Error(report.error ?? 'ERP student provisioning failed');
        }
        return report.studentId;
    }

    public async provisionStudentWithReport(
        applicationId: string,
        admissionNumber: string,
        performedBy: string | null = null,
        correlationId?: string
    ): Promise<StudentProvisionReport> {
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

        const report = await this.atomicRepo.provisionAtomic(
            applicationId,
            admissionNumber,
            performedBy
        );

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
