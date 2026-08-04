import { BaseService } from '../BaseService';
import { ApplicationRepository } from '../../repositories/application/ApplicationRepository';
import { DocumentRepository } from '../../repositories/application/DocumentRepository';
import { DocumentChecklistRepository } from '../../repositories/application/DocumentChecklistRepository';
import { DocumentTypeRepository } from '../../repositories/application/DocumentTypeRepository';
import { InterviewRepository } from '../../repositories/evaluation/InterviewRepository';
import { ExamRepository } from '../../repositories/evaluation/ExamRepository';
import { FeeRepository } from '../../repositories/enrollment/FeeRepository';
import { PaymentRepository } from '../../repositories/enrollment/PaymentRepository';
import { NotFoundError } from '../../errors/NotFoundError';

export type ProgressSectionStatus = 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected' | 'failed';

export interface DocumentProgressItem {
    code: string;
    name: string;
    mandatory: boolean;
    uploaded: boolean;
    verified: boolean;
    status: string;
    documentId?: string;
}

export interface ApplicationProgressReport {
    applicationId: string;
    applicationStatus: string;
    progressPercent: number;
    checklistCompletionPercent: number;
    sections: {
        documents: { label: string; completed: number; total: number; status: ProgressSectionStatus; percent: number };
        interview: { label: string; status: ProgressSectionStatus };
        exam: { label: string; status: ProgressSectionStatus };
        fees: { label: string; status: ProgressSectionStatus };
        verification: { label: string; status: ProgressSectionStatus };
    };
    documentItems: DocumentProgressItem[];
}

const PIPELINE_STATUS_WEIGHT: Record<string, number> = {
    DRAFT: 5,
    IN_PROGRESS: 15,
    CORRECTION_REQUIRED: 15,
    SUBMITTED: 25,
    UNDER_REVIEW: 30,
    DOCS_PENDING: 35,
    DOCUMENT_VERIFIED: 45,
    EXAM: 55,
    INTERVIEW: 65,
    MERIT: 72,
    OFFERED: 78,
    FEE_PENDING: 85,
    FEE_VERIFIED: 92,
    ENROLLED: 100,
};

export class ApplicationProgressService extends BaseService {
    constructor(
        private readonly appRepo: ApplicationRepository,
        private readonly docRepo: DocumentRepository,
        private readonly checklistRepo: DocumentChecklistRepository,
        private readonly docTypeRepo: DocumentTypeRepository,
        private readonly interviewRepo: InterviewRepository,
        private readonly examRepo: ExamRepository,
        private readonly feeRepo: FeeRepository,
        private readonly paymentRepo: PaymentRepository
    ) {
        super();
    }

    public async getProgress(applicationId: string): Promise<ApplicationProgressReport> {
        const application = await this.appRepo.findById(applicationId);
        if (!application) {
            throw new NotFoundError(`Application with ID ${applicationId} not found`);
        }

        const grade = await this.appRepo.getGradeForApplication(applicationId);

        const [checklistRules, uploadedDocs, interview, examCandidate, feeAssignments, payments] = await Promise.all([
            this.checklistRepo.findByGrade(application.schoolId, application.academicYearId, grade),
            this.docRepo.findByApplicationId(applicationId),
            this.interviewRepo.findByApplicationId(applicationId).catch(() => null),
            this.examRepo.findCandidateByApplicationId(applicationId).catch(() => null),
            this.feeRepo.findAssignmentsByApplicationId(applicationId).catch(() => []),
            this.paymentRepo.findPaymentsByApplicationId(applicationId).catch(() => []),
        ]);

        const examResults = examCandidate
            ? await this.examRepo.findResultsByCandidateId(examCandidate.id).catch(() => [])
            : [];

        const docsByTypeId = new Map(uploadedDocs.map(d => [d.documentTypeId, d]));
        const documentItems: DocumentProgressItem[] = [];

        if (checklistRules.length === 0) {
            for (const doc of uploadedDocs) {
                const type = await this.docTypeRepo.findById(doc.documentTypeId);
                documentItems.push({
                    code: type?.code ?? 'unknown',
                    name: type?.name ?? 'Document',
                    mandatory: false,
                    uploaded: true,
                    verified: doc.status === 'VERIFIED',
                    status: doc.status,
                    documentId: doc.id,
                });
            }
        } else {
            for (const rule of checklistRules) {
                const type = await this.docTypeRepo.findById(rule.documentTypeId);
                const doc = docsByTypeId.get(rule.documentTypeId);
                documentItems.push({
                    code: type?.code ?? rule.documentTypeId,
                    name: type?.name ?? 'Document',
                    mandatory: rule.mandatory,
                    uploaded: !!doc,
                    verified: doc?.status === 'VERIFIED',
                    status: doc?.status ?? 'MISSING',
                    documentId: doc?.id,
                });
            }
        }

        const mandatoryItems = documentItems.filter(d => d.mandatory);
        const mandatoryTotal = mandatoryItems.length || documentItems.length;
        const mandatoryVerified = mandatoryItems.filter(d => d.verified).length
            || documentItems.filter(d => d.verified).length;
        const docsPercent = mandatoryTotal > 0 ? Math.round((mandatoryVerified / mandatoryTotal) * 100) : 0;

        let documentsStatus: ProgressSectionStatus = 'pending';
        if (mandatoryTotal > 0 && mandatoryVerified === mandatoryTotal) documentsStatus = 'approved';
        else if (documentItems.some(d => d.uploaded)) documentsStatus = 'in_progress';

        let examStatus: ProgressSectionStatus = 'pending';
        if (examResults.length > 0) {
            const passed = examResults.some((r: { pass?: boolean }) => r.pass === true);
            const failed = examResults.some((r: { pass?: boolean }) => r.pass === false);
            examStatus = passed ? 'completed' : failed ? 'failed' : 'in_progress';
        }

        let interviewStatus: ProgressSectionStatus = 'pending';
        if (interview) {
            const st = String(interview.status ?? '').toUpperCase();
            if (['EVALUATED', 'COMPLETED'].includes(st)) interviewStatus = 'completed';
            else if (st === 'CANCELLED') interviewStatus = 'rejected';
            else if (st === 'SCHEDULED' || st === 'RESCHEDULED') interviewStatus = 'in_progress';
        }

        let feesStatus: ProgressSectionStatus = 'pending';
        const completedPayments = payments.filter((p: { status?: string }) => p.status === 'COMPLETED');
        if (completedPayments.length > 0) feesStatus = 'completed';
        else if (feeAssignments.length > 0) feesStatus = 'in_progress';

        let verificationStatus: ProgressSectionStatus = 'pending';
        const appStatus = application.status.toUpperCase();
        if (['DOCUMENT_VERIFIED', 'EXAM', 'INTERVIEW', 'MERIT', 'OFFERED', 'FEE_PENDING', 'FEE_VERIFIED', 'ENROLLED'].includes(appStatus)) {
            verificationStatus = 'approved';
        } else if (documentsStatus === 'approved') {
            verificationStatus = 'in_progress';
        }

        const checklistCompletionPercent = docsPercent;
        const pipelinePercent = PIPELINE_STATUS_WEIGHT[appStatus] ?? Math.min(docsPercent, 30);
        const sectionScores = [
            docsPercent,
            examStatus === 'completed' ? 100 : examStatus === 'in_progress' ? 50 : 0,
            interviewStatus === 'completed' ? 100 : interviewStatus === 'in_progress' ? 50 : 0,
            feesStatus === 'completed' ? 100 : feesStatus === 'in_progress' ? 50 : 0,
            verificationStatus === 'approved' ? 100 : verificationStatus === 'in_progress' ? 50 : 0,
        ];
        const checklistAvg = Math.round(sectionScores.reduce((a, b) => a + b, 0) / sectionScores.length);
        const progressPercent = Math.max(pipelinePercent, checklistAvg);

        return {
            applicationId,
            applicationStatus: application.status,
            progressPercent,
            checklistCompletionPercent,
            sections: {
                documents: {
                    label: 'Documents',
                    completed: mandatoryVerified,
                    total: mandatoryTotal,
                    status: documentsStatus,
                    percent: docsPercent,
                },
                interview: { label: 'Interview', status: interviewStatus },
                exam: { label: 'Exam', status: examStatus },
                fees: { label: 'Fees', status: feesStatus },
                verification: { label: 'Verification', status: verificationStatus },
            },
            documentItems,
        };
    }
}
