import { Enrollment } from '../../../domain/enrollment/Enrollment';

export interface IEnrollmentRepository {
    findByApplicationId(applicationId: string): Promise<Enrollment | null>;
    save(enrollment: Enrollment): Promise<void>;
    getWorkflowRule(fromStatus: string, toStatus: string, role: string): Promise<boolean>;
    logEnrollmentAction(applicationId: string, action: string, details: string, performedBy: string | null): Promise<void>;
}
