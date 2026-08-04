import { StudentProvision, ProvisionStatus } from '../../domain/enrollment/StudentProvision';
import { supabase } from '../../../../config/supabase';

export class StudentProvisionRepository {
    public async saveJob(job: StudentProvision): Promise<void> {
        const { error } = await supabase
            .from('student_provisioning_jobs')
            .upsert({
                id: job.id,
                application_id: job.applicationId,
                step_name: job.stepName,
                status: job.status,
                error_message: job.errorMessage,
                updated_at: job.updatedAt.toISOString()
            });

        if (error) throw error;
    }

    public async findJobsByApplicationId(applicationId: string): Promise<StudentProvision[]> {
        const { data, error } = await supabase
            .from('student_provisioning_jobs')
            .select('*')
            .eq('application_id', applicationId);

        if (error) throw error;
        return (data || []).map(row => new StudentProvision(
            row.id,
            row.application_id,
            row.step_name,
            row.status as ProvisionStatus,
            row.error_message,
            new Date(row.created_at),
            new Date(row.updated_at)
        ));
    }
}
