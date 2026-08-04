"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DegreeAuditEngine = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const supabase_1 = require("../../../../config/supabase");
class DegreeAuditEngine extends BaseService_1.BaseService {
    async auditDegreeCompletion(studentId, programId, correlationId) {
        this.logInfo(`Running Degree requirements audit for student: ${studentId}`, correlationId);
        // Fetch student's record
        const { data: record } = await supabase_1.supabase
            .from('student_academic_records')
            .select('*')
            .eq('student_id', studentId)
            .maybeSingle();
        const completedCredits = record ? Number(record.total_credits) : 0;
        const cgpa = record ? Number(record.cgpa) : 0.00;
        // Fetch program requirements rules
        const { data: requirements } = await supabase_1.supabase
            .from('graduation_requirements')
            .select('*')
            .maybeSingle();
        const requiredCredits = requirements ? requirements.min_credits : 120;
        const requiredGpa = requirements ? Number(requirements.min_cgpa) : 6.00;
        const isGpaMet = cgpa >= requiredGpa;
        const isCreditsMet = completedCredits >= requiredCredits;
        const isEligible = isGpaMet && isCreditsMet;
        const { data: audit, error } = await supabase_1.supabase
            .from('graduation_audit')
            .insert({
            student_id: studentId,
            audit_status: isEligible ? 'ELIGIBLE' : 'INCOMPLETE',
            credits_completed: completedCredits,
            cgpa_score: cgpa
        })
            .select()
            .single();
        if (error)
            throw error;
        return audit;
    }
}
exports.DegreeAuditEngine = DegreeAuditEngine;
exports.default = DegreeAuditEngine;
