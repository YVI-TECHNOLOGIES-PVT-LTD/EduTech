import { supabase } from '../../../../config/supabase';
import type { StudentProvisionReport } from '../../services/enrollment/StudentProvisionService';

export class AtomicProvisionRepository {
    public async provisionAtomic(
        applicationId: string,
        admissionNumber: string,
        performedBy: string | null
    ): Promise<StudentProvisionReport> {
        const { data, error } = await supabase.rpc('fn_provision_admission_student', {
            p_application_id: applicationId,
            p_admission_number: admissionNumber,
            p_performed_by: performedBy,
        });

        if (error) {
            return {
                applicationId,
                admissionNumber,
                studentId: null,
                success: false,
                steps: [],
                error: error.message,
            };
        }

        const result = data as {
            success?: boolean;
            studentId?: string;
            steps?: Array<{ stepName: string; status: string; message?: string }>;
            error?: string;
        };

        return {
            applicationId,
            admissionNumber,
            studentId: result.studentId ?? null,
            success: !!result.success,
            steps: (result.steps ?? []).map(s => ({
                stepName: s.stepName,
                status: s.status as 'COMPLETED' | 'FAILED' | 'SKIPPED',
                message: s.message,
            })),
            error: result.error,
        };
    }
}
