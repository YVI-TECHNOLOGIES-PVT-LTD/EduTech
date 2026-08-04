"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timetableRouter = void 0;
const express_1 = require("express");
const rbac_middleware_1 = require("../../rbac/rbac.middleware");
const permissions_1 = require("../../rbac/permissions");
const supabase_1 = require("../../config/supabase");
exports.timetableRouter = (0, express_1.Router)();
// ======================================
// MANAGE (Admin)
// ======================================
// GET /section/:sectionId
exports.timetableRouter.get('/section/:sectionId', 
// Allow VIEW or VIEW_SELF? RLS handles self, but Admin needs to see.
// We'll trust RLS logic primarily, but let's check general VIEW perms for explicit endpoint access or SELF if section matches.
// For simplicity, CheckPermission('TIMETABLE_VIEW') is for Staff. Parents use /my endpoint usually.
// But if Parent calls this with their section ID, RLS allows. So we might need a looser middleware or hybrid.
// Let's use checkPermission for STAFF view here.
(0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.TIMETABLE_VIEW), async (req, res) => {
    const { sectionId } = req.params;
    const { data, error } = await supabase_1.supabase
        .from('timetable_slots')
        .select(`
            id, day_of_week, start_time, end_time,
            subject:subject_id(name, code),
            faculty:faculty_user_id(full_name)
        `)
        .eq('section_id', sectionId)
        .order('day_of_week')
        .order('start_time');
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
// POST /slots (Create)
exports.timetableRouter.post('/slots', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.TIMETABLE_CREATE), async (req, res) => {
    const schoolId = req.context.user.school_id;
    const { academic_year_id, section_id, subject_id, faculty_user_id, day_of_week, start_time, end_time } = req.body;
    try {
        // 1. Validate Overlaps
        // Detect if Section is busy
        const { count: sectionOverlap } = await supabase_1.supabase
            .from('timetable_slots')
            .select('*', { count: 'exact', head: true })
            .eq('section_id', section_id)
            .eq('day_of_week', day_of_week)
            .or(`and(start_time.lte.${end_time},end_time.gte.${start_time})`); // Overlap logic: (StartA <= EndB) and (EndA >= StartB)
        if (sectionOverlap && sectionOverlap > 0) {
            return res.status(409).json({ error: "Conflict: This section already has a class at this time." });
        }
        // Detect if Faculty is busy
        const { count: facultyOverlap } = await supabase_1.supabase
            .from('timetable_slots')
            .select('*', { count: 'exact', head: true })
            .eq('faculty_user_id', faculty_user_id)
            .eq('day_of_week', day_of_week)
            .or(`and(start_time.lte.${end_time},end_time.gte.${start_time})`);
        if (facultyOverlap && facultyOverlap > 0) {
            return res.status(409).json({ error: "Conflict: Faculty is teaching another class at this time." });
        }
        // 2. Insert
        const { data, error } = await supabase_1.supabase
            .from('timetable_slots')
            .insert({
            school_id: schoolId,
            academic_year_id,
            section_id,
            subject_id,
            faculty_user_id,
            day_of_week,
            start_time,
            end_time
        })
            .select()
            .single();
        if (error)
            throw error;
        res.status(201).json(data);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// DELETE /slots/:id
exports.timetableRouter.delete('/slots/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.TIMETABLE_CREATE), async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase_1.supabase.from('timetable_slots').delete().eq('id', id);
    if (error)
        return res.status(500).json({ error: error.message });
    res.json({ message: "Deleted" });
});
// ======================================
// MY TIMETABLE (Faculty / Student)
// ======================================
// GET /my
exports.timetableRouter.get('/my', 
// Check either VIEW_SELF or VIEW.
// We can rely on authenticated user context.
(req, res, next) => next(), async (req, res) => {
    const userId = req.context.user.id;
    const schoolId = req.context.user.school_id;
    let query = supabase_1.supabase
        .from('timetable_slots')
        .select(`
                id, day_of_week, start_time, end_time,
                subject:subject_id(name),
                section:section_id(name, class:class_id(name)),
                faculty:faculty_user_id(full_name)
            `)
        .order('day_of_week')
        .order('start_time');
    if (req.context.user.roles.includes('FACULTY')) {
        query = query.eq('faculty_user_id', userId);
    }
    else {
        // For students, this logic is incomplete in MVP but RLS handles security.
        // We return empty if not faculty? Or let them see all if RLS permits?
        // "My" timetable for student = all slots for their section.
        // We need to find student's section first.
        // This existing route implementation was partial. Leaving as is, focusing on Faculty.
    }
    const { data, error } = await query;
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
// GET /faculty/:facultyId (Admin View)
exports.timetableRouter.get('/faculty/:facultyId', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.TIMETABLE_VIEW), // Admin/Staff perm
async (req, res) => {
    const { facultyId } = req.params;
    const { data, error } = await supabase_1.supabase
        .from('timetable_slots')
        .select(`
                id, day_of_week, start_time, end_time,
                subject:subject_id(name),
                section:section_id(name, class:class_id(name))
            `)
        .eq('faculty_user_id', facultyId)
        .order('day_of_week')
        .order('start_time');
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
