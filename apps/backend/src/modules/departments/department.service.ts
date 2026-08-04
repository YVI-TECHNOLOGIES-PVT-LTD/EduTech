import { supabase } from '../../config/supabase';

// Service handling Department entities
export class DepartmentService {

    static async getAll(schoolId: string) {
        // Also fetch reference counts if possible, but for now simple list
        const { data, error } = await supabase
            .from('departments')
            .select('*')
            .eq('school_id', schoolId)
            .order('name');

        if (error) throw new Error(error.message);
        return data;
    }

    static async create(schoolId: string, name: string) {
        // Check duplicate
        // Supabase UNIQUE constraint will handle it, but we can check explicitly for clean error
        const { data: existing } = await supabase
            .from('departments')
            .select('id')
            .eq('school_id', schoolId)
            .ilike('name', name) // Case insensitive check
            .maybeSingle();

        if (existing) throw new Error(`Department '${name}' already exists.`);

        const { data, error } = await supabase
            .from('departments')
            .insert({ school_id: schoolId, name })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') throw new Error(`Department '${name}' already exists.`);
            throw new Error(error.message);
        }
        return data;
    }

    static async update(id: string, schoolId: string, name: string) {
        const { data, error } = await supabase
            .from('departments')
            .update({ name })
            .eq('id', id)
            .eq('school_id', schoolId) // Safety
            .select()
            .single();

        if (error) {
            if (error.code === '23505') throw new Error(`Department '${name}' already exists.`);
            throw new Error(error.message);
        }
        return data;
    }

    static async delete(id: string, schoolId: string) {
        // Safety Check: Dependencies
        // Check Faculty
        const { count: facCount } = await supabase
            .from('faculty_profiles')
            .select('id', { count: 'exact', head: true })
            .eq('department_id', id);

        if (facCount && facCount > 0) {
            throw new Error(`Cannot delete department. It is assigned to ${facCount} faculty members.`);
        }

        // Check Staff
        const { count: staffCount } = await supabase
            .from('staff_profiles')
            .select('id', { count: 'exact', head: true })
            .eq('department_id', id);

        if (staffCount && staffCount > 0) {
            throw new Error(`Cannot delete department. It is assigned to ${staffCount} staff members.`);
        }

        const { error } = await supabase
            .from('departments')
            .delete()
            .eq('id', id)
            .eq('school_id', schoolId);

        if (error) throw new Error(error.message);
        return true;
    }
}
