"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffService = void 0;
const supabase_1 = require("../../config/supabase");
const queryHelpers_1 = require("../../utils/queryHelpers");
exports.StaffService = {
    async getAllProfiles(schoolId, page = 1, limit = 10, search) {
        let query = supabase_1.supabase
            .from('staff_profiles')
            .select(`
                *,
                user:user_id!inner (id, full_name, email, school_id),
                department:department_id (id, name)
            `, { count: 'exact' })
            .eq('user.school_id', schoolId);
        if (search) {
            query = (0, queryHelpers_1.applySearch)(query, search, ['staff_type']);
        }
        const { from, to } = (0, queryHelpers_1.getPaginationRange)(page, limit);
        query = query.range(from, to).order('created_at', { ascending: false });
        const { data, count, error } = await query;
        if (error)
            throw error;
        return (0, queryHelpers_1.createPaginatedResult)(data, count, page, limit);
    },
    async createProfile(data) {
        // Check if user is STAFF
        // (Optional: We could enforce role check here, but typically admin selects user)
        // Checking connection
        // Check duplicate
        const { data: existing } = await supabase_1.supabase
            .from('staff_profiles')
            .select('id')
            .eq('user_id', data.user_id)
            .maybeSingle();
        if (existing)
            throw new Error('Profile already exists for this user');
        const { data: profile, error } = await supabase_1.supabase
            .from('staff_profiles')
            .insert(data)
            .select()
            .single();
        if (error)
            throw error;
        return profile;
    },
    async updateProfile(id, updates) {
        const { data, error } = await supabase_1.supabase
            .from('staff_profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    async updateStatus(id, status) {
        const { data, error } = await supabase_1.supabase
            .from('staff_profiles')
            .update({ status })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
};
