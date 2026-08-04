import { Enrollment } from '../../domain/enrollment/Enrollment';
import { supabase } from '../../../../config/supabase';

export class EnrollmentRepository {
    public async findByApplicationId(applicationId: string): Promise<Enrollment | null> {
        // Since the prompt states ENROLLED is mapped to status_history or confirmations,
        // we can store enrollment records in a logs table or standard select.
        // For compliance, we fetch from our confirmation table if student_id is set
        const { data, error } = await supabase
            .from('admission_confirmation')
            .select('*')
            .eq('application_id', applicationId)
            .not('student_id', 'is', null)
            .maybeSingle();

        if (error) throw error;
        return data ? new Enrollment(
            data.id,
            data.application_id,
            data.student_id!,
            data.admission_number,
            new Date(data.confirmed_at),
            data.confirmed_by
        ) : null;
    }

    public async save(enrollment: Enrollment): Promise<void> {
        // Links student in admission_confirmation
        const { error } = await supabase
            .from('admission_confirmation')
            .update({
                student_id: enrollment.studentId
            })
            .eq('application_id', enrollment.applicationId);

        if (error) throw error;
    }

    public async getWorkflowRule(fromStatus: string, toStatus: string, role: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('enrollment_workflow_rules')
            .select('allowed')
            .eq('from_status', fromStatus)
            .eq('to_status', toStatus)
            .eq('role', role)
            .maybeSingle();

        if (error) throw error;
        return data ? data.allowed : false;
    }

    public async logEnrollmentAction(
        applicationId: string,
        action: string,
        details: string,
        performedBy: string | null
    ): Promise<void> {
        const { error } = await supabase
            .from('admission_enrollment_logs')
            .insert({
                application_id: applicationId,
                action,
                details,
                performed_by: performedBy
            });

        if (error) throw error;
    }
}
