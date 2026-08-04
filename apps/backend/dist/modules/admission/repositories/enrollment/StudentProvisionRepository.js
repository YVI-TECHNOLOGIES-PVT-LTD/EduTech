"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentProvisionRepository = void 0;
const StudentProvision_1 = require("../../domain/enrollment/StudentProvision");
const supabase_1 = require("../../../../config/supabase");
class StudentProvisionRepository {
    async saveJob(job) {
        const { error } = await supabase_1.supabase
            .from('student_provisioning_jobs')
            .upsert({
            id: job.id,
            application_id: job.applicationId,
            step_name: job.stepName,
            status: job.status,
            error_message: job.errorMessage,
            updated_at: job.updatedAt.toISOString()
        });
        if (error)
            throw error;
    }
    async findJobsByApplicationId(applicationId) {
        const { data, error } = await supabase_1.supabase
            .from('student_provisioning_jobs')
            .select('*')
            .eq('application_id', applicationId);
        if (error)
            throw error;
        return (data || []).map(row => new StudentProvision_1.StudentProvision(row.id, row.application_id, row.step_name, row.status, row.error_message, new Date(row.created_at), new Date(row.updated_at)));
    }
}
exports.StudentProvisionRepository = StudentProvisionRepository;
