"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicStandingEngine = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const AcademicStandingRepository_1 = require("../repositories/AcademicStandingRepository");
const supabase_1 = require("../../../../config/supabase");
class AcademicStandingEngine extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new AcademicStandingRepository_1.AcademicStandingRepository();
    }
    async evaluateStanding(schoolId, studentId, cgpa, backlogsCount, correlationId) {
        this.logInfo(`Running academic standing checks for student: ${studentId}`, correlationId);
        // Fetch standing rules parameters
        const { data: rules } = await supabase_1.supabase
            .from('academic_standing_rules')
            .select('*')
            .eq('school_id', schoolId);
        let targetStanding = 'GOOD_STANDING';
        // Check rule ranges (simulate checks)
        if (cgpa >= 9.00) {
            targetStanding = 'HONORS';
        }
        else if (backlogsCount > 2 || cgpa < 5.00) {
            targetStanding = 'PROBATION';
        }
        else if (cgpa < 6.00) {
            targetStanding = 'WARNING';
        }
        const standingRecord = await this.repo.saveStanding(studentId, targetStanding);
        if (targetStanding === 'PROBATION') {
            await this.repo.logWarning(studentId, 'Placed on academic probation due to GPA dropping below threshold.');
            await supabase_1.supabase
                .from('student_probation_history')
                .insert({ student_id: studentId, reason: 'Low CGPA warning' });
        }
        else if (targetStanding === 'HONORS') {
            await supabase_1.supabase
                .from('student_honors_history')
                .insert({ student_id: studentId, honor_title: 'Dean Honors Roll List' });
        }
        return standingRecord;
    }
}
exports.AcademicStandingEngine = AcademicStandingEngine;
exports.default = AcademicStandingEngine;
