"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicRepository = void 0;
const StudentAcademicRecord_1 = require("../domain/StudentAcademicRecord");
const supabase_1 = require("../../../config/supabase");
class AcademicRepository {
    async findRecords(studentId) {
        const { data, error } = await supabase_1.supabase
            .from('student_academic_records')
            .select('*')
            .eq('student_id', studentId);
        if (error)
            throw error;
        return (data || []).map((row) => new StudentAcademicRecord_1.StudentAcademicRecord(row.id, row.student_id, row.academic_year_id, row.grade, row.gpa_or_marks, row.remarks, new Date(row.created_at)));
    }
    async saveRecord(record) {
        const { error } = await supabase_1.supabase
            .from('student_academic_records')
            .upsert({
            id: record.id,
            student_id: record.studentId,
            academic_year_id: record.academicYearId,
            grade: record.grade,
            gpa_or_marks: record.gpaOrMarks,
            remarks: record.remarks
        });
        if (error)
            throw error;
    }
}
exports.AcademicRepository = AcademicRepository;
