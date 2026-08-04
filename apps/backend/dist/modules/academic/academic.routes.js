"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.academicRouter = void 0;
const express_1 = require("express");
const rbac_middleware_1 = require("../../rbac/rbac.middleware");
const permissions_1 = require("../../rbac/permissions");
const supabase_1 = require("../../config/supabase");
const assignment_controller_1 = require("./assignment.controller");
const academic_service_1 = require("./academic.service");
const faculty_controller_1 = require("./faculty.controller");
exports.academicRouter = (0, express_1.Router)();
// ======================================
// CLASSES
// ======================================
// GET /classes
exports.academicRouter.get('/classes', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.CLASS_VIEW), async (req, res) => {
    const schoolId = req.context.user.school_id;
    const { data, error } = await supabase_1.supabase
        .from('classes')
        .select(`
                *,
                academic_year:academic_year_id(year_label),
                sections:sections(id, name)
            `)
        .eq('school_id', schoolId)
        .order('name');
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
// POST /classes
exports.academicRouter.post('/classes', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.CLASS_CREATE), async (req, res) => {
    const schoolId = req.context.user.school_id;
    const { name, academic_year_id } = req.body;
    if (!name || !academic_year_id)
        return res.status(400).json({ error: "Missing fields" });
    const { data, error } = await supabase_1.supabase
        .from('classes')
        .insert({ school_id: schoolId, academic_year_id, name })
        .select()
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.status(201).json(data);
});
// ======================================
// SECTIONS
// ======================================
// GET /sections?classId=...
exports.academicRouter.get('/sections', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.SECTION_VIEW), async (req, res) => {
    const classId = req.query.classId;
    if (!classId)
        return res.status(400).json({ error: "classId required" });
    const { data, error } = await supabase_1.supabase
        .from('sections')
        .select(`
                *,
                _count_students:student_sections(count)
            `)
        .eq('class_id', classId)
        .order('name');
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
// POST /sections
exports.academicRouter.post('/sections', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.SECTION_CREATE), async (req, res) => {
    const { class_id, name } = req.body;
    if (!class_id || !name)
        return res.status(400).json({ error: "Missing fields" });
    const { data, error } = await supabase_1.supabase
        .from('sections')
        .insert({ class_id, name })
        .select()
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.status(201).json(data);
});
// ======================================
// ASSIGNMENTS
// ======================================
// GET /academic/faculty (Admin view to list all faculty members)
exports.academicRouter.get('/faculty', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.STUDENT_VIEW), // Using a general staff view permission or specific if added
async (req, res) => {
    const schoolId = req.context.user.school_id;
    const { data, error } = await supabase_1.supabase
        .from('users')
        .select(`
                id, 
                full_name, 
                email,
                user_roles!inner (
                    role:roles!inner (name)
                )
            `)
        .eq('school_id', schoolId)
        .eq('user_roles.role.name', 'FACULTY');
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
// POST /sections/:id/assign-faculty (UPGRADED WITH AUTO-SYNC)
exports.academicRouter.post('/sections/:id/assign-faculty', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ACADEMIC_ASSIGN_FACULTY), async (req, res) => {
    const sectionId = req.params.id;
    const { faculty_user_id } = req.body;
    const performedBy = req.context.user.id;
    try {
        // Fetch academic year for the section
        const { data: section, error: secError } = await supabase_1.supabase
            .from('sections')
            .select('class:classes(academic_year_id)')
            .eq('id', sectionId)
            .single();
        if (secError || !section)
            return res.status(404).json({ error: "Section not found" });
        const academicYearId = section.class.academic_year_id;
        await academic_service_1.AcademicAssignmentService.assignFacultyToSection({
            sectionId,
            facultyId: faculty_user_id,
            academicYearId,
            assignedBy: performedBy
        });
        res.json({ message: "Faculty assigned and students auto-mapped successfully" });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// GET /sections/:id/assignments
exports.academicRouter.get('/sections/:id/assignments', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.SECTION_VIEW), async (req, res) => {
    const sectionId = req.params.id;
    const { data, error } = await supabase_1.supabase
        .from('faculty_sections')
        .select(`
                role,
                faculty:faculty_user_id (id, full_name, email)
            `)
        .eq('section_id', sectionId);
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
// POST /sections/:id/assign-student
exports.academicRouter.post('/sections/:id/assign-student', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.STUDENT_ASSIGN_SECTION), async (req, res) => {
    const sectionId = req.params.id;
    const { student_id } = req.body;
    const userId = req.context.user.id;
    try {
        // 1. Fetch Student to get admission_id
        const { data: student, error: stuError } = await supabase_1.supabase
            .from('students')
            .select('id, admission_id, full_name')
            .eq('id', student_id)
            .single();
        if (stuError || !student)
            return res.status(404).json({ error: "Student not found" });
        // 2. Fetch Section details for the log
        const { data: section, error: secError } = await supabase_1.supabase
            .from('sections')
            .select('name, class:classes(name)')
            .eq('id', sectionId)
            .single();
        if (secError || !section)
            return res.status(404).json({ error: "Section not found" });
        // 3. Check if already assigned (optional but good)
        // Ideally we should check if student is already in a section for this class/year, 
        // but for now we just rely on unique constraint or allow multiple as per existing logic.
        // 4. Assign Student
        const { error } = await supabase_1.supabase
            .from('student_sections')
            .insert({ student_id, section_id: sectionId });
        if (error) {
            if (error.code === '23505')
                return res.status(400).json({ error: "Student already in this section" });
            throw error;
        }
        // 5. AUTO-SYNC: Map to existing faculty
        await academic_service_1.AcademicAssignmentService.syncStudentWithSectionFaculty(student_id, sectionId, section.class.academic_year_id);
        // 6. Log to Timeline (Admission Audit Logs)
        if (student.admission_id) {
            const className = section.class?.name || 'Unknown Class';
            await supabase_1.supabase.from('admission_audit_logs').insert({
                admission_id: student.admission_id,
                action: 'CLASS_ASSIGNED',
                performed_by: userId,
                remarks: `Assigned to Class ${className} - Section ${section.name}. Faculty auto-linked.`
            });
        }
        res.json({ message: "Assigned successfully and faculty mapped" });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// GET /academic/my-students (Faculty View - Derived from student_faculty_assignments)
exports.academicRouter.get('/my-students', async (req, res) => {
    const userId = req.context.user.id;
    const { data, error } = await supabase_1.supabase
        .from('student_faculty_assignments')
        .select(`
                id, source, status,
                student:student_id (
                    id, student_code, full_name,
                    section_info:student_sections (
                        section:section_id (name, class:class_id (name))
                    )
                )
            `)
        .eq('faculty_id', userId)
        .eq('status', 'ACTIVE');
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
// GET /sections/my (Faculty View)
exports.academicRouter.get('/sections/my', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.SECTION_VIEW), async (req, res) => {
    try {
        const { user } = req.context;
        // ADMIN / EXAM CELL / HOI Bypass: Return ALL sections
        if (user.roles.includes('ADMIN') ||
            user.roles.includes('HEAD_OF_INSTITUTE') ||
            user.roles.includes('EXAM_CELL') ||
            user.roles.includes('EXAM_CELL_ADMIN')) {
            const { data, error } = await supabase_1.supabase
                .from('sections')
                .select(`
                        id, name,
                        class:class_id!inner (
                            id, name, school_id,
                            academic_year:academic_year_id(year_label)
                        )
                    `)
                .eq('class.school_id', user.school_id)
                .order('name');
            if (error)
                throw error;
            // Map to match the expected frontend structure: { section: ... }
            const mapped = data.map(s => ({
                status: 'ACTIVE', // Dummy status
                section: s
            }));
            return res.json(mapped);
        }
        // FACULTY: Return assigned sections
        const { data, error } = await supabase_1.supabase
            .from('section_faculty_assignments')
            .select(`
                    status,
                    section:section_id (
                        id, name,
                        class:class_id (name, academic_year:academic_year_id(year_label))
                    )
                `)
            .eq('faculty_id', user.id)
            .eq('status', 'ACTIVE');
        if (error)
            throw error;
        res.json(data);
    }
    catch (err) {
        console.error("GET sections/my error:", err);
        res.status(500).json({ error: err.message || "Internal Server Error" });
    }
});
// ======================================
// CLASS WORK (ASSIGNMENTS)
// ======================================
exports.academicRouter.post('/assignments', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.CLASS_CREATE), // Re-using broad perm or specific if added
assignment_controller_1.AssignmentController.create);
exports.academicRouter.get('/assignments/section/:sectionId', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.SECTION_VIEW), assignment_controller_1.AssignmentController.getBySection);
exports.academicRouter.get('/assignments/teacher/my', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.SECTION_VIEW), assignment_controller_1.AssignmentController.getTeacherAssignments);
exports.academicRouter.get('/assignments/student/:studentId', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.SECTION_VIEW), assignment_controller_1.AssignmentController.getMyAssignments);
// ======================================
// FACULTY PROFILES (ADMIN)
// ======================================
exports.academicRouter.get('/faculty-profiles', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FACULTY_PROFILE_MANAGE), faculty_controller_1.FacultyController.getAllProfiles);
exports.academicRouter.post('/faculty-profiles', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FACULTY_PROFILE_MANAGE), faculty_controller_1.FacultyController.createProfile);
exports.academicRouter.put('/faculty-profiles/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FACULTY_PROFILE_MANAGE), faculty_controller_1.FacultyController.updateProfile);
exports.academicRouter.patch('/faculty-profiles/:id/status', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.FACULTY_PROFILE_MANAGE), faculty_controller_1.FacultyController.updateStatus);
// ======================================
// SUBJECT ASSIGNMENTS (ADMIN)
// ======================================
exports.academicRouter.post('/sections/:sectionId/subjects/:subjectId/assign-faculty', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.SUBJECT_ASSIGN_FACULTY), faculty_controller_1.FacultyController.assignSubject);
exports.academicRouter.get('/sections/:sectionId/subject-faculty', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ACADEMIC_VIEW), faculty_controller_1.FacultyController.getSectionAssignments);
// ======================================
// FACULTY SELF-SERVICE
// ======================================
exports.academicRouter.get('/faculty/my-subjects', faculty_controller_1.FacultyController.getMySubjects);
exports.academicRouter.put('/faculty/my-subjects/:assignmentId', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.SUBJECT_UPDATE_OWN), faculty_controller_1.FacultyController.updateMySubjectAssignment);
