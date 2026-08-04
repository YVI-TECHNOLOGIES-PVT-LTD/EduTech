"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationProgressService = void 0;
const BaseService_1 = require("../BaseService");
const NotFoundError_1 = require("../../errors/NotFoundError");
const PIPELINE_STATUS_WEIGHT = {
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
class ApplicationProgressService extends BaseService_1.BaseService {
    constructor(appRepo, docRepo, checklistRepo, docTypeRepo, interviewRepo, examRepo, feeRepo, paymentRepo) {
        super();
        this.appRepo = appRepo;
        this.docRepo = docRepo;
        this.checklistRepo = checklistRepo;
        this.docTypeRepo = docTypeRepo;
        this.interviewRepo = interviewRepo;
        this.examRepo = examRepo;
        this.feeRepo = feeRepo;
        this.paymentRepo = paymentRepo;
    }
    async getProgress(applicationId) {
        const application = await this.appRepo.findById(applicationId);
        if (!application) {
            throw new NotFoundError_1.NotFoundError(`Application with ID ${applicationId} not found`);
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
        const documentItems = [];
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
        }
        else {
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
        let documentsStatus = 'pending';
        if (mandatoryTotal > 0 && mandatoryVerified === mandatoryTotal)
            documentsStatus = 'approved';
        else if (documentItems.some(d => d.uploaded))
            documentsStatus = 'in_progress';
        let examStatus = 'pending';
        if (examResults.length > 0) {
            const passed = examResults.some((r) => r.pass === true);
            const failed = examResults.some((r) => r.pass === false);
            examStatus = passed ? 'completed' : failed ? 'failed' : 'in_progress';
        }
        let interviewStatus = 'pending';
        if (interview) {
            const st = String(interview.status ?? '').toUpperCase();
            if (['EVALUATED', 'COMPLETED'].includes(st))
                interviewStatus = 'completed';
            else if (st === 'CANCELLED')
                interviewStatus = 'rejected';
            else if (st === 'SCHEDULED' || st === 'RESCHEDULED')
                interviewStatus = 'in_progress';
        }
        let feesStatus = 'pending';
        const completedPayments = payments.filter((p) => p.status === 'COMPLETED');
        if (completedPayments.length > 0)
            feesStatus = 'completed';
        else if (feeAssignments.length > 0)
            feesStatus = 'in_progress';
        let verificationStatus = 'pending';
        const appStatus = application.status.toUpperCase();
        if (['DOCUMENT_VERIFIED', 'EXAM', 'INTERVIEW', 'MERIT', 'OFFERED', 'FEE_PENDING', 'FEE_VERIFIED', 'ENROLLED'].includes(appStatus)) {
            verificationStatus = 'approved';
        }
        else if (documentsStatus === 'approved') {
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
exports.ApplicationProgressService = ApplicationProgressService;
