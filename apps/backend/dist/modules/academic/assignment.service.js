"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignmentService = void 0;
const supabase_1 = require("../../config/supabase");
class AssignmentService {
    static async create(data) {
        const { data: assignment, error } = await supabase_1.supabase
            .from('assignments')
            .insert(data)
            .select()
            .single();
        if (error)
            throw error;
        return assignment;
    }
    static async listBySection(sectionId) {
        const { data, error } = await supabase_1.supabase
            .from('assignments')
            .select('*, subject:subject_id(name), teacher:teacher_user_id(full_name)')
            .eq('section_id', sectionId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data;
    }
    static async listByTeacher(teacherId) {
        const { data, error } = await supabase_1.supabase
            .from('assignments')
            .select('*, subject:subject_id(name), section:section_id(name, class:class_id(name))')
            .eq('teacher_user_id', teacherId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data;
    }
    static async getMyAssignments(studentId) {
        // 1. Get student's section
        const { data: sections } = await supabase_1.supabase
            .from('student_sections')
            .select('section_id')
            .eq('student_id', studentId);
        if (!sections || sections.length === 0)
            return [];
        const sectionIds = sections.map(s => s.section_id);
        // 2. Get assignments for those sections
        const { data, error } = await supabase_1.supabase
            .from('assignments')
            .select('*, subject:subject_id(name), teacher:teacher_user_id(full_name)')
            .in('section_id', sectionIds)
            .order('due_date', { ascending: true });
        if (error)
            throw error;
        return data;
    }
}
exports.AssignmentService = AssignmentService;
