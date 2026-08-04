import { ADMISSION_WORKFLOW, WORKFLOW_STAGES_ORDER, type WorkflowStage } from './admissionWorkflow';

export interface SLAStatus {
    status: 'normal' | 'warning' | 'critical' | 'breached' | 'completed';
    remainingHours: number;
    totalHours: number;
    label: string;
}

export interface WorkflowContext {
    status: string;
    createdAt: string;
    submittedAt?: string | null;
    updatedAt?: string | null;
    examScore?: number | null;
    interviewRating?: string | null;
    documentsVerifiedCount?: number;
    documentsTotalCount?: number;
    paymentAmount?: number | null;
    paymentVerified?: boolean;
}

export class AdmissionWorkflowEngine {
    /**
     * Resolves the current workflow stage details based on legacy database status
     */
    public static resolveCurrentStage(legacyStatus: string): WorkflowStage {
        const cleaned = legacyStatus.toLowerCase().trim();
        
        // Find stage matching this legacy status
        const stage = Object.values(ADMISSION_WORKFLOW).find(s => 
            s.legacyStatuses.includes(cleaned)
        );
        
        // Fallback to RECEIVED / Application Received
        return stage ?? ADMISSION_WORKFLOW.RECEIVED;
    }

    /**
     * Computes the SLA metrics based on creation and submission times
     */
    public static calculateSLA(createdAt: string, legacyStatus: string, submittedAt?: string | null): SLAStatus {
        const stage = this.resolveCurrentStage(legacyStatus);
        const isDone = ['ENROLLED', 'REJECTED'].includes(stage.id);
        
        if (isDone) {
            return {
                status: 'completed',
                remainingHours: 0,
                totalHours: stage.slaHours,
                label: 'Completed',
            };
        }

        const totalHours = stage.slaHours || 48; // Default 48h SLA if not defined
        const anchorTime = new Date(submittedAt ?? createdAt).getTime();
        const now = Date.now();
        const elapsedHours = (now - anchorTime) / (1000 * 60 * 60);
        const remainingHours = Math.max(0, totalHours - elapsedHours);

        let status: SLAStatus['status'] = 'normal';
        let label = 'Within SLA';

        if (elapsedHours > totalHours) {
            status = 'breached';
            label = 'SLA Breached';
        } else if (remainingHours <= 8) {
            status = 'critical';
            label = 'Critical SLA';
        } else if (remainingHours <= 16) {
            status = 'warning';
            label = 'SLA Warning';
        }

        return {
            status,
            remainingHours: Math.round(remainingHours),
            totalHours,
            label,
        };
    }

    /**
     * Calculates candidate progress based on stage order index
     */
    public static calculateProgress(legacyStatus: string): number {
        const stage = this.resolveCurrentStage(legacyStatus);
        if (stage.id === 'REJECTED') return 0;
        if (stage.id === 'ENROLLED') return 100;
        
        const idx = WORKFLOW_STAGES_ORDER.indexOf(stage.id);
        if (idx < 0) return 10;
        
        return Math.round(((idx + 1) / WORKFLOW_STAGES_ORDER.length) * 100);
    }

    /**
     * Validates transitions and lists next allowed stages
     */
    public static getAllowedNextStages(legacyStatus: string, context?: Partial<WorkflowContext>): string[] {
        const stage = this.resolveCurrentStage(legacyStatus);
        const transitions = [...stage.allowedTransitions];

        // Conditional transition guards
        if (stage.id === 'DOCUMENT_VERIFICATION') {
            const hasUnverifiedDocs = (context?.documentsVerifiedCount ?? 0) < (context?.documentsTotalCount ?? 0);
            if (hasUnverifiedDocs) {
                // Cannot proceed past document checking if files are outstanding
                return ['REJECTED'];
            }
        }

        if (stage.id === 'FEE_VERIFICATION') {
            if (!context?.paymentVerified) {
                // Must reconcile payment before proceeding to enrollment
                return ['REJECTED'];
            }
        }

        return transitions;
    }

    /**
     * Auto-detects if optional steps (exam, interview) should be skipped
     */
    public static isStageSkipped(stageId: string, context: WorkflowContext): boolean {
        const stage = ADMISSION_WORKFLOW[stageId];
        if (!stage || !stage.isOptional) return false;

        // Skip examination if no schedule and no records exist and applicant applied for low grades
        if (stageId === 'ENTRANCE_EXAMINATION') {
            const noScore = context.examScore === undefined || context.examScore === null;
            return noScore; // If no score, it's considered skipped dynamically
        }

        if (stageId === 'INTERVIEW_PANEL') {
            const noRating = context.interviewRating === undefined || context.interviewRating === null;
            return noRating;
        }

        return false;
    }
}
