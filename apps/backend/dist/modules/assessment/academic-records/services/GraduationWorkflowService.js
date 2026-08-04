"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraduationWorkflowService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const GraduationRepository_1 = require("../repositories/GraduationRepository");
const GraduationEligibilityEngine_1 = require("./GraduationEligibilityEngine");
const supabase_1 = require("../../../../config/supabase");
class GraduationWorkflowService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new GraduationRepository_1.GraduationRepository();
        this.eligibilityEngine = new GraduationEligibilityEngine_1.GraduationEligibilityEngine();
    }
    async transitionGraduation(studentId, targetStatus, correlationId) {
        this.logInfo(`Transitioning graduation candidacy status for student: ${studentId} to: ${targetStatus}`, correlationId);
        if (targetStatus === 'APPROVED') {
            const isCleared = await this.eligibilityEngine.verifyClearances(studentId);
            if (!isCleared) {
                throw new Error('Candidacy cannot be approved. Clearance items NOCs remain pending.');
            }
        }
        const candidate = await this.repo.saveCandidate(studentId, targetStatus);
        // Timeline event logs
        await supabase_1.supabase
            .from('student_academic_timeline')
            .insert({
            student_id: studentId,
            event_type: 'GRADUATION_STATUS_CHANGE',
            event_description: `Graduation workflow transitioned to: ${targetStatus}`
        });
        return candidate;
    }
}
exports.GraduationWorkflowService = GraduationWorkflowService;
exports.default = GraduationWorkflowService;
