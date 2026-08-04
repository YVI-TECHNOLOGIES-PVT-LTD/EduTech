"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnrollmentRepository = void 0;
const Enrollment_1 = require("../../domain/enrollment/Enrollment");
const supabase_1 = require("../../../../config/supabase");
class EnrollmentRepository {
    async findByApplicationId(applicationId) {
        // Since the prompt states ENROLLED is mapped to status_history or confirmations,
        // we can store enrollment records in a logs table or standard select.
        // For compliance, we fetch from our confirmation table if student_id is set
        const { data, error } = await supabase_1.supabase
            .from('admission_confirmation')
            .select('*')
            .eq('application_id', applicationId)
            .not('student_id', 'is', null)
            .maybeSingle();
        if (error)
            throw error;
        return data ? new Enrollment_1.Enrollment(data.id, data.application_id, data.student_id, data.admission_number, new Date(data.confirmed_at), data.confirmed_by) : null;
    }
    async save(enrollment) {
        // Links student in admission_confirmation
        const { error } = await supabase_1.supabase
            .from('admission_confirmation')
            .update({
            student_id: enrollment.studentId
        })
            .eq('application_id', enrollment.applicationId);
        if (error)
            throw error;
    }
    async getWorkflowRule(fromStatus, toStatus, role) {
        const { data, error } = await supabase_1.supabase
            .from('enrollment_workflow_rules')
            .select('allowed')
            .eq('from_status', fromStatus)
            .eq('to_status', toStatus)
            .eq('role', role)
            .maybeSingle();
        if (error)
            throw error;
        return data ? data.allowed : false;
    }
    async logEnrollmentAction(applicationId, action, details, performedBy) {
        const { error } = await supabase_1.supabase
            .from('admission_enrollment_logs')
            .insert({
            application_id: applicationId,
            action,
            details,
            performed_by: performedBy
        });
        if (error)
            throw error;
    }
}
exports.EnrollmentRepository = EnrollmentRepository;
