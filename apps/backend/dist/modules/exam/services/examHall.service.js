"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamHallService = void 0;
const supabase_1 = require("../../../config/supabase");
exports.ExamHallService = {
    /**
     * List all halls for a school
     */
    async listHalls(schoolId) {
        // Fetch halls and check for usage in seating allocations
        const { data, error } = await supabase_1.supabase
            .from('exam_halls')
            .select(`
                *,
                usage_count:exam_seating_allocations(count)
            `)
            .eq('school_id', schoolId)
            .order('hall_name');
        if (error)
            throw error;
        return data.map(hall => ({
            ...hall,
            is_in_use: (hall.usage_count?.[0]?.count || 0) > 0
        }));
    },
    /**
     * Create a new hall
     */
    async createHall(hall) {
        if (!hall.hall_name)
            throw new Error("Hall name is required.");
        if (!hall.capacity || hall.capacity <= 0)
            throw new Error("Capacity must be greater than zero.");
        const { data, error } = await supabase_1.supabase
            .from('exam_halls')
            .insert({
            ...hall,
            is_active: hall.is_active ?? true,
            updated_at: new Date().toISOString()
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    /**
     * Update an existing hall
     */
    async updateHall(id, schoolId, updates) {
        if (updates.capacity !== undefined && updates.capacity <= 0) {
            throw new Error("Capacity must be greater than zero.");
        }
        const { data, error } = await supabase_1.supabase
            .from('exam_halls')
            .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
            .eq('id', id)
            .eq('school_id', schoolId)
            .select()
            .single();
        if (error) {
            if (error.message?.includes('CAPACITY_LOCKED'))
                throw new Error("CAPACITY_LOCKED: Cannot reduce capacity after seating allocation.");
            throw error;
        }
        return data;
    },
    /**
     * Delete a hall
     */
    async deleteHall(id, schoolId) {
        const { error } = await supabase_1.supabase
            .from('exam_halls')
            .delete()
            .eq('id', id)
            .eq('school_id', schoolId);
        if (error) {
            if (error.message?.includes('HALL_IN_USE'))
                throw new Error("HALL_IN_USE: Cannot delete hall with existing seating allocations.");
            throw error;
        }
        return { success: true };
    },
    /**
     * Toggle active status
     */
    async toggleActive(id, schoolId) {
        const { data: current } = await supabase_1.supabase
            .from('exam_halls')
            .select('is_active')
            .eq('id', id)
            .eq('school_id', schoolId)
            .single();
        if (!current)
            throw new Error("Hall not found.");
        const { data, error } = await supabase_1.supabase
            .from('exam_halls')
            .update({ is_active: !current.is_active, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('school_id', schoolId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
};
