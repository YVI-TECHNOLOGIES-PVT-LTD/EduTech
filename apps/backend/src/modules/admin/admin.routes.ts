import { Router, Request, Response } from 'express';
import { supabase } from '../../config/supabase';
import { checkPermission } from '../../rbac/rbac.middleware';
import { PERMISSIONS } from '../../rbac/permissions';
import { AcademicAssignmentService } from '../academic/academic.service';

export const adminRouter = Router();

// Helper to prevent modifications to CLOSED years
const checkYearNotClosed = async (yearId: string) => {
    const { data: year } = await supabase
        .from('academic_years')
        .select('status')
        .eq('id', yearId)
        .single();

    if (year?.status === 'CLOSED') {
        throw new Error("This academic year is CLOSED and cannot be modified.");
    }
};

// POST /admin/student-section/assign
adminRouter.post('/student-section/assign',
    checkPermission(PERMISSIONS.STUDENT_ASSIGN_SECTION),
    async (req: Request, res: Response) => {
        const { student_id, section_id } = req.body;
        const schoolId = req.context!.user.school_id;
        const performedBy = req.context!.user.id;

        if (!student_id || !section_id) {
            return res.status(400).json({ error: "student_id and section_id are required" });
        }

        try {
            // 1. Resolve Active Academic Year
            const { data: activeYear, error: yearError } = await supabase
                .from('academic_years')
                .select('id, status')
                .eq('school_id', schoolId)
                .eq('is_active', true)
                .maybeSingle();

            if (yearError || !activeYear) {
                return res.status(400).json({ error: "No active academic year found for this school" });
            }

            if (activeYear.status === 'CLOSED') {
                return res.status(403).json({ error: "The active academic year is CLOSED. Please activate a new year." });
            }

            // 2. Check Student exists and is ACTIVE
            const { data: student, error: stuError } = await supabase
                .from('students')
                .select('id, status, admission_id')
                .eq('id', student_id)
                .eq('school_id', schoolId)
                .single();

            if (stuError || !student) {
                return res.status(404).json({ error: "Student not found" });
            }

            if (student.status !== 'active') {
                return res.status(400).json({ error: "Cannot assign section to an inactive student" });
            }

            // 3. Verify Section exists and belongs to the active year (via class)
            const { data: section, error: secError } = await supabase
                .from('sections')
                .select('id, name, class:classes(id, name, academic_year_id)')
                .eq('id', section_id)
                .single();

            if (secError || !section) {
                return res.status(404).json({ error: "Section not found" });
            }

            const sectionYearId = (section.class as any).academic_year_id;
            if (sectionYearId !== activeYear.id) {
                return res.status(400).json({ error: "Selected section does not belong to the current active academic year" });
            }

            // 4. Upsert Assignment
            // We use the unique constraint (student_id, academic_year_id) from Phase-R2 migration
            const { error: upsertError } = await supabase
                .from('student_sections')
                .upsert({
                    student_id,
                    section_id,
                    academic_year_id: activeYear.id
                }, { onConflict: 'student_id, academic_year_id' });

            if (upsertError) throw upsertError;

            // 5. AUTO-SYNC: Map to existing faculty (standard workflow)
            await AcademicAssignmentService.syncStudentWithSectionFaculty(
                student_id,
                section_id,
                activeYear.id
            );

            // 6. Log to Timeline
            if (student.admission_id) {
                const className = (section.class as any).name;
                await supabase.from('admission_audit_logs').insert({
                    admission_id: student.admission_id,
                    action: 'CLASS_ASSIGNED',
                    performed_by: performedBy,
                    remarks: `Manually assigned to Class ${className} - Section ${section.name} via Admin Directory.`
                });
            }

            res.json({ message: "Student assigned to section successfully" });

        } catch (err: any) {
            console.error("[Admin_Assign] Error:", err);
            res.status(500).json({ error: err.message });
        }
    }
);

// POST /admin/students/promote
adminRouter.post('/students/promote',
    checkPermission(PERMISSIONS.STUDENT_ASSIGN_SECTION),
    async (req: Request, res: Response) => {
        const { from_academic_year_id, to_academic_year_id, student_ids, target_section_id, is_dry_run } = req.body;
        const schoolId = req.context!.user.school_id;
        const performedBy = req.context!.user.id;

        if (!from_academic_year_id || !to_academic_year_id || !student_ids || !target_section_id) {
            return res.status(400).json({ error: "Missing required promotion parameters" });
        }

        try {
            // 1. Basic Year Validation
            if (from_academic_year_id === to_academic_year_id) {
                return res.status(400).json({ error: "From and To years cannot be the same" });
            }

            // 2. Safety: Is Target Year CLOSED?
            await checkYearNotClosed(to_academic_year_id);

            // 3. Safety: Prevent promotion if exams are still active in the 'FROM' year
            const today = new Date().toISOString().split('T')[0];
            const { data: activeExams, error: examError } = await supabase
                .from('exams')
                .select('id, name')
                .eq('academic_year_id', from_academic_year_id)
                .gte('end_date', today);

            if (examError) throw examError;
            if (activeExams && activeExams.length > 0) {
                return res.status(400).json({
                    error: `Cannot promote while exams are active for the current year: ${activeExams.map(e => e.name).join(', ')}`
                });
            }

            // 4. Dry Run logic or Execute
            const results = {
                total: student_ids.length,
                promoted: 0,
                skipped: 0,
                errors: [] as string[]
            };

            if (is_dry_run) {
                return res.json({ message: "Dry run successful", results });
            }

            // 5. Batch Promotion
            for (const studentId of student_ids) {
                try {
                    // Check if already promoted
                    const { data: existing } = await supabase
                        .from('student_sections')
                        .select('section_id')
                        .eq('student_id', studentId)
                        .eq('academic_year_id', to_academic_year_id)
                        .maybeSingle();

                    if (existing) {
                        results.skipped++;
                        continue;
                    }

                    // Insert promotion
                    const { error: promoError } = await supabase
                        .from('student_sections')
                        .insert({
                            student_id: studentId,
                            section_id: target_section_id,
                            academic_year_id: to_academic_year_id
                        });

                    if (promoError) throw promoError;

                    // Sync Faculty
                    await AcademicAssignmentService.syncStudentWithSectionFaculty(
                        studentId,
                        target_section_id,
                        to_academic_year_id
                    );

                    // Log to Timeline
                    const { data: student } = await supabase.from('students').select('admission_id').eq('id', studentId).single();
                    if (student?.admission_id) {
                        await supabase.from('admission_audit_logs').insert({
                            admission_id: student.admission_id,
                            action: 'STUDENT_PROMOTED',
                            performed_by: performedBy,
                            remarks: `Promoted to a new academic year section.`
                        });
                    }

                    results.promoted++;
                } catch (err: any) {
                    results.errors.push(`Student ${studentId}: ${err.message}`);
                }
            }

            res.json({ message: "Promotion process completed", results });

        } catch (err: any) {
            console.error("[Admin_Promote] Error:", err);
            res.status(400).json({ error: err.message });
        }
    }
);

// --- ACADEMIC YEAR GOVERNANCE ---

// POST /admin/academic-years/activate
adminRouter.post('/academic-years/activate',
    checkPermission(PERMISSIONS.CLASS_CREATE), // Reusing high-level academic permission
    async (req: Request, res: Response) => {
        const { academic_year_id } = req.body;
        const schoolId = req.context!.user.school_id;
        const userId = req.context!.user.id;

        try {
            // 0. Validate year to activate is DRAFT
            const { data: targetYear } = await supabase
                .from('academic_years')
                .select('status')
                .eq('id', academic_year_id)
                .single();

            if (targetYear?.status !== 'DRAFT') {
                return res.status(400).json({ error: "Only DRAFT academic years can be activated." });
            }

            // 1. Find Current Active Year
            const { data: currentActive } = await supabase
                .from('academic_years')
                .select('id, year_label')
                .eq('school_id', schoolId)
                .eq('is_active', true)
                .maybeSingle();

            if (currentActive) {
                // 2. Validate no exams ongoing in current year
                const today = new Date().toISOString().split('T')[0];
                const { data: activeExams } = await supabase
                    .from('exams')
                    .select('id, name')
                    .eq('academic_year_id', currentActive.id)
                    .gte('end_date', today);

                if (activeExams && activeExams.length > 0) {
                    return res.status(400).json({
                        error: `Cannot switch years while exams are active in ${currentActive.year_label}: ${activeExams.map(e => e.name).join(', ')}`
                    });
                }

                // 3. Deactivate and Close current year
                await supabase
                    .from('academic_years')
                    .update({ is_active: false, status: 'CLOSED' })
                    .eq('id', currentActive.id);
            }

            // 4. Activate new year
            const { error: activeError } = await supabase
                .from('academic_years')
                .update({ is_active: true, status: 'ACTIVE' })
                .eq('id', academic_year_id)
                .eq('school_id', schoolId);

            if (activeError) throw activeError;

            // 5. Log
            await supabase.from('academic_automation_logs').insert({
                school_id: schoolId,
                action: 'ACADEMIC_YEAR_ACTIVATED',
                details: { year_id: academic_year_id },
                performed_by: userId
            });

            res.json({ message: "Academic year activated successfully" });

        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }
);

// POST /admin/academic-years/close
adminRouter.post('/academic-years/close',
    checkPermission(PERMISSIONS.CLASS_CREATE),
    async (req: Request, res: Response) => {
        const { academic_year_id } = req.body;
        const schoolId = req.context!.user.school_id;

        try {
            // 1. Validate year is ACTIVE
            const { data: year } = await supabase
                .from('academic_years')
                .select('id, status, is_active')
                .eq('id', academic_year_id)
                .single();

            if (!year || year.status !== 'ACTIVE') {
                return res.status(400).json({ error: "Only an ACTIVE year can be directly closed." });
            }

            // 2. Check exams
            const today = new Date().toISOString().split('T')[0];
            const { data: activeExams } = await supabase
                .from('exams')
                .select('id')
                .eq('academic_year_id', academic_year_id)
                .gte('end_date', today);

            if (activeExams && activeExams.length > 0) {
                return res.status(400).json({ error: "Cannot close year while exams are ongoing." });
            }

            // 3. Close
            await supabase
                .from('academic_years')
                .update({ is_active: false, status: 'CLOSED' })
                .eq('id', academic_year_id);

            res.json({ message: "Academic year closed successfully" });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }
);
