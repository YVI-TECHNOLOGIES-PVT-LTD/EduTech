"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacultyService = void 0;
const supabase_1 = require("../../config/supabase");
const queryHelpers_1 = require("../../utils/queryHelpers");
exports.FacultyService = {
    async getAllProfiles(schoolId, page = 1, limit = 10, search) {
        let query = supabase_1.supabase
            .from('faculty_profiles')
            .select(`
                *,
                user:user_id!inner (id, full_name, email, school_id),
                department:department_id (id, name)
            `, { count: 'exact' })
            .eq('user.school_id', schoolId);
        if (search) {
            // Note: Searching across joins in OR clause can be complex. 
            // We search local fields and try to search user fields if possible, 
            // but strict OR across tables logic in PostgREST 9+ works with embedded filters.
            // For safety and compatibility with standard helper, we search local fields primarily.
            // Search employee_code, designation, qualification.
            query = (0, queryHelpers_1.applySearch)(query, search, ['employee_code', 'designation', 'qualification']);
        }
        const { from, to } = (0, queryHelpers_1.getPaginationRange)(page, limit);
        query = query.range(from, to).order('created_at', { ascending: false });
        const { data, count, error } = await query;
        if (error)
            throw error;
        return (0, queryHelpers_1.createPaginatedResult)(data, count, page, limit);
    },
    async createProfile(data) {
        // Check if user is FACULTY
        const { data: user, error: userError } = await supabase_1.supabase
            .from('user_roles')
            .select('role:roles(name)')
            .eq('user_id', data.user_id)
            .eq('role.name', 'FACULTY')
            .single();
        if (userError || !user) {
            throw new Error('User does not have FACULTY role');
        }
        // Check duplicate
        const { data: existing } = await supabase_1.supabase
            .from('faculty_profiles')
            .select('id')
            .eq('user_id', data.user_id)
            .maybeSingle();
        if (existing)
            throw new Error('Profile already exists for this user');
        const { data: profile, error } = await supabase_1.supabase
            .from('faculty_profiles')
            .insert(data)
            .select()
            .single();
        if (error)
            throw error;
        return profile;
    },
    async updateProfile(id, updates) {
        const { data, error } = await supabase_1.supabase
            .from('faculty_profiles')
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
            .from('faculty_profiles')
            .update({ status })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    async assignSubjectToSection(data) {
        // 1. Validate Subject belongs to Section Class
        // Fetch subject class and section class
        const { data: subject, error: subErr } = await supabase_1.supabase
            .from('subjects')
            .select('class_id')
            .eq('id', data.subject_id)
            .single();
        const { data: section, error: secErr } = await supabase_1.supabase
            .from('sections')
            .select('class_id')
            .eq('id', data.section_id)
            .single();
        if (subErr || secErr || !subject || !section)
            throw new Error("Invalid subject or section");
        if (subject.class_id !== section.class_id)
            throw new Error("Subject does not belong to the section's class");
        // 2. Insert
        const { data: assignment, error } = await supabase_1.supabase
            .from('faculty_section_subjects')
            .insert(data)
            .select()
            .single();
        if (error)
            throw error;
        return assignment;
    },
    async getSectionAssignments(sectionId) {
        const { data, error } = await supabase_1.supabase
            .from('faculty_section_subjects')
            .select(`
                *,
                subject:subject_id(name, code),
                faculty:faculty_profile_id(
                    id,
                    designation,
                    user:user_id(full_name, email)
                )
            `)
            .eq('section_id', sectionId);
        if (error)
            throw error;
        return data;
    },
    async getMySubjects(userId) {
        // 1. Get faculty profile id
        const { data: profile } = await supabase_1.supabase
            .from('faculty_profiles')
            .select('id')
            .eq('user_id', userId)
            .single();
        if (!profile)
            return [];
        const { data, error } = await supabase_1.supabase
            .from('faculty_section_subjects')
            .select(`
                *,
                subject:subject_id(name, code),
                section:section_id(name, class:class_id(name))
            `)
            .eq('faculty_profile_id', profile.id);
        if (error)
            throw error;
        return data;
    },
    async updateAssignment(id, updates, userId) {
        // Check ownership
        const { data: assignment, error } = await supabase_1.supabase
            .from('faculty_section_subjects')
            .select(`faculty_profile:faculty_profile_id(items:user_id)`) // Flattening relation issues in Supabase can be tricky.
            // Better: get profile first.
            .eq('id', id)
            .single();
        // Simplified check:
        // 1. Get user's profile
        const { data: profile } = await supabase_1.supabase
            .from('faculty_profiles')
            .select('id')
            .eq('user_id', userId)
            .single();
        if (!profile)
            throw new Error("Profile not found");
        // 2. Update with filter
        const { data, error: upError } = await supabase_1.supabase
            .from('faculty_section_subjects')
            .update(updates)
            .eq('id', id)
            .eq('faculty_profile_id', profile.id)
            .select()
            .single();
        if (upError)
            throw upError;
        return data;
    }
};
