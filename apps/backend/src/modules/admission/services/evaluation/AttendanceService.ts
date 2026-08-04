import { ExamRepository } from '../../repositories/evaluation/ExamRepository';
import { ApplicationRepository } from '../../repositories/application/ApplicationRepository';
import { AuditService } from '../AuditService';

export class AttendanceService {
    constructor(
        private readonly examRepo: ExamRepository,
        private readonly appRepo: ApplicationRepository,
        private readonly auditService: AuditService
    ) {}

    public async recordAttendance(
        sessionId: string,
        applicationId: string,
        status: 'PRESENT' | 'ABSENT' | 'LATE',
        remarks: string | null,
        performedBy: string | null,
        correlationId?: string
    ): Promise<void> {
        const candidate = await this.examRepo.findCandidate(sessionId, applicationId);
        if (!candidate) {
            throw new Error(`Candidate allocation not found for session ${sessionId} and application ${applicationId}`);
        }

        candidate.attendance_status = status;
        candidate.remarks = remarks || null;
        await this.examRepo.saveCandidate(candidate);

        // Timeline entry
        const timelineEvent = status === 'PRESENT' || status === 'LATE' ? 'EXAM_ATTENDED' : 'EXAM_ABSENT';
        await this.appRepo.logWorkflow(
            applicationId,
            timelineEvent,
            null,
            'SUBMITTED',
            performedBy,
            `Candidate marked ${status} for entrance exam. Remarks: ${remarks || 'None'}`
        );

        // Audit Trail log
        await this.auditService.logAudit({
            action: `EXAM_ATTENDANCE_RECORDED_${status}`,
            entityName: 'admission_exam_session_candidates',
            entityId: candidate.id,
            afterState: { attendance: status, remarks },
            userId: performedBy,
            correlationId
        });
    }
}
