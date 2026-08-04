"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraduationEligibilityEngine = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const supabase_1 = require("../../../../config/supabase");
class GraduationEligibilityEngine extends BaseService_1.BaseService {
    async verifyClearances(studentId, correlationId) {
        this.logInfo(`Running graduation clearance checklists check for student: ${studentId}`, correlationId);
        // Fetch clearance NOC checkmarks list
        const { data: clearances, error } = await supabase_1.supabase
            .from('graduation_clearance_items')
            .select('*')
            .eq('student_id', studentId);
        if (error)
            throw error;
        const expectedTypes = ['Library', 'Finance', 'Hostel', 'Transport', 'Department', 'ExamCell', 'Placement', 'Alumni'];
        const clearedTypes = (clearances || [])
            .filter(c => c.status === 'CLEARED')
            .map(c => c.clearance_type);
        const isFullyCleared = expectedTypes.every(t => clearedTypes.includes(t));
        return isFullyCleared;
    }
}
exports.GraduationEligibilityEngine = GraduationEligibilityEngine;
exports.default = GraduationEligibilityEngine;
