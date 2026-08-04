"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentService = void 0;
const supabase_1 = require("../../config/supabase");
// Service handling Department entities
class DepartmentService {
    static async getAll(schoolId) {
        // Also fetch reference counts if possible, but for now simple list
        const { data, error } = await supabase_1.supabase
            .from('departments')
            .select('*')
            .eq('school_id', schoolId)
            .order('name');
        if (error)
            throw new Error(error.message);
        return data;
    }
    static async create(schoolId, name) {
        // Check duplicate
        // Supabase UNIQUE constraint will handle it, but we can check explicitly for clean error
        const { data: existing } = await supabase_1.supabase
            .from('departments')
            .select('id')
            .eq('school_id', schoolId)
            .ilike('name', name) // Case insensitive check
            .maybeSingle();
        if (existing)
            throw new Error(`Department '${name}' already exists.`);
        const { data, error } = await supabase_1.supabase
            .from('departments')
            .insert({ school_id: schoolId, name })
            .select()
            .single();
        if (error) {
            if (error.code === '23505')
                throw new Error(`Department '${name}' already exists.`);
            throw new Error(error.message);
        }
        return data;
    }
    static async update(id, schoolId, name) {
        const { data, error } = await supabase_1.supabase
            .from('departments')
            .update({ name })
            .eq('id', id)
            .eq('school_id', schoolId) // Safety
            .select()
            .single();
        if (error) {
            if (error.code === '23505')
                throw new Error(`Department '${name}' already exists.`);
            throw new Error(error.message);
        }
        return data;
    }
    static async delete(id, schoolId) {
        // Safety Check: Dependencies
        // Check Faculty
        const { count: facCount } = await supabase_1.supabase
            .from('faculty_profiles')
            .select('id', { count: 'exact', head: true })
            .eq('department_id', id);
        if (facCount && facCount > 0) {
            throw new Error(`Cannot delete department. It is assigned to ${facCount} faculty members.`);
        }
        // Check Staff
        const { count: staffCount } = await supabase_1.supabase
            .from('staff_profiles')
            .select('id', { count: 'exact', head: true })
            .eq('department_id', id);
        if (staffCount && staffCount > 0) {
            throw new Error(`Cannot delete department. It is assigned to ${staffCount} staff members.`);
        }
        const { error } = await supabase_1.supabase
            .from('departments')
            .delete()
            .eq('id', id)
            .eq('school_id', schoolId);
        if (error)
            throw new Error(error.message);
        return true;
    }
}
exports.DepartmentService = DepartmentService;
