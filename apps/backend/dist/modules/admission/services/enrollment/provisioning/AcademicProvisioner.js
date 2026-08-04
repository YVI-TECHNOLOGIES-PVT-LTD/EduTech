"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicProvisioner = void 0;
const supabase_1 = require("../../../../../config/supabase");
class AcademicProvisioner {
    async provision(studentId, grade, academicYearId) {
        // Inserts student sections allocations
        const { error } = await supabase_1.supabase
            .from('student_academic_enrollment')
            .insert({
            student_id: studentId,
            grade: grade,
            academic_year_id: academicYearId,
            status: 'Active',
            roll_number: Math.floor(Math.random() * 50) + 1
        });
        if (error && !error.message.includes('does not exist')) {
            throw error;
        }
    }
}
exports.AcademicProvisioner = AcademicProvisioner;
