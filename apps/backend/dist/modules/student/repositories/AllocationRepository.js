"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllocationRepository = void 0;
const StudentAllocation_1 = require("../domain/StudentAllocation");
const supabase_1 = require("../../../config/supabase");
class AllocationRepository {
    async findByStudentId(studentId) {
        const { data, error } = await supabase_1.supabase
            .from('student_class_allocations')
            .select('*')
            .eq('student_id', studentId)
            .maybeSingle();
        if (error)
            throw error;
        return data ? new StudentAllocation_1.StudentAllocation(data.id, data.student_id, data.academic_year_id, data.grade, data.section_id, data.roll_number, new Date(data.allocated_at)) : null;
    }
    async saveAllocation(allocation) {
        const { error } = await supabase_1.supabase
            .from('student_class_allocations')
            .upsert({
            id: allocation.id,
            student_id: allocation.studentId,
            academic_year_id: allocation.academicYearId,
            grade: allocation.grade,
            section_id: allocation.sectionId,
            roll_number: allocation.rollNumber,
            allocated_at: allocation.allocatedAt.toISOString()
        });
        if (error)
            throw error;
    }
    async countSectionStudents(academicYearId, grade, sectionId) {
        const { count, error } = await supabase_1.supabase
            .from('student_class_allocations')
            .select('*', { count: 'exact', head: true })
            .eq('academic_year_id', academicYearId)
            .eq('grade', grade)
            .eq('section_id', sectionId);
        if (error)
            throw error;
        return count || 0;
    }
    async findSequence(schoolId, academicYearId, grade, sectionId) {
        const { data, error } = await supabase_1.supabase
            .from('student_roll_number_sequences')
            .select('*')
            .eq('school_id', schoolId)
            .eq('academic_year_id', academicYearId)
            .eq('grade', grade)
            .eq('section_id', sectionId)
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
    async saveSequence(seq) {
        const { error } = await supabase_1.supabase
            .from('student_roll_number_sequences')
            .upsert({
            id: seq.id,
            school_id: seq.school_id,
            academic_year_id: seq.academic_year_id,
            grade: seq.grade,
            section_id: seq.section_id,
            current_value: seq.current_value
        });
        if (error)
            throw error;
    }
    async saveHistory(history) {
        const { error } = await supabase_1.supabase
            .from('student_section_history')
            .insert(history);
        if (error)
            throw error;
    }
    async findHistory(studentId) {
        const { data, error } = await supabase_1.supabase
            .from('student_section_history')
            .select('*')
            .eq('student_id', studentId)
            .order('transferred_at', { ascending: true });
        if (error)
            throw error;
        return data || [];
    }
}
exports.AllocationRepository = AllocationRepository;
