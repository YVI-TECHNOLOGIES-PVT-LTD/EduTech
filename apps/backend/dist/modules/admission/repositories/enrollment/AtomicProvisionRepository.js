"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AtomicProvisionRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
class AtomicProvisionRepository {
    async provisionAtomic(applicationId, admissionNumber, performedBy) {
        const { data, error } = await supabase_1.supabase.rpc('fn_provision_admission_student', {
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
        const result = data;
        return {
            applicationId,
            admissionNumber,
            studentId: result.studentId ?? null,
            success: !!result.success,
            steps: (result.steps ?? []).map(s => ({
                stepName: s.stepName,
                status: s.status,
                message: s.message,
            })),
            error: result.error,
        };
    }
}
exports.AtomicProvisionRepository = AtomicProvisionRepository;
